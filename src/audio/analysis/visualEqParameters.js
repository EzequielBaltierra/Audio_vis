export const VISUAL_EQ_BANDS = Object.freeze([
  Object.freeze({ id: 'gain60HzDb', frequencyHz: 60 }),
  Object.freeze({ id: 'gain250HzDb', frequencyHz: 250 }),
  Object.freeze({ id: 'gain1kHzDb', frequencyHz: 1000 }),
  Object.freeze({ id: 'gain4kHzDb', frequencyHz: 4000 }),
  Object.freeze({ id: 'gain12kHzDb', frequencyHz: 12000 }),
])

export const DEFAULT_VISUAL_EQ_PARAMETERS = Object.freeze(
  Object.fromEntries(VISUAL_EQ_BANDS.map(({ id }) => [id, 0])),
)

export const VISUAL_EQ_PARAMETER_DEFINITIONS = Object.freeze(
  VISUAL_EQ_BANDS.map(({ id, frequencyHz }) => Object.freeze({
    id,
    label: `${formatFrequency(frequencyHz)} GAIN`,
    type: 'number',
    minimum: -30,
    maximum: 30,
    step: 1,
    presets: [-30, -24, -18, -12, -6, 0, 6, 12, 18, 24, 30],
    unit: 'dB',
    frequencyHz,
    affects:
      `Boosts or cuts visualizer response around ${formatFrequency(frequencyHz)} without changing playback or recorded audio.`,
  })),
)

export function normalizeVisualEqParameters(parameters = {}) {
  return Object.fromEntries(VISUAL_EQ_BANDS.map(({ id }) => [
    id,
    Number.isFinite(parameters[id]) ? parameters[id] : DEFAULT_VISUAL_EQ_PARAMETERS[id],
  ]))
}

function formatFrequency(frequencyHz) {
  if (frequencyHz >= 1000) return `${frequencyHz / 1000} kHz`
  return `${frequencyHz} Hz`
}
