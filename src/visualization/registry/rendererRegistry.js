import { createBarRenderer } from '../renderers/bar/barRenderer.js'
import { createSineRenderer } from '../renderers/sine/sineRenderer.js'
import { COLOR_PARAMETER_DEFINITIONS } from '../color/colorParameters.js'
import {
  SINE_PARAMETER_DEFINITIONS,
  DEFAULT_SINE_PARAMETERS,
} from '../renderers/sine/sineParameters.js'
import { BAR_PARAMETER_DEFINITIONS, DEFAULT_BAR_PARAMETERS } from '../renderers/bar/barParameters.js'

export const RENDERER_CATALOG = Object.freeze([
  {
    id: 'bar',
    label: 'BAR',
    status: 'available',
    input: 'frequencyBands',
    parameterDefinitions: BAR_PARAMETER_DEFINITIONS,
    colorParameterDefinitions: COLOR_PARAMETER_DEFINITIONS,
    defaultParameters: DEFAULT_BAR_PARAMETERS,
    create: createBarRenderer,
  },
  {
    id: 'sine',
    label: 'SINE WAVE',
    status: 'available',
    input: 'frequencyBands',
    parameterDefinitions: SINE_PARAMETER_DEFINITIONS,
    colorParameterDefinitions: COLOR_PARAMETER_DEFINITIONS,
    defaultParameters: DEFAULT_SINE_PARAMETERS,
    create: createSineRenderer,
  },
  {
    id: 'radial',
    label: 'RADIAL',
    status: 'planned',
    input: 'frequencyBands',
  },
  {
    id: 'oscilloscope',
    label: 'OSCILLOSCOPE',
    status: 'planned',
    input: 'waveform',
  },
  {
    id: 'spectrogram',
    label: 'SPECTROGRAM',
    status: 'planned',
    input: 'frequencyBins',
  },
])

const availableRenderers = new Map(
  RENDERER_CATALOG.filter(({ status }) => status === 'available').map((definition) => [
    definition.id,
    definition,
  ]),
)

export function getRendererDefinition(rendererId) {
  const definition = availableRenderers.get(rendererId)
  if (!definition) throw new RangeError(`Renderer is not available: ${rendererId}`)
  return definition
}

export function listAvailableRenderers() {
  return RENDERER_CATALOG.filter(({ status }) => status === 'available')
}
