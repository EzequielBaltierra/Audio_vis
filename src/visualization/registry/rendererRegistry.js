import { createBarRenderer } from '../renderers/bar/barRenderer.js'
import {
  BAR_PARAMETER_DEFINITIONS,
  DEFAULT_BAR_PARAMETERS,
} from '../renderers/bar/barParameters.js'

export const RENDERER_CATALOG = Object.freeze([
  {
    id: 'bar',
    label: 'BAR',
    status: 'available',
    input: 'frequencyBands',
    parameterDefinitions: BAR_PARAMETER_DEFINITIONS,
    defaultParameters: DEFAULT_BAR_PARAMETERS,
    create: createBarRenderer,
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
