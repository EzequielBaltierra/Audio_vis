export const DEFAULT_ANALYSIS_PARAMETERS = Object.freeze({
  fftSize: 4096,
  minDecibels: -100,
  maxDecibels: -20,
  smoothingTimeConstant: 0.72,
  attackMs: 0,
  releaseMs: 0,
  minFrequencyHz: 20,
  maxFrequencyHz: 20000,
  bandCount: 72,
  aggregation: 'peak',
})

export const ANALYSIS_AGGREGATION_METHODS = Object.freeze(['peak', 'mean', 'rms'])

export const BAND_COUNT_PARAMETER_DEFINITION = Object.freeze({
  id: 'bandCount',
  label: 'BANDS',
  type: 'number',
  minimum: 1,
  maximum: 256,
  step: 1,
  presets: [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 48, 64, 68, 72, 80, 88, 96, 128, 192, 256],
  affects:
    'Sets how many frequency groups are sent to the active renderer. More bands show finer frequency detail and require more drawing work.',
})

export const ANALYSIS_PARAMETER_DEFINITIONS = Object.freeze([
  {
    id: 'fftSize',
    label: 'FFT SIZE',
    type: 'enum',
    values: [1024, 2048, 4096, 8192, 16384],
    affects:
      'Sets how much audio is analyzed at once. Higher values separate nearby frequencies more clearly, but make the visualization react a little more slowly.',
  },
  {
    id: 'minDecibels',
    label: 'DB FLOOR',
    type: 'number',
    minimum: -140,
    maximum: -45,
    step: 5,
    presets: [-140, -120, -100, -90, -80, -70, -60, -45],
    unit: 'dBFS',
    affects:
      'Sets the level that becomes zero visual height. Lower values reveal quieter sounds; higher values hide them.',
  },
  {
    id: 'maxDecibels',
    label: 'DB CEILING',
    type: 'number',
    minimum: -40,
    maximum: 0,
    step: 1,
    presets: [-40, -30, -20, -12, -6, 0],
    unit: 'dBFS',
    affects:
      'Sets the level that becomes maximum visual height. Lower values make the visualization reach full height more easily.',
  },
  {
    id: 'smoothingTimeConstant',
    label: 'SMOOTHING',
    type: 'number',
    minimum: 0,
    maximum: 0.99,
    step: 0.01,
    presets: [0, 0.25, 0.5, 0.6, 0.65, 0.72, 0.75, 0.8, 0.85, 0.95, 0.99],
    affects:
      'Blends each frame with recent frames. Higher values make movement steadier and slower; lower values make it quicker and more responsive.',
  },
  {
    id: 'attackMs',
    label: 'VISUAL ATTACK',
    type: 'number',
    minimum: 0,
    maximum: 2000,
    step: 10,
    presets: [0, 20, 50, 100, 200, 400, 750, 1000, 1500, 2000],
    unit: 'ms',
    affects:
      'Sets how quickly bars and waves rise toward louder levels. Zero reacts immediately; higher values ease into peaks.',
  },
  {
    id: 'releaseMs',
    label: 'VISUAL RELEASE',
    type: 'number',
    minimum: 0,
    maximum: 5000,
    step: 10,
    presets: [0, 50, 100, 200, 400, 750, 1000, 1500, 2500, 5000],
    unit: 'ms',
    affects:
      'Sets how quickly bars and waves fall after energy drops. Zero falls immediately; higher values leave a longer visual tail.',
  },
  {
    id: 'minFrequencyHz',
    label: 'MIN HZ',
    type: 'number',
    minimum: 1,
    maximum: 2000,
    step: 1,
    presets: [1, 5, 10, 20, 40, 60, 80, 100, 160, 250, 500, 1000, 2000],
    unit: 'Hz',
    affects:
      'Sets the lowest frequency shown. Raising it removes deep bass from the visualization without changing playback.',
  },
  {
    id: 'maxFrequencyHz',
    label: 'MAX HZ',
    type: 'number',
    minimum: 1000,
    maximum: 96000,
    step: 100,
    presets: [1000, 4000, 8000, 12000, 16000, 20000, 24000, 48000, 96000],
    unit: 'Hz',
    affects:
      'Sets the highest frequency shown. Lowering it removes upper frequencies from the visualization without changing playback.',
  },
  {
    id: 'aggregation',
    label: 'AGGREGATION',
    type: 'enum',
    values: ANALYSIS_AGGREGATION_METHODS,
    affects:
      'Chooses how frequencies inside each displayed band become one value: PEAK uses the loudest, MEAN averages the values, and RMS emphasizes stronger energy.',
  },
])

export function normalizeAnalysisParameters(parameters = {}) {
  const next = { ...DEFAULT_ANALYSIS_PARAMETERS, ...parameters }
  const maximumFrequency = Number.isFinite(next.maxFrequencyHz) ? next.maxFrequencyHz : null

  return {
    ...next,
    fftSize: Number(next.fftSize),
    minDecibels: Number(next.minDecibels),
    maxDecibels: Number(next.maxDecibels),
    smoothingTimeConstant: Number(next.smoothingTimeConstant),
    attackMs: Number(next.attackMs),
    releaseMs: Number(next.releaseMs),
    minFrequencyHz: Number(next.minFrequencyHz),
    maxFrequencyHz: maximumFrequency,
    bandCount: Number(next.bandCount),
    aggregation: ANALYSIS_AGGREGATION_METHODS.includes(next.aggregation)
      ? next.aggregation
      : DEFAULT_ANALYSIS_PARAMETERS.aggregation,
  }
}
