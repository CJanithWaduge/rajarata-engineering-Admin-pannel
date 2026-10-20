import { useEffect, useState } from 'react'
import { getSettings, saveSettings } from './settingsService'
import type { SettingsFormValues, SiteSettings, SettingsStatus } from './types'
import { EMPTY_SETTINGS } from './defaults'
import { SettingsError, mapFirestoreErrorToSettingsCode } from './errors'

export type UseSettingsResult = {
  status: SettingsStatus
  settings: SiteSettings
  exists: boolean
  error: string | null
  reload: () => Promise<void>
  save: (values: SettingsFormValues, uid: string) => Promise<null | SettingsError>
}

export function useSettings(): UseSettingsResult {
  const [status, setStatus] = useState<SettingsStatus>('loading')
  const [settings, setSettings] = useState<SiteSettings>(EMPTY_SETTINGS)
  const [exists, setExists] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const reload = async () => {
    setStatus('loading')
    setError(null)
    try {
      const { settings: next, exists: nextExists } = await getSettings()
      setSettings(next)
      setExists(nextExists)
      setStatus('ready')
    } catch (err) {
      if (err instanceof SettingsError) {
        setError(err.message)
      } else {
        const mapped = mapFirestoreErrorToSettingsCode('unknown')
        setError(mapped)
      }
      setStatus('error')
    }
  }

  const save = async (values: SettingsFormValues, uid: string) => {
    if (status === 'saving') return null
    setStatus('saving')
    setError(null)
    try {
      const saved = await saveSettings(values, uid)
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
    void reload()
  }, [])

  return { status, settings, exists, error, reload, save }
}
