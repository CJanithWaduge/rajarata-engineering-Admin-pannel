import { useEffect, useRef, useState } from 'react'
import { getHomeContent, saveHomeContent } from './homeContentService'
import { HomeError } from './errors'
import type { HomeContent, HomeDraft, HomeStatus } from './types'

export type UseHomeContentResult = {
  status: HomeStatus
  content: HomeContent | null
  exists: boolean
  error: string | null
  /** Increments after every successful load or save so the form can remount. */
  version: number
  reload: () => Promise<void>
  save: (draft: HomeDraft, uid: string) => Promise<null | HomeError>
}

export function useHomeContent(): UseHomeContentResult {
  const [status, setStatus] = useState<HomeStatus>('loading')
  const [content, setContent] = useState<HomeContent | null>(null)
  const [exists, setExists] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const savingRef = useRef(false)

  const reload = async () => {
    setStatus('loading')
    setError(null)
    try {
      const result = await getHomeContent()
      setContent(result.content)
      setExists(result.exists)
      setVersion((current) => current + 1)
      setStatus('ready')
    } catch (err) {
      if (err instanceof HomeError) {
        setError(err.message)
      } else {
        setError(new HomeError('unknown').message)
      }
      setStatus('error')
    }
  }

  const save = async (draft: HomeDraft, uid: string) => {
    // The button is disabled while saving, but a double-click can land before
    // the isSaving prop re-renders. This ref closes that window synchronously.
    if (savingRef.current) {
      return new HomeError('unknown', 'A save is already in progress.')
    }

    savingRef.current = true
    setStatus('saving')
    setError(null)

    try {
      const saved = await saveHomeContent(draft, uid, content)
      setContent(saved)
      setExists(true)
      setVersion((current) => current + 1)
      setStatus('ready')
      return null
    } catch (err) {
      const homeError = err instanceof HomeError ? err : new HomeError('unknown')
      setError(homeError.message)
      setStatus('ready')
      return homeError
    } finally {
      savingRef.current = false
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  return { status, content, exists, error, version, reload, save }
}
