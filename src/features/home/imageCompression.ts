import {
  COMPRESSION_QUALITIES,
  COMPRESSION_TARGETS,
  EXTENSION_BY_TYPE,
  IMAGE_RULES,
  INLINE_COMPRESSION_QUALITIES,
  INLINE_IMAGE_MAX_BYTES,
  INLINE_IMAGE_MAX_BYTES_LABEL,
  INLINE_IMAGE_TARGETS,
  type ImageKind,
} from './constants'
import type { ImageContentType } from './types'

export type CompressedImage = {
  file: File
  width: number
  height: number
  size: number
  contentType: ImageContentType
}

export type CompressImageResult =
  | { ok: true; image: CompressedImage }
  | { ok: false; message: string }

type Drawable = {
  source: CanvasImageSource
  release: () => void
}

/**
 * Fits the source inside the kind's compression ceiling while keeping the
 * aspect ratio. Rounding can land just outside the allowed aspect range, so the
 * result is nudged back inside it.
 */
export function compressionDimensions(
  width: number,
  height: number,
  kind: ImageKind,
  target = COMPRESSION_TARGETS[kind],
  enforceMinimum = true,
): { width: number; height: number } {
  const rule = IMAGE_RULES[kind]
  const scale = Math.min(1, target.maxWidth / width, target.maxHeight / height)

  let targetWidth = Math.max(1, Math.round(width * scale))
  let targetHeight = Math.max(1, Math.round(height * scale))

  if (targetWidth / targetHeight > rule.maxAspect) {
    targetWidth = Math.floor(targetHeight * rule.maxAspect)
  } else if (targetWidth / targetHeight < rule.minAspect) {
    targetHeight = Math.floor(targetWidth / rule.minAspect)
  }

  // Storage keeps the original when a downscale would fall below the source
  // minimum. Inline mode intentionally allows that: the source already passed
  // the minimum check, and fitting inside the inline box keeps the document
  // small. The public hero/cards use object-cover, so the aspect is preserved.
  if (enforceMinimum && (targetWidth < rule.minWidth || targetHeight < rule.minHeight)) {
    return { width, height }
  }

  return { width: targetWidth, height: targetHeight }
}

async function loadDrawable(file: File): Promise<Drawable> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      return { source: bitmap, release: () => bitmap.close() }
    } catch {
      // Fall through to the Image element path.
    }
  }

  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('decode-failed'))
      element.src = url
    })
    return { source: image, release: () => URL.revokeObjectURL(url) }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('encode-failed'))
      },
      'image/jpeg',
      quality,
    )
  })
}

/**
 * Downscales and re-encodes an already-decoded image. JPEG is used because it is
 * universally supported by the Canvas encoder and these are photographic slots.
 * The caller revalidates the result before it can be saved.
 */
export async function compressImage(
  file: File,
  kind: ImageKind,
  dimensions: { width: number; height: number },
  mode: 'storage' | 'inline' = 'storage',
): Promise<CompressImageResult> {
  const inline = mode === 'inline'
  const rule = IMAGE_RULES[kind]
  const targetConfig = inline ? INLINE_IMAGE_TARGETS[kind] : COMPRESSION_TARGETS[kind]
  const maxBytes = inline ? INLINE_IMAGE_MAX_BYTES[kind] : rule.maxBytes
  const maxBytesLabel = inline ? INLINE_IMAGE_MAX_BYTES_LABEL[kind] : rule.maxBytesLabel
  const qualities = inline ? INLINE_COMPRESSION_QUALITIES : COMPRESSION_QUALITIES
  const target = compressionDimensions(
    dimensions.width,
    dimensions.height,
    kind,
    targetConfig,
    !inline,
  )

  let drawable: Drawable
  try {
    drawable = await loadDrawable(file)
  } catch {
    return {
      ok: false,
      message: 'This image could not be decoded. Choose a different file.',
    }
  }

  try {
    const canvas = document.createElement('canvas')
    canvas.width = target.width
    canvas.height = target.height

    const context = canvas.getContext('2d')
    if (!context) {
      return {
        ok: false,
        message: 'The image could not be optimized in this browser. Choose a smaller file.',
      }
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    // JPEG has no alpha channel; flatten transparency onto white.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, target.width, target.height)
    context.drawImage(drawable.source, 0, 0, target.width, target.height)

    for (const quality of qualities) {
      const blob = await canvasToBlob(canvas, quality)
      if (blob.size <= maxBytes) {
        const contentType: ImageContentType =
          blob.type === 'image/png'
            ? 'image/png'
            : blob.type === 'image/webp'
              ? 'image/webp'
              : 'image/jpeg'
        const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'
        return {
          ok: true,
          image: {
            file: new File([blob], `${baseName}.${EXTENSION_BY_TYPE[contentType]}`, {
              type: contentType,
              lastModified: file.lastModified,
            }),
            width: target.width,
            height: target.height,
            size: blob.size,
            contentType,
          },
        }
      }
    }

    return {
      ok: false,
      message: `The image could not be reduced below ${maxBytesLabel}. Choose a smaller file.`,
    }
  } catch {
    return {
      ok: false,
      message: 'The image could not be optimized. Choose a smaller file.',
    }
  } finally {
    drawable.release()
  }
}
