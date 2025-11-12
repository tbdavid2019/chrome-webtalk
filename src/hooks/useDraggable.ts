import { clamp, isInRange } from '@/utils'
import { startTransition, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

export interface DargOptions {
  initX: number
  initY: number
  maxX: number
  minX: number
  maxY: number
  minY: number
  value?: number
  onChange?: (position: { x: number; y: number }) => void
}

const CLICK_RESET_DELAY = 250

const useDraggable = (options: DargOptions) => {
  const { initX, initY, maxX = 0, minX = 0, maxY = 0, minY = 0, value, onChange } = options

  const mousePosition = useRef({ x: 0, y: 0 })

  const positionRef = useRef({ x: clamp(initX, minX, maxX), y: clamp(initY, minY, maxY) })

  const [position, setPosition] = useState(positionRef.current)

  const hasDraggedRef = useRef(false)
  const ignoreClickRef = useRef(false)
  const clickResetTimeoutRef = useRef<number>()

  useLayoutEffect(() => {
    const targetY = value ?? initY
    const newPosition = { x: clamp(initX, minX, maxX), y: clamp(targetY, minY, maxY) }
    if (JSON.stringify(newPosition) !== JSON.stringify(position)) {
      positionRef.current = newPosition
      setPosition(newPosition)
    }
  }, [initX, initY, maxX, minX, maxY, minY, position, value])

  const isMove = useRef(false)

  const handlePreventClick = useCallback((event: MouseEvent) => {
    if (!ignoreClickRef.current) return
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    ignoreClickRef.current = false
    if (clickResetTimeoutRef.current) {
      clearTimeout(clickResetTimeoutRef.current)
      clickResetTimeoutRef.current = undefined
    }
  }, [])

  const handleMove = useCallback(
    (e: MouseEvent) => {
      if (isMove.current) {
        const { clientX, clientY } = e
        const prev = positionRef.current
        const delta = {
          x: prev.x + clientX - mousePosition.current.x,
          y: prev.y + clientY - mousePosition.current.y
        }

        const hasChanged = delta.x !== prev.x || delta.y !== prev.y

        if (isInRange(delta.x, minX, maxX)) {
          mousePosition.current.x = clientX
        }
        if (isInRange(delta.y, minY, maxY)) {
          mousePosition.current.y = clientY
        }
        if (hasChanged) {
          hasDraggedRef.current = true
          const x = clamp(delta.x, minX, maxX)
          const y = clamp(delta.y, minY, maxY)
          positionRef.current = { x, y }
          startTransition(() => {
            setPosition({ x, y })
          })
          onChange?.({ x, y })
        }
      }
    },
    [minX, maxX, minY, maxY, onChange]
  )

  const handleEnd = useCallback(() => {
    isMove.current = false
    document.documentElement.style.cursor = ''
    document.documentElement.style.userSelect = ''

    if (hasDraggedRef.current) {
      hasDraggedRef.current = false
      ignoreClickRef.current = true
      if (clickResetTimeoutRef.current) {
        clearTimeout(clickResetTimeoutRef.current)
      }
      clickResetTimeoutRef.current = window.setTimeout(() => {
        ignoreClickRef.current = false
        clickResetTimeoutRef.current = undefined
      }, CLICK_RESET_DELAY)
    }
  }, [])

  const handleStart = useCallback((e: MouseEvent) => {
    const { clientX, clientY } = e
    mousePosition.current = { x: clientX, y: clientY }
    isMove.current = true
    hasDraggedRef.current = false
    document.documentElement.style.userSelect = 'none'
    document.documentElement.style.cursor = 'grab'
  }, [])

  const handleRef = useRef<HTMLElement | null>(null)

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      if (handleRef.current) {
        handleRef.current.removeEventListener('mousedown', handleStart)
        handleRef.current.removeEventListener('click', handlePreventClick, true)
        document.removeEventListener('mouseup', handleEnd)
        document.removeEventListener('mousemove', handleMove)
      }
      if (node) {
        node.addEventListener('mousedown', handleStart)
        node.addEventListener('click', handlePreventClick, true)
        document.addEventListener('mouseup', handleEnd)
        document.addEventListener('mousemove', handleMove)
      }
      handleRef.current = node
    },
    [handleEnd, handleMove, handleStart, handlePreventClick]
  )

  useEffect(() => {
    return () => {
      if (clickResetTimeoutRef.current) {
        clearTimeout(clickResetTimeoutRef.current)
      }
    }
  }, [])

  return { setRef, ...position }
}

export default useDraggable
