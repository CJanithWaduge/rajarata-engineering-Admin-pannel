/**
 * Media storage mode for the Home page.
 *
 * Firebase Storage requires the Blaze plan and a provisioned bucket. On the
 * Spark plan that is not available, so the panel keeps compressed images as
 * data URLs inside the `site/home` document. Inline mode is therefore the
 * default; set `VITE_FIREBASE_INLINE_MEDIA=false` once Storage exists to use
 * the upload path. This module is deliberately tiny and reads
 * `import.meta.env` directly: tests import the image pipeline without the full
 * env validation.
 */
export const INLINE_MEDIA_ENABLED =
  import.meta.env.VITE_FIREBASE_INLINE_MEDIA !== 'false'
