import { useEffect, useId, useState } from 'react'
import {
  iconifyIconUrl,
  iconifyLabel,
  iconifySlug,
  isIconifyIconName,
  searchMaterialIcons,
  type IconifyIcon,
} from '../../lib/iconify'
import type { SelectOption } from './SelectField'

const SEARCH_DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2

type SearchStatus = 'idle' | 'loading' | 'error'

export type IconPickerProps = {
  id?: string
  label: string
  /**
   * Curated icon names the public site renders from its self-hosted subset.
   * They are always listed first; the internet search adds everything else.
   */
  options: readonly SelectOption[]
  value: string
  onChange: (value: string) => void
  /** When set, adds a tile that stores an empty value, e.g. "Keep current icon". */
  emptyLabel?: string
  hint?: string
  error?: string
  disabled?: boolean
}

type IconTileProps = {
  groupName: string
  name: string
  label: string
  checked: boolean
  disabled: boolean
  preview: 'none' | 'font' | 'iconify'
  onChange: (value: string) => void
}

function IconTile({
  groupName,
  name,
  label,
  checked,
  disabled,
  preview,
  onChange,
}: IconTileProps) {
  const previewUrl = preview === 'iconify' ? iconifyIconUrl(name) : null

  return (
    <label
      className={[
        'flex cursor-pointer items-center gap-2 rounded-control border-[1.5px] px-3 py-2 transition-colors focus-within:ring-2 focus-within:ring-on-surface focus-within:ring-offset-1',
        checked
          ? 'border-primary-container bg-primary-fixed/50 text-on-surface'
          : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low',
        disabled ? 'cursor-not-allowed opacity-60' : '',
      ].join(' ')}
    >
      <input
        type="radio"
        name={groupName}
        value={name}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(name)}
        className="sr-only"
      />
      {preview === 'font' ? (
        <span aria-hidden="true" className="material-symbols-outlined text-xl">
          {name}
        </span>
      ) : null}
      {previewUrl ? (
        <img
          src={previewUrl}
          alt=""
          aria-hidden="true"
          width={24}
          height={24}
          loading="lazy"
          className="h-6 w-6 shrink-0"
        />
      ) : null}
      <span className="min-w-0 truncate font-body-sm text-body-sm">{label}</span>
    </label>
  )
}

/**
 * Searchable single-select for a Material Symbols icon name.
 *
 * The curated tiles mirror the public site's self-hosted font subset. Typing
 * also searches Iconify's Material Symbols catalog, so any glyph can be found
 * by keyword; a chosen result is stored as `material-symbols:<slug>` and the
 * public site renders it as an on-demand SVG.
 */
export function IconPicker({
  id,
  label,
  options,
  value,
  onChange,
  emptyLabel,
  hint,
  error,
  disabled = false,
}: IconPickerProps) {
  const generatedId = useId()
  const rootId = id ?? generatedId
  const searchId = `${rootId}-search`
  const labelId = `${rootId}-label`
  const groupName = `${rootId}-options`
  const errorId = `${rootId}-error`
  const hintId = `${rootId}-hint`
  const statusId = `${rootId}-status`

  const [query, setQuery] = useState('')
  const [remoteIcons, setRemoteIcons] = useState<IconifyIcon[]>([])
  const [status, setStatus] = useState<SearchStatus>('idle')

  const trimmed = query.trim()
  const needle = trimmed.toLowerCase()
  const canSearch = needle.length >= MIN_QUERY_LENGTH

  useEffect(() => {
    if (!canSearch) {
      return
    }

    const controller = new AbortController()
    let active = true

    const timer = setTimeout(() => {
      setStatus('loading')
      searchMaterialIcons(trimmed, controller.signal)
        .then((icons) => {
          if (!active) return
          setRemoteIcons(icons)
          setStatus('idle')
        })
        .catch(() => {
          if (!active || controller.signal.aborted) return
          setRemoteIcons([])
          setStatus('error')
        })
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      active = false
      clearTimeout(timer)
      controller.abort()
    }
  }, [trimmed, canSearch])

  const matches =
    needle === ''
      ? options
      : options.filter(
          (option) =>
            option.value.toLowerCase().includes(needle) ||
            option.label.toLowerCase().includes(needle),
        )

  // Iconify names use hyphens while the curated list uses underscores.
  const curatedSlugs = new Set(
    options.map((option) => option.value.replace(/_/g, '-')),
  )
  const remoteMatches = remoteIcons.filter(
    (icon) => icon.value !== value && !curatedSlugs.has(iconifySlug(icon.value)),
  )

  const selectedCustom = isIconifyIconName(value) ? value : ''
  const describedBy =
    [error ? errorId : null, hint && !error ? hintId : null]
      .filter(Boolean)
      .join(' ') || undefined

  const statusMessage =
    status === 'loading'
      ? 'Searching Material Symbols…'
      : status === 'error'
        ? 'Icon search is unavailable right now. Try again.'
        : canSearch && remoteMatches.length === 0
          ? `No icons found for “${trimmed}”. Try a different word.`
          : ''

  return (
    <div
      id={rootId}
      tabIndex={-1}
      className="flex flex-col space-y-1.5 focus:outline-none"
    >
      <span
        id={labelId}
        className="font-label-sm text-label-sm font-semibold text-on-surface"
      >
        {label}
      </span>

      <div
        className={[
          'rounded-control border-[1.5px] bg-surface-container-lowest p-3 shadow-sm',
          error ? 'border-primary-container' : 'border-outline-variant',
        ].join(' ')}
      >
        <label htmlFor={searchId} className="sr-only">
          Search icons
        </label>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search any icon, e.g. cctv camera…"
          disabled={disabled}
          aria-describedby={[describedBy, statusId].filter(Boolean).join(' ')}
          className="h-10 w-full rounded-control border border-outline-variant bg-surface-container-lowest px-3 font-body-sm text-body-sm text-on-surface placeholder:text-secondary/60 focus:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-on-surface focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <fieldset aria-labelledby={labelId} className="mt-3 min-w-0 border-0 p-0">
          <legend className="sr-only">{label}</legend>
          <div
            className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3"
            aria-describedby={describedBy}
          >
            {emptyLabel ? (
              <IconTile
                groupName={groupName}
                name=""
                label={emptyLabel}
                checked={value === ''}
                disabled={disabled}
                preview="none"
                onChange={onChange}
              />
            ) : null}
            {selectedCustom ? (
              <IconTile
                groupName={groupName}
                name={selectedCustom}
                label={`${iconifyLabel(selectedCustom)} (selected)`}
                checked
                disabled={disabled}
                preview="iconify"
                onChange={onChange}
              />
            ) : null}
            {matches.map((option) => (
              <IconTile
                key={option.value}
                groupName={groupName}
                name={option.value}
                label={option.label}
                checked={value === option.value}
                disabled={disabled}
                preview="font"
                onChange={onChange}
              />
            ))}
          </div>
        </fieldset>

        {canSearch ? (
          <div className="mt-3 border-t border-outline-variant pt-3">
            <p className="font-label-sm text-label-sm font-semibold text-on-surface">
              More from Material Symbols
            </p>
            <p
              id={statusId}
              role="status"
              aria-live="polite"
              className="mt-1 font-body-sm text-body-sm text-secondary"
            >
              {statusMessage}
            </p>
            {remoteMatches.length > 0 ? (
              <div className="mt-2 grid max-h-56 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                {remoteMatches.map((icon) => (
                  <IconTile
                    key={icon.value}
                    groupName={groupName}
                    name={icon.value}
                    label={icon.label}
                    checked={value === icon.value}
                    disabled={disabled}
                    preview="iconify"
                    onChange={onChange}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {error ? (
        <p id={errorId} className="font-body-sm text-body-sm text-primary-container">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="font-body-sm text-body-sm text-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
