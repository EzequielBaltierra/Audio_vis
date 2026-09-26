import { useEffect, useRef, useState } from 'react'
import { LOCAL_AUDIO_ACCEPT } from '../../audio/engine/audioSource.js'

function LoadingSequence() {
  const [step, setStep] = useState(1)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const timer = window.setInterval(() => setStep((current) => (current % 3) + 1), 420)
    return () => window.clearInterval(timer)
  }, [])

  return <span className="loading-sequence">{'{'}{'.'.repeat(step).padEnd(3, ' ')}{'}'}</span>
}

export function AudioSourceControls({
  source,
  demos,
  status,
  error,
  dragging,
  disabled,
  onFile,
  onDemo,
}) {
  const inputRef = useRef(null)
  const [demoOpen, setDemoOpen] = useState(false)

  const acceptFile = (files) => {
    const [nextFile] = files
    if (nextFile) onFile(nextFile)
  }

  return (
    <div className="audio-source-controls">
      <div className="source-actions" aria-label="Audio source options">
        <button
          className={`source-action ${dragging ? 'is-dragging' : ''}`}
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {dragging ? '[ DROP WAV / MP3 ]' : '[ OPEN WAV / MP3 ]'}
        </button>
        <button
          className="source-action"
          type="button"
          disabled={disabled}
          aria-expanded={demoOpen}
          onClick={() => setDemoOpen((current) => !current)}
        >
          [ DEMO ]
        </button>
      </div>

      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept={LOCAL_AUDIO_ACCEPT}
        onChange={(event) => {
          acceptFile(event.target.files)
          event.target.value = ''
        }}
      />

      {demoOpen ? (
        <div className="demo-options" role="listbox" aria-label="Demo tracks">
          {demos.map((demo) => {
            const selected = source?.kind === 'demo' && source.demoId === demo.id
            return (
              <button
                className={`demo-option ${selected ? 'is-selected' : ''}`}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={disabled}
                key={demo.id}
                onClick={() => onDemo(demo)}
              >
                <span>
                  <span className="demo-option__title">{demo.title}</span>
                  <span className="demo-option__artist"> / {demo.artist}</span>
                </span>
                <span aria-hidden="true">{selected ? '<-' : ''}</span>
              </button>
            )
          })}
        </div>
      ) : null}

      {status === 'loading' ? <p className="source-status">LOADING <LoadingSequence /></p> : null}
      {source ? (
        <div className="source-summary">
          <p title={source.title}>{source.title}</p>
          <p>{source.artist}</p>
        </div>
      ) : null}
      {error ? <p className="error-message" role="alert">{error}</p> : null}
    </div>
  )
}
