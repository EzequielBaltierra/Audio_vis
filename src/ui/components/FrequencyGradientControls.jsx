import { useEffect, useId, useRef, useState } from 'react'
import { hexToHsl, hslToHex, normalizeHexColor } from '../colorValues.js'
import { ColorPickerMenu } from './ColorPickerMenu.jsx'

const COLOR_BUCKETS = [
  { id: 'frequencyColorLow', label: 'LOW' },
  { id: 'frequencyColorMid', label: 'MIDDLE' },
  { id: 'frequencyColorHigh', label: 'HIGH' },
]

export function FrequencyGradientControls({ values, disabled = false, onChange }) {
  const pickerId = useId()
  const [activeBucketId, setActiveBucketId] = useState(null)
  const [pickerHsl, setPickerHsl] = useState(() => hexToHsl(values.frequencyColorLow))
  const activeBucket = COLOR_BUCKETS.find(({ id }) => id === activeBucketId)

  const selectBucket = (bucket) => {
    if (activeBucketId === bucket.id) {
      setActiveBucketId(null)
      return
    }
    setPickerHsl(hexToHsl(values[bucket.id]))
    setActiveBucketId(bucket.id)
  }

  const updateHexColor = (bucketId, color) => {
    onChange(bucketId, color)
    if (bucketId === activeBucketId) setPickerHsl(hexToHsl(color))
  }

  return (
    <div className="frequency-gradient-controls">
      <div className="frequency-color-buckets" role="group" aria-label="User-defined frequency colors">
        {COLOR_BUCKETS.map((bucket) => (
          <FrequencyColorBucket
            key={bucket.id}
            label={bucket.label}
            value={values[bucket.id]}
            active={bucket.id === activeBucketId}
            disabled={disabled}
            controlsId={`${pickerId}-menu`}
            onSelect={() => selectBucket(bucket)}
            onChange={(color) => updateHexColor(bucket.id, color)}
          />
        ))}
      </div>
      {activeBucket ? (
        <ColorPickerMenu
          id={`${pickerId}-menu`}
          label={`${activeBucket.label} color picker`}
          value={values[activeBucket.id]}
          hsl={pickerHsl}
          disabled={disabled}
          onChange={(nextHsl) => {
            setPickerHsl(nextHsl)
            onChange(
              activeBucket.id,
              hslToHex(nextHsl.hue, nextHsl.saturation, nextHsl.lightness),
            )
          }}
          onClose={() => setActiveBucketId(null)}
        />
      ) : null}
    </div>
  )
}

function FrequencyColorBucket({
  label,
  value,
  active,
  disabled,
  controlsId,
  onSelect,
  onChange,
}) {
  const inputRef = useRef(null)

  useEffect(() => {
    const input = inputRef.current
    if (input && document.activeElement !== input) input.value = value.toUpperCase()
  }, [value])

  const updateDraft = (event) => {
    const nextDraft = event.currentTarget.value
    if (!/^#?[0-9a-f]*$/i.test(nextDraft) || nextDraft.replace('#', '').length > 6) {
      event.currentTarget.value = value.toUpperCase()
      return
    }
    const normalized = normalizeHexColor(nextDraft)
    if (normalized) onChange(normalized)
  }

  return (
    <div className={`frequency-color-bucket ${active ? 'is-active' : ''}`}>
      <span className="frequency-color-bucket__label">{label}</span>
      <button
        className="frequency-color-bucket__swatch"
        type="button"
        disabled={disabled}
        aria-label={`Choose ${label} color`}
        aria-expanded={active}
        aria-controls={controlsId}
        style={{ backgroundColor: value }}
        onClick={onSelect}
      />
      <input
        ref={inputRef}
        type="text"
        defaultValue={value.toUpperCase()}
        disabled={disabled}
        spellCheck="false"
        maxLength="7"
        aria-label={`${label} hexadecimal value`}
        onChange={updateDraft}
        onBlur={(event) => {
          const normalized = normalizeHexColor(event.target.value)
          if (normalized) onChange(normalized)
          else event.target.value = value.toUpperCase()
        }}
      />
    </div>
  )
}
