import { useId } from 'react'

const TRACK_SEGMENTS = 13

export function VisualEqControls({ definitions, values, disabled = false, onChange }) {
  return (
    <div className={`visual-eq-controls ${disabled ? 'is-disabled' : ''}`}>
      <div className="visual-eq-heading">
        <span>GAIN dB</span>
      </div>

      <div className="visual-eq-layout">
        <div className="visual-eq-bands">
          {definitions.map((definition) => (
            <VerticalAsciiSlider
              key={definition.id}
              definition={definition}
              value={values[definition.id] ?? 0}
              disabled={disabled}
              onChange={(value) => onChange(definition.id, value)}
            />
          ))}
        </div>
      </div>

      <p className="visual-eq-axis-label">FREQUENCY</p>
    </div>
  )
}

function VerticalAsciiSlider({ definition, value, disabled, onChange }) {
  const inputId = useId()
  const changeFromPointer = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    // Match the centers of the ASCII rows instead of the native thumb size.
    const endPadding = bounds.height / TRACK_SEGMENTS / 2
    const ratio = Math.min(1, Math.max(0,
      (event.clientY - bounds.top - endPadding) / (bounds.height - 2 * endPadding),
    ))
    const rawValue = definition.maximum - ratio * (definition.maximum - definition.minimum)
    const steppedValue = definition.minimum + Math.round(
      (rawValue - definition.minimum) / definition.step,
    ) * definition.step
    onChange(Math.min(definition.maximum, Math.max(definition.minimum, steppedValue)))
  }
  const valueRatio = (definition.maximum - value) /
    (definition.maximum - definition.minimum)
  const thumbIndex = Math.round(valueRatio * (TRACK_SEGMENTS - 1))
  const zeroIndex = Math.round(
    (definition.maximum / (definition.maximum - definition.minimum)) * (TRACK_SEGMENTS - 1),
  )

  return (
    <div
      className={`visual-eq-band ${value < 0 ? 'is-negative' : value > 0 ? 'is-positive' : ''}`}
      title={definition.affects}
    >
      <output
        className="visual-eq-value"
        htmlFor={inputId}
      >
        <span className="visual-eq-value__bracket">[ </span>
        <span
          className={`visual-eq-value__amount ${value > 0 ? 'is-positive' : value < 0 ? 'is-negative' : ''}`}
        >
          {formatGain(value)}
        </span>
        <span className="visual-eq-value__bracket"> ]</span>
      </output>

      <div className="vertical-ascii-rail">
        <div className="vertical-ascii-rail__track" aria-hidden="true">
          {Array.from({ length: TRACK_SEGMENTS }, (_, index) => {
            const active = index >= Math.min(zeroIndex, thumbIndex) &&
              index <= Math.max(zeroIndex, thumbIndex)
            const thumb = index === thumbIndex
            const zero = index === zeroIndex

            return (
              <span
                className={`${active ? 'is-active' : ''} ${thumb ? 'is-thumb' : ''}`}
                key={index}
              >
                {thumb ? '[=]' : zero ? '-+-' : active ? ' # ' : ' | '}
              </span>
            )
          })}
        </div>

        <input
          id={inputId}
          type="range"
          min={definition.minimum}
          max={definition.maximum}
          step={definition.step}
          value={value}
          disabled={disabled}
          aria-label={`${formatFrequency(definition.frequencyHz)} gain`}
          aria-valuetext={`${formatGain(value)} decibels`}
          onChange={(event) => onChange(Number(event.target.value))}
          onPointerDown={(event) => {
            if (disabled || event.button !== 0) return
            event.preventDefault()
            event.currentTarget.focus()
            event.currentTarget.setPointerCapture(event.pointerId)
            changeFromPointer(event)
          }}
          onPointerMove={(event) => {
            if (!disabled && event.currentTarget.hasPointerCapture(event.pointerId)) changeFromPointer(event)
          }}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId)
            }
          }}
        />
      </div>

      <label className="visual-eq-frequency" htmlFor={inputId}>
        [ {formatFrequency(definition.frequencyHz)} ]
      </label>
    </div>
  )
}

function formatGain(value) {
  return value > 0 ? `+${value}` : String(value)
}

function formatFrequency(frequencyHz) {
  if (frequencyHz >= 1000) return `${frequencyHz / 1000}K`
  return String(frequencyHz)
}
