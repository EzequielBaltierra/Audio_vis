import { useState } from 'react'
import emptyBoxIcon from '../../assets/EmptyBox.png'
import selectedColorIcon from '../../assets/SelectedColor.png'
import selectedOptionIcon from '../../assets/Selectedoption.png'

export function BooleanOptionControl({ label, checked, hint, disabled = false, onChange }) {
  return (
    <button
      className="icon-option-control"
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
  const [draft, setDraft] = useState(value.toUpperCase())
  const [editing, setEditing] = useState(false)

  const updateDraft = (nextDraft) => {
    if (!/^#?[0-9a-f]*$/i.test(nextDraft) || nextDraft.replace('#', '').length > 6) return
    setDraft(nextDraft.toUpperCase())
    const normalized = normalizeHexColor(nextDraft)
    if (normalized) onChange(normalized)
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
                onChange(normalizedColor)
              }}
            >
              <span className="option-icon" aria-hidden="true">
                <span
                  className={selected
                    ? 'option-icon__fill option-icon__fill--selected'
                    : 'option-icon__fill option-icon__fill--empty'}
                  style={{ backgroundColor: normalizedColor }}
                />
                <img
                  className={selected ? 'option-icon__selected-color' : 'option-icon__empty'}
                  src={selected ? selectedColorIcon : emptyBoxIcon}
                  alt=""
                />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function normalizeHexColor(value) {
  const digits = value.replace('#', '')
  return /^[0-9a-f]{6}$/i.test(digits) ? `#${digits.toUpperCase()}` : null
}
