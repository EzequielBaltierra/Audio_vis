import { useEffect, useMemo, useRef, useState } from 'react'

const REFERENCE_FREQUENCIES_HZ = [
  20, 30, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000,
]

export function FrequencyRuler({ minimumHz, maximumHz }) {
  const rulerRef = useRef(null)
  const [width, setWidth] = useState(800)
  const maximumTicks = Math.max(3, Math.min(10, Math.floor(width / 72)))
  const ticks = useMemo(
    () => buildFrequencyTicks(minimumHz, maximumHz, maximumTicks),
    [maximumHz, maximumTicks, minimumHz],
  )

  useEffect(() => {
    const ruler = rulerRef.current
    if (!ruler) return undefined
    const observer = new ResizeObserver(() => setWidth(ruler.clientWidth))
    observer.observe(ruler)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={rulerRef} className="frequency-ruler" aria-label="Bar frequency ruler">
      <span className="frequency-ruler__line" aria-hidden="true" />
      {ticks.map(({ frequencyHz, positionPercent }, index) => (
        <span
          className={`frequency-ruler__tick ${index === 0 ? 'is-first' : ''} ${index === ticks.length - 1 ? 'is-last' : ''}`}
          style={{ left: `${positionPercent}%` }}
          key={frequencyHz}
        >
          <span aria-hidden="true">|</span>
          <span>{formatFrequency(frequencyHz)}</span>
        </span>
      ))}
    </div>
  )
}

function buildFrequencyTicks(minimumHz, maximumHz, maximumTicks) {
  if (!(minimumHz > 0) || !(maximumHz > minimumHz) || maximumTicks < 2) return []

  const candidates = [
    minimumHz,
    ...REFERENCE_FREQUENCIES_HZ.filter((value) => value > minimumHz && value < maximumHz),
    maximumHz,
  ]
  const selected = candidates.length <= maximumTicks
    ? candidates
    : Array.from({ length: maximumTicks }, (_, index) => {
        const candidateIndex = Math.round(index * (candidates.length - 1) / (maximumTicks - 1))
        return candidates[candidateIndex]
      })
  const unique = [...new Set(selected)]
  const logarithmicRange = Math.log(maximumHz / minimumHz)

  return unique.map((frequencyHz) => ({
    frequencyHz,
    positionPercent: Math.log(frequencyHz / minimumHz) / logarithmicRange * 100,
  }))
}

function formatFrequency(frequencyHz) {
  if (frequencyHz >= 1000) return `${Number((frequencyHz / 1000).toPrecision(2))}kHz`
  return `${Math.round(frequencyHz)}Hz`
}
