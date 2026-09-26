export const DEFAULT_BAR_PARAMETERS = Object.freeze({
  color: '#3ab246',
  gapRatio: 0.12,
  minimumBarHeightPx: 1,
  symmetry: false,
  roundedEdges: false,
  verticalGradient: false,
  verticalGradientFadeStart: 0.5,
  peakHold: false,
  peakHoldDurationMs: 500,
  peakDecayPerSecond: 0.75,
  frequencyColorGradient: false,
  frequencyColorPalette: 'warm',
  frequencyColorLow: '#540B0E',
  frequencyColorMid: '#E36414',
  frequencyColorHigh: '#FFBA08',
})

export const BAR_COLOR_PALETTE = Object.freeze([
  '#3AB246',
  '#6EDE8A',
  '#C8C793',
  '#68C5DB',
  '#7572BB',
  '#22153C',
  '#890620',
  '#D72E2E',
])

export const BAR_FREQUENCY_COLOR_PALETTES = Object.freeze({
  warm: Object.freeze(['#540B0E', '#E36414', '#FFBA08']),
  cool: Object.freeze(['#014F86', '#00B4D8', '#C0FDFF']),
  green: Object.freeze(['#008000', '#70E000', '#CCFF33']),
})

export const BAR_PARAMETER_DEFINITIONS = Object.freeze([
  {
    id: 'color',
    label: 'BAR COLOR',
    type: 'palette-color',
    palette: BAR_COLOR_PALETTE,
    affects:
      'Sets the solid color of the bars and peak caps. FREQUENCY GRADIENT replaces this color when enabled.',
  },
  {
    id: 'frequencyColorGradient',
    label: 'FREQUENCY GRADIENT',
    type: 'boolean',
    affects:
      'Colors low, middle, and high frequency bars differently instead of using one solid color. Bar heights do not change.',
  },
  {
    id: 'frequencyColorPalette',
    label: 'FREQUENCY PALETTE',
    type: 'enum',
    values: ['warm', 'cool', 'green', 'custom'],
    labels: { custom: 'USER DEFINED' },
    visibleWhen: { id: 'frequencyColorGradient', equals: true },
    affects:
      'Chooses the low-to-high color set used across the frequency bars. USER DEFINED reveals three editable colors.',
  },
  {
    id: 'frequencyColorLow',
    label: 'LOW COLOR',
    type: 'color',
    maxLength: 7,
    visibleWhen: [
      { id: 'frequencyColorGradient', equals: true },
      { id: 'frequencyColorPalette', equals: 'custom' },
    ],
    affects:
      'Sets the color used at the low-frequency end of the user-defined gradient. Colors between palette points are blended.',
  },
  {
    id: 'frequencyColorMid',
    label: 'MID COLOR',
    type: 'color',
    maxLength: 7,
    visibleWhen: [
      { id: 'frequencyColorGradient', equals: true },
      { id: 'frequencyColorPalette', equals: 'custom' },
    ],
    affects:
      'Sets the color used in the middle of the user-defined frequency gradient. Colors between palette points are blended.',
  },
  {
    id: 'frequencyColorHigh',
    label: 'HIGH COLOR',
    type: 'color',
    maxLength: 7,
    visibleWhen: [
      { id: 'frequencyColorGradient', equals: true },
      { id: 'frequencyColorPalette', equals: 'custom' },
    ],
    affects:
      'Sets the color used at the high-frequency end of the user-defined gradient. Colors between palette points are blended.',
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
