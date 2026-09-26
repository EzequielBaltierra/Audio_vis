import { useState } from 'react'

export function CollapsibleParameterGroup({
  label,
  ariaLabel,
  children,
  defaultOpen = true,
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="rail-section parameter-group" aria-label={ariaLabel}>
      <button
        className="parameter-group-toggle"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true">{open ? '[-]' : '[+]'}</span>
        <span>{label}</span>
      </button>
      {open ? <div className="parameter-group-content">{children}</div> : null}
    </section>
  )
}
