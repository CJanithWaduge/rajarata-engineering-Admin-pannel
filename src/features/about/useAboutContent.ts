import { useCallback, useEffect, useRef, useState } from 'react'
import { getAboutContent, saveAboutContent } from './aboutContentService'
import { AboutError } from './errors'
import type { AboutContent, AboutDraft, AboutStatus } from './types'

export type UseAboutContentResult = {
  status: AboutStatus
  content: AboutContent | null
  exists: boolean
  error: string | null
  /** Increments after every successful load or save so the form can remount. */
  version: number
  reload: () => Promise<void>
  save: (draft: AboutDraft, uid: string) => Promise<null | AboutError>
}

export function useAboutContent(): UseAboutContentResult {
  const [status, setStatus] = useState<AboutStatus>('loading')
  const [content, setContent] = useState<AboutContent | null>(null)
  const [exists, setExists] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const savingRef = useRef(false)
  const loadRequestRef = useRef(0)

  const load = useCallback(async (showLoading: boolean) => {
    const requestId = ++loadRequestRef.current
    if (showLoading) {
      setStatus('loading')
      setError(null)
    }
    try {
      const result = await getAboutContent()
      if (requestId !== loadRequestRef.current) return
      setContent(result.content)
      setExists(result.exists)
      setVersion((current) => current + 1)
      setStatus('ready')
    } catch (err) {
      if (requestId !== loadRequestRef.current) return
      if (err instanceof AboutError) {
        setError(err.message)
      } else {
        setError(new AboutError('unknown').message)
      }
      setStatus('error')
    }
  }, [])

  const reload = useCallback(() => load(true), [load])

  const save = async (draft: AboutDraft, uid: string) => {
    // The button is disabled while saving, but a double-click can land before
    // the isSaving prop re-renders. This ref closes that window synchronously.
    if (savingRef.current) {
      return new AboutError('unknown', 'A save is already in progress.')
    }

    savingRef.current = true
    loadRequestRef.current += 1
    setStatus('saving')
    setError(null)

    try {
      const saved = await saveAboutContent(draft, uid, content)
      setContent(saved)
      setExists(true)
      setVersion((current) => current + 1)
      setStatus('ready')
      return null
    } catch (err) {
      const aboutError = err instanceof AboutError ? err : new AboutError('unknown')
      setError(aboutError.message)
      setStatus('ready')
      return aboutError
    } finally {
      savingRef.current = false
    }
  }

  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => {
      if (active) return load(false)
    })
    return () => {
      active = false
      loadRequestRef.current += 1
    }
  }, [load])

  return { status, content, exists, error, version, reload, save }
}
