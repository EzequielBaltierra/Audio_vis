export function ColorPickerMenu({
  id,
  label,
  value,
  hsl,
  disabled = false,
  onChange,
  onClose,
}) {
  const updateChannel = (channel, channelValue) => {
    onChange({ ...hsl, [channel]: Number(channelValue) })
  }

  return (
    <div id={id} className="custom-color-picker" role="group" aria-label={label}>
      <div className="custom-color-picker__header">
        <span>{label.toUpperCase()}</span>
        <output>{value.toUpperCase()}</output>
        <span
          className="custom-color-picker__preview"
          style={{ backgroundColor: value }}
          aria-hidden="true"
        />
      </div>
      <ColorChannelControl
        label="HUE"
        value={hsl.hue}
        maximum={360}
        unit="°"
        disabled={disabled}
        gradient="linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)"
        onChange={(nextValue) => updateChannel('hue', nextValue)}
      />
      <ColorChannelControl
        label="SAT"
        value={hsl.saturation}
        unit="%"
        disabled={disabled}
        gradient={`linear-gradient(90deg, hsl(${hsl.hue} 0% ${hsl.lightness}%), hsl(${hsl.hue} 100% ${hsl.lightness}%))`}
        onChange={(nextValue) => updateChannel('saturation', nextValue)}
      />
      <ColorChannelControl
        label="LIGHT"
        value={hsl.lightness}
        unit="%"
        disabled={disabled}
        gradient={`linear-gradient(90deg, #000, hsl(${hsl.hue} ${hsl.saturation}% 50%), #fff)`}
        onChange={(nextValue) => updateChannel('lightness', nextValue)}
      />
      <button
        className="custom-color-picker__close"
        type="button"
        disabled={disabled}
        onClick={onClose}
      >
        [ CLOSE ]
      </button>
    </div>
  )
}

function ColorChannelControl({ label, value, maximum = 100, unit, disabled, gradient, onChange }) {
  return (
    <label className="custom-color-channel">
      <span>{label}</span>
      <input
        type="range"
        min="0"
        max={maximum}
        step="1"
        value={Math.round(value)}
        disabled={disabled}
        aria-label={`Custom color ${label.toLowerCase()}`}
        style={{ '--color-track': gradient }}
        onChange={(event) => onChange(event.target.value)}
      />
      <output>{Math.round(value)}{unit}</output>
    </label>
  )
}
