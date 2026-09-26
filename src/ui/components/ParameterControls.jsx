import { useState } from 'react'
import { AsciiSelect } from '../../ascii/AsciiSelect.jsx'
import { clampParameterValue, nextParameterValue } from '../parameterValues.js'
import { BooleanOptionControl, PaletteColorControl } from './OptionControls.jsx'

export function ParameterControls({ definitions, values, disabled = false, onChange }) {
  return definitions.map((definition) => {
    const visibilityConditions = Array.isArray(definition.visibleWhen)
      ? definition.visibleWhen
      : definition.visibleWhen ? [definition.visibleWhen] : []
    if (visibilityConditions.some(({ id, equals }) => values[id] !== equals)) return null

    if (definition.type === 'boolean') {
      return (
        <BooleanOptionControl
          key={definition.id}
          label={definition.label}
          checked={values[definition.id]}
          hint={definition.affects}
          disabled={disabled}
          onChange={(value) => onChange(definition.id, value)}
        />
      )
    }

    if (definition.type === 'palette-color') {
      return (
        <PaletteColorControl
          key={definition.id}
          label={definition.label}
          value={values[definition.id]}
          palette={definition.palette}
          hint={definition.affects}
          disabled={disabled}
          onChange={(value) => onChange(definition.id, value)}
        />
      )
    }

    if (definition.type === 'enum') {
      return (
        <div className="parameter-control" key={definition.id}>
          <AsciiSelect
            label={definition.label}
            value={values[definition.id]}
            options={definition.values.map((value) => ({
              value,
              label: definition.labels?.[value] ?? String(value).toUpperCase(),
            }))}
            disabled={disabled}
            hint={definition.affects}
            onChange={(value) => onChange(definition.id, value)}
          />
        </div>
      )
    }

    if (definition.type === 'color') {
      return (
        <label className="parameter-color" key={definition.id} title={definition.affects}>
          <span>{definition.label}</span>
          <input
            type="text"
            value={values[definition.id]}
            disabled={disabled}
            spellCheck="false"
            maxLength={definition.maxLength ?? 9}
            onChange={(event) => onChange(definition.id, event.target.value)}
          />
        </label>
      )
    }

    const value = values[definition.id]
    return (
      <NumberParameterControl
        key={definition.id}
        definition={definition}
        value={value}
        disabled={disabled}
        onChange={(nextValue) => onChange(definition.id, nextValue)}
      />
    )
  })
}

function NumberParameterControl({ definition, value, disabled, onChange }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))

  const updateDraft = (nextDraft) => {
    if (!/^-?\d*(\.\d*)?$/.test(nextDraft)) return
    setDraft(nextDraft)
    if (nextDraft === '' || nextDraft === '-' || nextDraft.endsWith('.')) return
    const numericValue = Number(nextDraft)
    if (
      Number.isFinite(numericValue) &&
      numericValue >= definition.minimum &&
      numericValue <= definition.maximum
    ) {
      onChange(numericValue)
    }
  }

  const finishEditing = () => {
    const clamped = clampParameterValue(draft, definition)
    if (clamped !== null) onChange(clamped)
    setEditing(false)
  }

  return (
    <div className="step-control" title={definition.affects}>
      <span>{definition.label}</span>
      <span className="step-control__actions">
        <button
          type="button"
          disabled={disabled || value <= definition.minimum}
          onClick={() => onChange(nextParameterValue(value, definition, -1))}
          aria-label={`Previous ${definition.label} preset`}
        >
          [-]
        </button>
        <span className="parameter-number-value">
          <input
            className="parameter-number-input"
            type="text"
            inputMode="decimal"
            value={editing ? draft : String(value)}
            disabled={disabled}
            aria-label={`${definition.label} value`}
            onFocus={() => {
              setDraft(String(value))
              setEditing(true)
            }}
            onChange={(event) => updateDraft(event.target.value)}
            onBlur={finishEditing}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
            }}
          />
          {definition.unit ? <span>{definition.unit}</span> : null}
        </span>
        <button
          type="button"
          disabled={disabled || value >= definition.maximum}
          onClick={() => onChange(nextParameterValue(value, definition, 1))}
          aria-label={`Next ${definition.label} preset`}
        >
          [+]
        </button>
      </span>
    </div>
  )
}
