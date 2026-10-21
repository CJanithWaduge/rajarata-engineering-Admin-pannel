import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { Toast } from '../Toast'

describe('Toast', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('dismisses itself after the duration', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()

    render(<Toast message="Successfully saved changes" onDismiss={onDismiss} duration={4000} />)

    expect(screen.getByRole('status')).toHaveTextContent('Successfully saved changes')
    expect(onDismiss).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
