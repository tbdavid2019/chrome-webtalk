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
