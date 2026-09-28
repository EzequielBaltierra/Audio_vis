import {
  COLOR_PARAMETER_DEFINITIONS,
  DEFAULT_COLOR_PARAMETERS,
  FREQUENCY_COLOR_PALETTES,
  VISUALIZATION_COLOR_PALETTE,
} from '../../color/colorParameters.js'

export const DEFAULT_BAR_PARAMETERS = Object.freeze({
  ...DEFAULT_COLOR_PARAMETERS,
  showFrequencyRuler: false,
  gapRatio: 0.12,
  minimumBarHeightPx: 1,
  symmetry: false,
  roundedEdges: false,
  verticalGradient: false,
  verticalGradientFadeStart: 0.5,
  peakHold: false,
  peakHoldDurationMs: 500,
  peakDecayPerSecond: 0.75,
})

// Keep these names for callers that already import the bar-specific exports.
export const BAR_COLOR_PALETTE = VISUALIZATION_COLOR_PALETTE
export const BAR_FREQUENCY_COLOR_PALETTES = FREQUENCY_COLOR_PALETTES
export const BAR_COLOR_PARAMETER_DEFINITIONS = COLOR_PARAMETER_DEFINITIONS

export const BAR_PARAMETER_DEFINITIONS = Object.freeze([
  {
    id: 'showFrequencyRuler',
    label: 'FREQUENCY RULER',
    type: 'boolean',
    affects:
      'Shows logarithmic frequency markers above the bars so their horizontal positions can be read in hertz.',
  },
  {
    id: 'symmetry',
    label: 'SYMMETRY',
    type: 'boolean',
    affects:
      'Mirrors every bar below the center line so it grows equally upward and downward.',
  },
  {
    id: 'roundedEdges',
    label: 'ROUNDED EDGES',
    type: 'boolean',
    affects:
      'Rounds the ends of each bar. At zero height, each frequency bucket appears as a circle.',
  },
  {
    id: 'verticalGradient',
    label: 'VERTICAL GRADIENT',
    type: 'boolean',
    affects:
      'Keeps each bar opaque near the center and gradually makes it transparent toward its live amplitude peak.',
  },
  {
    id: 'verticalGradientFadeStart',
    label: 'FADE START',
    type: 'number',
    minimum: 0,
    maximum: 1,
    step: 0.05,
    presets: [0, 0.1, 0.25, 0.33, 0.5, 0.66, 0.75, 0.9, 1],
    unit: 'ratio',
    visibleWhen: { id: 'verticalGradient', equals: true },
    affects:
      'Sets where the opacity fade begins from center to peak: 0 starts at the center, 0.5 halfway, and 1 at the tip.',
  },
  {
    id: 'peakHold',
    label: 'PEAK-HOLD CAPS',
    type: 'boolean',
    affects:
      'Adds a marker at the highest recent height of each bar. The marker waits, then falls toward the live bar.',
  },
  {
    id: 'peakHoldDurationMs',
    label: 'HOLD DURATION',
    type: 'number',
    minimum: 0,
    maximum: 5000,
    step: 50,
    presets: [0, 100, 250, 500, 750, 1000, 1500, 2000, 3000, 5000],
    unit: 'ms',
    visibleWhen: { id: 'peakHold', equals: true },
    affects:
      'Sets how many milliseconds a peak marker stays still before it begins falling.',
  },
  {
    id: 'peakDecayPerSecond',
    label: 'DECAY SPEED',
    type: 'number',
    minimum: 0.05,
    maximum: 5,
    step: 0.05,
    presets: [0.05, 0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 5],
    unit: '/s',
    visibleWhen: { id: 'peakHold', equals: true },
    affects:
      'Sets how quickly peak markers fall after the hold ends. Higher values return to the live bars faster.',
  },
  {
    id: 'gapRatio',
    label: 'BAR GAP',
    type: 'number',
    minimum: 0,
    maximum: 0.9,
    step: 0.01,
    presets: [0, 0.05, 0.08, 0.12, 0.16, 0.2, 0.25, 0.33, 0.5, 0.6, 0.7, 0.75, 0.9],
    affects:
      'Sets how much of each bar slot remains empty. Higher values make bars thinner and increase the space between them.',
  },
  {
    id: 'minimumBarHeightPx',
    label: 'MIN HEIGHT',
    type: 'number',
    minimum: 0,
    maximum: 20,
    step: 1,
    presets: [0, 1, 2, 4, 6, 8, 12, 16, 20],
    unit: 'px',
    affects:
      'Sets the shortest visible square-edged bar so quiet frequencies remain visible. Rounded zero-state circles are not affected.',
  },
])
