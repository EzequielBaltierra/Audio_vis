import { useState } from 'react'

export function AsciiSelect({
  label,
  value,
  options,
  onChange,
  defaultOpen = true,
  disabled = false,
  placeholder = 'SELECT',
  hint,
}) {
  const [open, setOpen] = useState(defaultOpen)
  const selectedIndex = options.findIndex((option) => option.value === value)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null

  const move = (offset) => {
    if (disabled) return
    const nextIndex = selectedIndex < 0
      ? (offset > 0 ? 0 : options.length - 1)
      : (selectedIndex + offset + options.length) % options.length
    onChange(options[nextIndex].value)
  }

  const handleKeyDown = (event) => {
    if (disabled) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault()
      move(1)
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault()
      move(-1)
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="ascii-select">
      <button
        className="ascii-select__header"
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-description={hint}
        title={hint}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{label}</span>
        {!open ? <span className="ascii-select__value">{selected?.label ?? placeholder}</span> : null}
      </button>
      {open ? (
        <div
          className="ascii-select__control"
          role="listbox"
          tabIndex={disabled ? -1 : 0}
          aria-label={label}
          aria-disabled={disabled}
          aria-activedescendant={selected ? `${label}-${selected.value}` : undefined}
          onKeyDown={handleKeyDown}
        >
          {options.map((option) => {
            const active = option.value === value
            return (
              <button
                id={`${label}-${option.value}`}
                className={`ascii-select__option ${active ? 'is-selected' : ''}`}
                type="button"
                role="option"
                aria-selected={active}
                disabled={disabled}
                key={option.value}
                onClick={() => onChange(option.value)}
              >
                <span>{option.label}</span>
                <span aria-hidden="true">{active ? '<-' : ''}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
