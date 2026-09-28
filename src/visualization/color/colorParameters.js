export const VISUALIZATION_COLOR_PALETTE = Object.freeze([
  '#3AB246',
  '#6EDE8A',
  '#C8C793',
  '#68C5DB',
  '#7572BB',
  '#22153C',
  '#890620',
  '#D72E2E',
])

export const FREQUENCY_COLOR_PALETTES = Object.freeze({
  warm: Object.freeze(['#540B0E', '#E36414', '#FFBA08']),
  cool: Object.freeze(['#014F86', '#00B4D8', '#C0FDFF']),
  green: Object.freeze(['#008000', '#70E000', '#CCFF33']),
})

export const DEFAULT_COLOR_PARAMETERS = Object.freeze({
  colorMode: 'solid',
  color: '#3AB246',
  frequencyColorPalette: 'warm',
  frequencyColorLow: '#540B0E',
  frequencyColorMid: '#E36414',
  frequencyColorHigh: '#FFBA08',
})

export const COLOR_PARAMETER_DEFINITIONS = Object.freeze([
  {
    id: 'colorMode',
    label: 'COLOR MODE',
    type: 'enum',
    values: ['solid', 'frequency'],
    labels: {
      solid: 'SOLID COLOR',
      frequency: 'FREQUENCY GRADIENT',
    },
    affects:
      'Chooses one color for every frequency or blends low, middle, and high colors across the frequency range.',
  },
  {
    id: 'color',
    label: 'SOLID COLOR',
    type: 'palette-color',
    palette: VISUALIZATION_COLOR_PALETTE,
    visibleWhen: { id: 'colorMode', equals: 'solid' },
    affects:
      'Sets one color for every bar or sine wave.',
  },
  {
    id: 'frequencyColorPalette',
    label: 'FREQUENCY PALETTE',
    type: 'enum',
    values: ['warm', 'cool', 'green', 'custom'],
    labels: { custom: 'USER DEFINED' },
    visibleWhen: { id: 'colorMode', equals: 'frequency' },
    affects:
      'Chooses the low-to-high color set. USER DEFINED reveals three editable frequency colors.',
  },
])
