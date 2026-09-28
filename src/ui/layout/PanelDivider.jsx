import { useEffect, useRef, useState } from 'react'

export function PanelDivider({ width, onChange }) {
  const dragStart = useRef(null)
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth)
  const minimum = 280
  const maximum = Math.max(minimum, Math.floor(windowWidth * 0.55))
  const currentWidth = Math.min(maximum, Math.max(minimum, width))

  useEffect(() => {
    const resize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const changeWidth = (nextWidth) => onChange(Math.min(maximum, Math.max(minimum, nextWidth)))

  return (
    <div
      className="panel-divider"
      role="separator"
      tabIndex={0}
      aria-label="Controls panel width"
      aria-orientation="vertical"
      aria-controls="audio-controls"
      aria-valuemin={minimum}
      aria-valuemax={maximum}
      aria-valuenow={Math.round(currentWidth)}
      aria-valuetext={`${Math.round(currentWidth)} pixels`}
      title="Drag to resize controls. Arrow keys adjust width; double-click to reset."
      onDoubleClick={() => changeWidth(320)}
      onKeyDown={(event) => {
        const widths = {
          ArrowLeft: currentWidth - 16,
          ArrowRight: currentWidth + 16,
          Home: minimum,
          End: maximum,
        }
        if (!(event.key in widths)) return
        event.preventDefault()
        changeWidth(widths[event.key])
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return
        event.preventDefault()
        dragStart.current = { x: event.clientX, width: currentWidth }
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerMove={(event) => {
        if (!dragStart.current) return
        changeWidth(dragStart.current.width + event.clientX - dragStart.current.x)
      }}
      onPointerUp={(event) => {
        dragStart.current = null
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId)
        }
      }}
      onPointerCancel={() => { dragStart.current = null }}
      onLostPointerCapture={() => { dragStart.current = null }}
    >
      <span aria-hidden="true">|</span>
    </div>
  )
}
