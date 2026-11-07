import { useCallback, useEffect, useRef, useState } from 'react'
import { getSettings, saveSettings } from './settingsService'
import type { SettingsDraft, SiteSettings, SettingsStatus } from './types'
import { EMPTY_SETTINGS } from './defaults'
import { SettingsError, mapFirestoreErrorToSettingsCode } from './errors'

export type UseSettingsResult = {
  status: SettingsStatus
  settings: SiteSettings
  exists: boolean
  error: string | null
  reload: () => Promise<void>
  save: (
    values: SettingsDraft,
    uid: string,
    previous: SiteSettings | null,
  ) => Promise<null | SettingsError>
}

export function useSettings(): UseSettingsResult {
  const [status, setStatus] = useState<SettingsStatus>('loading')
  const [settings, setSettings] = useState<SiteSettings>(EMPTY_SETTINGS)
  const [exists, setExists] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const loadRequestRef = useRef(0)

  const load = useCallback(async (showLoading: boolean) => {
    const requestId = ++loadRequestRef.current
    if (showLoading) {
      setStatus('loading')
      setError(null)
    }
    try {
      const { settings: next, exists: nextExists } = await getSettings()
      if (requestId !== loadRequestRef.current) return
      setSettings(next)
      setExists(nextExists)
      setStatus('ready')
    } catch (err) {
      if (requestId !== loadRequestRef.current) return
      if (err instanceof SettingsError) {
        setError(err.message)
      } else {
        const mapped = mapFirestoreErrorToSettingsCode('unknown')
        setError(mapped)
      }
      setStatus('error')
    }
  }, [])

  const reload = useCallback(() => load(true), [load])

  const save = async (values: SettingsDraft, uid: string) => {
    if (status === 'saving') return null
    loadRequestRef.current += 1
    setStatus('saving')
    setError(null)
    try {
      const saved = await saveSettings(values, uid, settings)
      setSettings(saved)
      setExists(true)
      setStatus('ready')
      return null
    } catch (err) {
      if (err instanceof SettingsError) {
        setError(err.message)
        setStatus('ready')
        return err
      }
      const mapped = mapFirestoreErrorToSettingsCode('unknown')
      setError(mapped)
      setStatus('ready')
      return new SettingsError('unknown')
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

  return { status, settings, exists, error, reload, save }
}
