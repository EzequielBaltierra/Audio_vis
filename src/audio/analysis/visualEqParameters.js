export const DEFAULT_VISUAL_EQ_PARAMETERS = Object.freeze({
  inputGainDb: 0,
  lowShelfFrequencyHz: 160,
  lowShelfGainDb: 0,
  highShelfFrequencyHz: 6000,
  highShelfGainDb: 0,
})

export const VISUAL_EQ_PARAMETER_DEFINITIONS = Object.freeze([
  {
    id: 'inputGainDb',
    label: 'INPUT GAIN',
    type: 'number',
    minimum: -24,
    maximum: 24,
    step: 1,
    presets: [-24, -18, -12, -6, 0, 6, 12, 18, 24],
    unit: 'dB',
    affects:
      'Raises or lowers the entire analysis signal, making all visual movement stronger or weaker without changing playback or recorded audio.',
  },
  {
    id: 'lowShelfFrequencyHz',
    label: 'LOW FREQ',
    type: 'number',
    minimum: 20,
    maximum: 1000,
    step: 10,
    presets: [20, 40, 60, 80, 100, 160, 250, 400, 630, 1000],
    unit: 'Hz',
    affects:
      'Sets the upper edge of the low-frequency range controlled by LOW GAIN. It changes only the visualization response.',
  },
  {
    id: 'lowShelfGainDb',
    label: 'LOW GAIN',
    type: 'number',
    minimum: -24,
    maximum: 24,
    step: 1,
    presets: [-24, -18, -12, -6, 0, 6, 12, 18, 24],
    unit: 'dB',
    affects:
      'Boosts or reduces bass-driven visual movement below LOW FREQ without changing the audible audio.',
  },
  {
    id: 'highShelfFrequencyHz',
    label: 'HIGH FREQ',
    type: 'number',
    minimum: 1000,
    maximum: 20000,
    step: 100,
    presets: [1000, 2000, 4000, 6000, 8000, 12000, 16000, 20000],
    unit: 'Hz',
    affects:
      'Sets the lower edge of the high-frequency range controlled by HIGH GAIN. It changes only the visualization response.',
  },
  {
    id: 'highShelfGainDb',
    label: 'HIGH GAIN',
    type: 'number',
    minimum: -24,
    maximum: 24,
    step: 1,
    presets: [-24, -18, -12, -6, 0, 6, 12, 18, 24],
    unit: 'dB',
    affects:
      'Boosts or reduces treble-driven visual movement above HIGH FREQ without changing the audible audio.',
  },
])

export function decibelsToGain(decibels) {
  return 10 ** (Number(decibels) / 20)
}

export function normalizeVisualEqParameters(parameters = {}) {
  return {
    ...DEFAULT_VISUAL_EQ_PARAMETERS,
    ...parameters,
  }
}
