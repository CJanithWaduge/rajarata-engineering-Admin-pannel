import { useCallback, useEffect, useRef, useState } from 'react'
import { getServicesContent, saveServicesContent } from './servicesContentService'
import { ServicesError } from './errors'
import type {
  ServicesContent,
  ServicesFormValues,
  ServicesStatus,
} from './types'

export type UseServicesContentResult = {
  status: ServicesStatus
  content: ServicesContent | null
  exists: boolean
  error: string | null
  /** Increments after every successful load or save so the form can remount. */
  version: number
  reload: () => Promise<void>
  save: (
    values: ServicesFormValues,
    uid: string,
  ) => Promise<null | ServicesError>
}

export function useServicesContent(): UseServicesContentResult {
  const [status, setStatus] = useState<ServicesStatus>('loading')
  const [content, setContent] = useState<ServicesContent | null>(null)
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
      const result = await getServicesContent()
      if (requestId !== loadRequestRef.current) return
      setContent(result.content)
      setExists(result.exists)
      setVersion((current) => current + 1)
      setStatus('ready')
    } catch (err) {
      if (requestId !== loadRequestRef.current) return
      if (err instanceof ServicesError) {
        setError(err.message)
      } else {
        setError(new ServicesError('unknown').message)
      }
      setStatus('error')
    }
  }, [])

  const reload = useCallback(() => load(true), [load])

  const save = async (values: ServicesFormValues, uid: string) => {
    // The button is disabled while saving, but a double-click can land before
    // the isSaving prop re-renders. This ref closes that window synchronously.
    if (savingRef.current) {
      return new ServicesError('unknown', 'A save is already in progress.')
    }

    savingRef.current = true
    loadRequestRef.current += 1
    setStatus('saving')
    setError(null)

    try {
      const saved = await saveServicesContent(values, uid)
      setContent(saved)
      setExists(true)
      setVersion((current) => current + 1)
      setStatus('ready')
      return null
    } catch (err) {
      const servicesError =
        err instanceof ServicesError ? err : new ServicesError('unknown')
      setError(servicesError.message)
      setStatus('ready')
      return servicesError
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
