import { useCallback, useEffect, useState } from 'react'

const OFFSET_EVENT = 'webtalk:floating-offset'
const OFFSET_STORAGE_KEY = 'webtalk-floating-offset'

const readInitialOffset = () => {
  if (typeof window === 'undefined') return 0
  const stored = window.localStorage?.getItem(OFFSET_STORAGE_KEY)
  const parsed = stored ? Number(stored) : 0
  return Number.isFinite(parsed) ? parsed : 0
}

export const useFloatingDockOffset = () => {
  const [offset, setOffset] = useState(() => readInitialOffset())

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<number>).detail
      if (typeof detail === 'number' && !Number.isNaN(detail)) {
        setOffset(detail)
      }
    }
    window.addEventListener(OFFSET_EVENT, handler as EventListener)
    return () => {
      window.removeEventListener(OFFSET_EVENT, handler as EventListener)
    }
  }, [])

  const updateOffset = useCallback((next: number) => {
    if (typeof window === 'undefined') return
    const value = Number.isFinite(next) ? next : 0
    window.localStorage?.setItem(OFFSET_STORAGE_KEY, value.toString())
    window.dispatchEvent(new CustomEvent(OFFSET_EVENT, { detail: value }))
    setOffset(value)
  }, [])

  return [offset, updateOffset] as const
}

const PLACEMENT_EVENT = 'webtalk:floating-placement'
const PLACEMENT_STORAGE_KEY = 'webtalk-floating-placement'

export type DockPlacement = 'right' | 'left'

export const readInitialPlacement = (defaultPlacement: DockPlacement = 'right'): DockPlacement => {
  if (typeof window === 'undefined') return defaultPlacement
  const stored = window.localStorage?.getItem(PLACEMENT_STORAGE_KEY)
  if (stored === 'left' || stored === 'right') return stored
  return defaultPlacement
}

export const useFloatingDockPlacement = (defaultPlacement: DockPlacement = 'right') => {
  const [placement, setPlacement] = useState<DockPlacement>(() => readInitialPlacement(defaultPlacement))

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<DockPlacement>).detail
      if (detail === 'left' || detail === 'right') {
        setPlacement(detail)
      }
    }
    window.addEventListener(PLACEMENT_EVENT, handler as EventListener)
    return () => {
      window.removeEventListener(PLACEMENT_EVENT, handler as EventListener)
    }
  }, [])

  const updatePlacement = useCallback((next: DockPlacement) => {
    if (typeof window === 'undefined') return
    const value: DockPlacement = next === 'left' ? 'left' : 'right'
    window.localStorage?.setItem(PLACEMENT_STORAGE_KEY, value)
    window.dispatchEvent(new CustomEvent(PLACEMENT_EVENT, { detail: value }))
    setPlacement(value)
  }, [])

  return [placement, updatePlacement] as const
}
