import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { clearIconSearchCache } from '../../../lib/iconify'
import { IconPicker } from '../IconPicker'

const OPTIONS = [
  { value: 'home_repair_service', label: 'Home Repair Service' },
  { value: 'security', label: 'Security' },
  { value: 'electric_meter', label: 'Electric Meter' },
]

function stubFetch(iconsFor: (url: string) => string[]) {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString()
      return {
        ok: true,
        status: 200,
        json: async () => ({ icons: iconsFor(url) }),
      } as unknown as Response
    },
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderPicker(value = '') {
  const onChange = vi.fn()
  render(
    <IconPicker
      id="icon"
      label="Icon"
      options={OPTIONS}
      value={value}
      onChange={onChange}
      emptyLabel="Keep current icon"
    />,
  )
  return { onChange }
}

beforeEach(() => {
  clearIconSearchCache()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('IconPicker', () => {
  it('lists every curated icon plus the keep-current choice', () => {
    renderPicker()

    expect(screen.getByRole('radio', { name: 'Keep current icon' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(OPTIONS.length + 1)
  })

  it('filters the curated tiles as the admin searches', async () => {
    const user = userEvent.setup()
    stubFetch(() => [])
    renderPicker()

    await user.type(screen.getByLabelText('Search icons'), 'meter')

    expect(screen.getByRole('radio', { name: 'Electric Meter' })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: 'Security' })).not.toBeInTheDocument()
    // The blank choice stays available while filtering.
    expect(screen.getByRole('radio', { name: 'Keep current icon' })).toBeInTheDocument()
  })

  it('reports the chosen curated icon name', async () => {
    const user = userEvent.setup()
    const { onChange } = renderPicker()

    await user.click(screen.getByRole('radio', { name: 'Security' }))

    expect(onChange).toHaveBeenCalledWith('security')
  })

  it('marks the stored curated value as checked', () => {
    renderPicker('security')

    expect(screen.getByRole('radio', { name: 'Security' })).toBeChecked()
  })

  it('searches the internet after the debounce and lists results', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(() => [
      'material-symbols:camera',
      'material-symbols:videocam',
    ])
    renderPicker()

    await user.type(screen.getByLabelText('Search icons'), 'camera')

    expect(
      await screen.findByRole('radio', { name: 'Camera' }, { timeout: 2000 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Videocam' })).toBeInTheDocument()

    const requested = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(requested.searchParams.get('query')).toBe('camera')
    expect(requested.searchParams.get('prefixes')).toBe('material-symbols')
  })

  it('saves an internet result as a Material Symbols icon name', async () => {
    const user = userEvent.setup()
    stubFetch(() => ['material-symbols:camera'])
    const { onChange } = renderPicker()

    await user.type(screen.getByLabelText('Search icons'), 'camera')
    await user.click(await screen.findByRole('radio', { name: 'Camera' }))

    expect(onChange).toHaveBeenCalledWith('material-symbols:camera')
  })

  it('falls back to individual words when the full phrase has no match', async () => {
    const user = userEvent.setup()
    const requestedQueries: string[] = []
    stubFetch((url) => {
      const query = new URL(url).searchParams.get('query') ?? ''
      requestedQueries.push(query)
      return query === 'camera' ? ['material-symbols:camera'] : []
    })
    renderPicker()

    await user.type(screen.getByLabelText('Search icons'), 'cctv camera')

    expect(
      await screen.findByRole('radio', { name: 'Camera' }, { timeout: 2000 }),
    ).toBeInTheDocument()
    expect(requestedQueries).toEqual(['cctv camera', 'camera'])
  })

  it('shows the selected internet icon even when it is not in the results', () => {
    renderPicker('material-symbols:videocam')

    expect(
      screen.getByRole('radio', { name: 'Videocam (selected)' }),
    ).toBeChecked()
  })

  it('reports when the internet search fails', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline')
      }),
    )
    renderPicker()

    await user.type(screen.getByLabelText('Search icons'), 'camera')

    expect(
      await screen.findByText(/Icon search is unavailable/),
    ).toBeInTheDocument()
  })

  it('does not search until the query has two characters', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(() => [])
    renderPicker()

    await user.type(screen.getByLabelText('Search icons'), 'c')

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
