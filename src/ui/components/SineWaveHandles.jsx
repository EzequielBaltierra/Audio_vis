import { useMemo, useRef } from 'react'
import { buildLogBands } from '../../audio/analysis/spectrum.js'

const HANDLE_EDGE_PERCENT = 5
const KEYBOARD_STEP_PERCENT = 5

export function SineWaveHandles({
  analysisParameters,
  sampleRate,
  offsets,
  disabled = false,
  onOffsetChange,
  onHighlightChange,
}) {
  const overlayRef = useRef(null)
  const bands = useMemo(() => buildLogBands({
    sampleRate,
    fftSize: analysisParameters.fftSize,
    bandCount: analysisParameters.bandCount,
    minFrequency: analysisParameters.minFrequencyHz,
    maxFrequency: analysisParameters.maxFrequencyHz,
  }), [analysisParameters, sampleRate])

  const offsetFromPointer = (clientY) => {
    const bounds = overlayRef.current?.getBoundingClientRect()
    if (!bounds || bounds.height <= 0) return 0
    const pointerPercent = (clientY - bounds.top) / bounds.height * 100
    const usablePercent = 100 - HANDLE_EDGE_PERCENT * 2
    const position = Math.min(1, Math.max(0,
      (pointerPercent - HANDLE_EDGE_PERCENT) / usablePercent,
    ))
    return Math.round(100 - position * 200)
  }

  return (
    <div ref={overlayRef} className="sine-wave-handles">
      {bands.map((band, bandIndex) => {
        const offset = offsets?.[bandIndex] ?? 0
        const verticalPosition = HANDLE_EDGE_PERCENT +
          (100 - offset) / 200 * (100 - HANDLE_EDGE_PERCENT * 2)
        const horizontalPosition = (bandIndex + 0.5) / bands.length * 100
        const updateOffset = (nextOffset) => {
          onOffsetChange(bandIndex, Math.min(100, Math.max(-100, nextOffset)))
        }

        return (
          <button
            className={`sine-wave-handle ${offset < -70 ? 'is-near-bottom' : ''}`}
            style={{ left: `${horizontalPosition}%`, top: `${verticalPosition}%` }}
            type="button"
            disabled={disabled}
            aria-label={`Wave ${bandIndex + 1}, ${formatRange(band)}, vertical offset`}
            aria-valuemin="-100"
            aria-valuemax="100"
            aria-valuenow={offset}
            aria-valuetext={`${offset > 0 ? '+' : ''}${offset} percent`}
            role="slider"
            key={bandIndex}
            onFocus={() => onHighlightChange(bandIndex)}
            onBlur={() => onHighlightChange(null)}
            onPointerEnter={() => onHighlightChange(bandIndex)}
            onPointerLeave={(event) => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) onHighlightChange(null)
            }}
            onPointerDown={(event) => {
              if (disabled || event.button !== 0) return
              event.preventDefault()
              event.currentTarget.focus()
              event.currentTarget.setPointerCapture(event.pointerId)
              updateOffset(offsetFromPointer(event.clientY))
            }}
            onPointerMove={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                updateOffset(offsetFromPointer(event.clientY))
              }
            }}
            onPointerUp={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId)
              }
            }}
            onKeyDown={(event) => {
              const nextOffsets = {
                ArrowUp: offset + KEYBOARD_STEP_PERCENT,
                ArrowDown: offset - KEYBOARD_STEP_PERCENT,
                PageUp: offset + 25,
                PageDown: offset - 25,
                Home: 0,
              }
              if (!(event.key in nextOffsets)) return
              event.preventDefault()
              updateOffset(nextOffsets[event.key])
            }}
          >
            <span className="sine-wave-handle__marker" aria-hidden="true">
              [{bandIndex + 1}]
            </span>
            <span className="sine-wave-handle__details">
              {formatRange(band)} / {offset > 0 ? '+' : ''}{offset}%
            </span>
          </button>
        )
      })}
    </div>
  )
}

function formatRange({ lowHz, highHz }) {
  return `${formatFrequency(lowHz)}–${formatFrequency(highHz)}`
}

function formatFrequency(frequencyHz) {
  if (frequencyHz >= 1000) return `${Number((frequencyHz / 1000).toPrecision(2))}kHz`
  return `${Math.round(frequencyHz)}Hz`
}
