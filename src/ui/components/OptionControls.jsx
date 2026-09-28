import { useId, useState } from 'react'
import emptyBoxIcon from '../../assets/EmptyBox.png'
import selectedOptionIcon from '../../assets/Selectedoption.png'
import { hexToHsl, hslToHex, normalizeHexColor } from '../colorValues.js'
import { ColorPickerMenu } from './ColorPickerMenu.jsx'
import { ColorSwatchIcon } from './ColorSwatchIcon.jsx'

export function BooleanOptionControl({
  label,
  checked,
  hint,
  indented = false,
  disabled = false,
  onChange,
}) {
  return (
    <button
      className={`icon-option-control ${indented ? 'parameter-control--indented' : ''}`}
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-description={hint}
      title={hint}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className="option-icon" aria-hidden="true">
        <img
          className={checked ? 'option-icon__selected-option' : 'option-icon__empty'}
          src={checked ? selectedOptionIcon : emptyBoxIcon}
          alt=""
        />
      </span>
      <span>{label}</span>
    </button>
  )
}

export function PaletteColorControl({
  label,
  value,
  palette,
  hint,
  disabled = false,
  onChange,
}) {
  const pickerId = useId()
  const [draft, setDraft] = useState(value.toUpperCase())
  const [editing, setEditing] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [customHsl, setCustomHsl] = useState(() => hexToHsl(value))
  const customSelected = !palette.some((color) => color.toUpperCase() === value.toUpperCase())

  const updateDraft = (nextDraft) => {
    if (!/^#?[0-9a-f]*$/i.test(nextDraft) || nextDraft.replace('#', '').length > 6) return
    setDraft(nextDraft.toUpperCase())
    const normalized = normalizeHexColor(nextDraft)
    if (normalized) {
      setCustomHsl(hexToHsl(normalized))
      onChange(normalized)
    }
  }

  const openCustomPicker = () => {
    setEditing(false)
    setCustomHsl(hexToHsl(value))
    setCustomOpen((current) => !current)
  }

  return (
    <div className="palette-color-control">
      <label className="parameter-color" title={hint}>
        <span>{label}</span>
        <input
          type="text"
          value={editing ? draft : value.toUpperCase()}
          disabled={disabled}
          spellCheck="false"
          maxLength="7"
          aria-label={`${label} hexadecimal value`}
          onFocus={() => {
            setDraft(value.toUpperCase())
            setEditing(true)
          }}
          onChange={(event) => updateDraft(event.target.value)}
          onBlur={() => setEditing(false)}
        />
      </label>
      <div className="palette-options" role="listbox" aria-label={`${label} palette`}>
        {palette.map((color) => {
          const normalizedColor = color.toUpperCase()
          const selected = normalizedColor === value.toUpperCase()
          return (
            <button
              className="palette-option"
              type="button"
              role="option"
              aria-label={normalizedColor}
              aria-selected={selected}
              disabled={disabled}
              key={normalizedColor}
              onClick={() => {
                setEditing(false)
                setCustomOpen(false)
                setDraft(normalizedColor)
                setCustomHsl(hexToHsl(normalizedColor))
                onChange(normalizedColor)
              }}
            >
              <ColorSwatchIcon color={normalizedColor} selected={selected} />
            </button>
          )
        })}
        <button
          className="palette-option palette-option--custom"
          type="button"
          role="option"
          aria-label="Custom color"
          aria-selected={customSelected}
          aria-expanded={customOpen}
          aria-controls={`${pickerId}-menu`}
          disabled={disabled}
          onClick={openCustomPicker}
        >
          <ColorSwatchIcon
            color={customSelected ? value : null}
            selected={customSelected}
          />
        </button>
      </div>
      {customOpen ? (
        <ColorPickerMenu
          id={`${pickerId}-menu`}
          label={`${label} custom color picker`}
          value={value}
          hsl={customHsl}
          disabled={disabled}
          onChange={(nextHsl) => {
            setCustomHsl(nextHsl)
            const nextColor = hslToHex(nextHsl.hue, nextHsl.saturation, nextHsl.lightness)
            setDraft(nextColor)
            onChange(nextColor)
          }}
          onClose={() => setCustomOpen(false)}
        />
      ) : null}
    </div>
  )
}
