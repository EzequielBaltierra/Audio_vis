import { useEffect, useRef, useState } from 'react'

export function AsciiDivider({ character = '-' }) {
  const dividerRef = useRef(null)
  const [length, setLength] = useState(1)

  useEffect(() => {
    const element = dividerRef.current
    if (!element) return undefined

    const updateLength = () => {
      const style = window.getComputedStyle(element)
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
      const spacing = Number.parseFloat(style.letterSpacing) || 0
      const characterWidth = Math.max(1, context.measureText(character).width + spacing)
      setLength(Math.max(1, Math.floor(element.clientWidth / characterWidth)))
    }

    const observer = new ResizeObserver(updateLength)
    observer.observe(element)
    updateLength()
    return () => observer.disconnect()
  }, [character])

  return (
    <div ref={dividerRef} className="ascii-divider" aria-hidden="true">
      {character.repeat(length)}
    </div>
  )
}

export function AsciiRailDivider({
  character = '|',
  scrollMetrics = null,
  onScrollRatio,
  onScrollKey,
}) {
  const dividerRef = useRef(null)
  const draggingRef = useRef(false)
  const [rows, setRows] = useState(1)

  useEffect(() => {
    const element = dividerRef.current
    if (!element) return undefined

    const updateRows = () => {
      const lineHeight = Number.parseFloat(window.getComputedStyle(element).lineHeight) || 10
      setRows(Math.max(1, Math.ceil(element.clientHeight / lineHeight)))
    }

    const observer = new ResizeObserver(updateRows)
    observer.observe(element)
    updateRows()
    return () => observer.disconnect()
  }, [])

  const overflow = Boolean(scrollMetrics?.overflow)
  const thumbLength = overflow
    ? Math.max(2, Math.min(rows, Math.round(rows * scrollMetrics.visibleRatio)))
    : 0
  const thumbStart = overflow
    ? Math.round((rows - thumbLength) * scrollMetrics.value)
    : 0
  const characters = Array.from({ length: rows }, (_, index) => {
    const inThumb = index >= thumbStart && index < thumbStart + thumbLength
    return overflow && inThumb ? '#' : character
  }).join('\n')

  const scrollFromPointer = (event) => {
    if (!overflow || !onScrollRatio) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height))
    onScrollRatio(ratio)
  }

  return (
    <pre
      ref={dividerRef}
      className={`rail-divider ${overflow ? 'is-scrollable' : ''}`}
      role={overflow ? 'scrollbar' : undefined}
      tabIndex={overflow ? 0 : -1}
      aria-hidden={overflow ? undefined : true}
      aria-label={overflow ? 'Control rail scroll position' : undefined}
      aria-controls={overflow ? 'rail-controls' : undefined}
      aria-valuemin={overflow ? 0 : undefined}
      aria-valuemax={overflow ? 100 : undefined}
      aria-valuenow={overflow ? Math.round(scrollMetrics.value * 100) : undefined}
      onKeyDown={(event) => {
        if (!overflow || !onScrollKey) return
        if (!['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) {
          return
        }
        event.preventDefault()
        onScrollKey(event.key)
      }}
      onPointerDown={(event) => {
        if (!overflow) return
        draggingRef.current = true
        event.currentTarget.setPointerCapture(event.pointerId)
        scrollFromPointer(event)
      }}
      onPointerMove={(event) => {
        if (draggingRef.current) scrollFromPointer(event)
      }}
      onPointerUp={(event) => {
        draggingRef.current = false
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId)
        }
      }}
      onPointerCancel={() => {
        draggingRef.current = false
      }}
    >
      {characters}
    </pre>
  )
}
