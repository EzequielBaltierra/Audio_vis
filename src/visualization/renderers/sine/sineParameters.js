import { DEFAULT_COLOR_PARAMETERS } from '../../color/colorParameters.js'

export const DEFAULT_SINE_PARAMETERS = Object.freeze({
  ...DEFAULT_COLOR_PARAMETERS,
  lineWidthPx: 1.5,
  amplitudeOpacity: false,
  timeSpanMs: 10,
  fixedPosition: true,
  positionLayout: 'manual',
  showPositionHandles: true,
  meetAtCenter: false,
  centerMeetSlope: 2,
  positionGroupCount: 4,
  layoutPaddingPercent: 12.5,
  bandOffsets: Object.freeze({}),
})

export const SINE_PARAMETER_DEFINITIONS = Object.freeze([
  {
    id: 'lineWidthPx', label: 'LINE WIDTH', type: 'number',
    minimum: 0.2, maximum: 10, step: 0.1,
    presets: [0.2, 0.3, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8, 10], unit: 'px',
    affects: 'Sets the thickness of the wave outlines.',
  },
  {
    id: 'timeSpanMs', label: 'TIME SPAN', type: 'number',
    minimum: 1, maximum: 20, step: 1,
    presets: [1, 2, 5, 10, 15, 20], unit: 'ms',
    affects: 'Sets the time represented across the canvas. More time shows more cycles; less time stretches the waves.',
  },
  {
    id: 'amplitudeOpacity', label: 'AMPLITUDE OPACITY', type: 'boolean',
    affects: 'Fades each frequency wave according to its measured level. Quiet waves become transparent and loud waves become opaque.',
  },
  {
    id: 'fixedPosition', label: 'FIXED POSITION', type: 'boolean',
    affects: 'Keeps every wave centered. Turn this off to use individually arranged wave positions.',
  },
  {
    id: 'positionLayout', label: 'POSITION LAYOUT', type: 'enum',
    values: ['manual', 'distributed', 'shuffled', 'groups'],
    labels: {
      manual: 'MANUAL',
      distributed: 'DISTRIBUTE HORIZONTALLY',
      shuffled: 'SHUFFLED',
      groups: 'FREQUENCY GROUPS',
    },
    visibleWhen: { id: 'fixedPosition', equals: false },
    indented: true,
    affects: 'Chooses manual positions, even stacked positions, shuffled frequency positions, or grouped neighboring frequencies.',
  },
  {
    id: 'layoutPaddingPercent', label: 'TOP/BOTTOM PADDING', type: 'number',
    minimum: 0, maximum: 45, step: 2.5,
    presets: [0, 2.5, 5, 7.5, 10, 12.5, 15, 20, 25, 30, 37.5, 45],
    unit: '%',
    visibleWhen: [
      { id: 'fixedPosition', equals: false },
      { id: 'positionLayout', notEquals: 'manual' },
    ],
    indented: true,
    affects: 'Sets the empty space above and below the outermost positions in automatic layouts.',
  },
  {
    id: 'showPositionHandles', label: 'SHOW POSITION HANDLES', type: 'boolean',
    visibleWhen: [
      { id: 'fixedPosition', equals: false },
      { id: 'positionLayout', equals: 'manual' },
    ],
    indented: true,
    affects: 'Shows the numbered preview handles used to arrange individual wave positions.',
  },
  {
    id: 'positionGroupCount', label: 'POSITION GROUPS', type: 'number',
    minimum: 1, maximum: 256, step: 1,
    presets: [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 24, 32, 48, 64, 128, 256],
    visibleWhen: [
      { id: 'fixedPosition', equals: false },
      { id: 'positionLayout', equals: 'groups' },
    ],
    indented: true,
    affects: 'Sets how many vertical positions hold groups of neighboring frequency bands.',
  },
  {
    id: 'meetAtCenter', label: 'MEET AT CENTER', type: 'boolean',
    visibleWhen: { id: 'fixedPosition', equals: false },
    indented: true,
    affects: 'Brings every positioned wave to the canvas center at both horizontal edges.',
  },
  {
    id: 'centerMeetSlope', label: 'CENTER SLOPE', type: 'number',
    minimum: 0.25, maximum: 8, step: 0.25,
    presets: [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8],
    visibleWhen: [
      { id: 'fixedPosition', equals: false },
      { id: 'meetAtCenter', equals: true },
    ],
    indented: true,
    affects: 'Sets how sharply offset waves leave and return to the center at the left and right edges.',
  },
])
