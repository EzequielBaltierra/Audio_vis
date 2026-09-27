import test from 'node:test'
import assert from 'node:assert/strict'
import {
  OUTPUT_FORMATS,
  findSupportedOutputMimeType,
} from '../src/output/outputParameters.js'
import {
  RENDERER_CATALOG,
  getRendererDefinition,
  listAvailableRenderers,
} from '../src/visualization/registry/rendererRegistry.js'
import { createBarRenderer } from '../src/visualization/renderers/bar/barRenderer.js'
import {
  BAR_COLOR_PALETTE,
  BAR_FREQUENCY_COLOR_PALETTES,
  BAR_PARAMETER_DEFINITIONS,
  DEFAULT_BAR_PARAMETERS,
} from '../src/visualization/renderers/bar/barParameters.js'

test('renderer catalog separates implemented and planned renderers', () => {
  assert.deepEqual(RENDERER_CATALOG.map(({ id }) => id), [
    'bar',
    'radial',
    'oscilloscope',
    'spectrogram',
  ])
  assert.deepEqual(listAvailableRenderers().map(({ id }) => id), ['bar'])
  assert.equal(getRendererDefinition('bar').input, 'frequencyBands')
  assert.throws(() => getRendererDefinition('radial'), /not available/)
})

test('bar renderer defaults to square edges', () => {
  assert.equal(DEFAULT_BAR_PARAMETERS.roundedEdges, false)
  assert.equal(DEFAULT_BAR_PARAMETERS.verticalGradient, false)
  assert.equal(DEFAULT_BAR_PARAMETERS.verticalGradientFadeStart, 0.5)
  assert.equal(DEFAULT_BAR_PARAMETERS.peakHold, false)
  assert.equal(DEFAULT_BAR_PARAMETERS.peakHoldDurationMs, 500)
  assert.equal(DEFAULT_BAR_PARAMETERS.peakDecayPerSecond, 0.75)
  assert.equal(DEFAULT_BAR_PARAMETERS.frequencyColorGradient, false)
  assert.equal(DEFAULT_BAR_PARAMETERS.frequencyColorPalette, 'warm')
})

test('frequency palettes define low, middle, and high colors', () => {
  assert.deepEqual(BAR_FREQUENCY_COLOR_PALETTES, {
    warm: ['#540B0E', '#E36414', '#FFBA08'],
    cool: ['#014F86', '#00B4D8', '#C0FDFF'],
    green: ['#008000', '#70E000', '#CCFF33'],
  })
})

test('bar palette keeps the added colors in visual gradient order', () => {
  assert.deepEqual(BAR_COLOR_PALETTE, [
    '#3AB246',
    '#6EDE8A',
    '#C8C793',
    '#68C5DB',
    '#7572BB',
    '#22153C',
    '#890620',
    '#D72E2E',
  ])
})

test('bar spacing controls follow the peak-hold controls', () => {
  assert.deepEqual(
    BAR_PARAMETER_DEFINITIONS.slice(-4).map(({ id }) => id),
    [
      'peakHoldDurationMs',
      'peakDecayPerSecond',
      'gapRatio',
      'minimumBarHeightPx',
    ],
  )
})

test('WebM and MP4 output formats use only browser-supported MIME types', () => {
  assert.equal(OUTPUT_FORMATS.webm.extension, 'webm')
  assert.equal(OUTPUT_FORMATS.mp4.extension, 'mp4')

  const supported = new Set(['video/webm;codecs=vp9,opus', 'video/mp4'])
  const recorder = { isTypeSupported: (type) => supported.has(type) }
  assert.equal(findSupportedOutputMimeType(recorder, 'webm'), 'video/webm;codecs=vp9,opus')
  assert.equal(findSupportedOutputMimeType(recorder, 'mp4'), 'video/mp4')
  assert.equal(findSupportedOutputMimeType(recorder, 'unknown'), null)
})

test('bar renderer maps the analysis decibel range to viewport height', () => {
  const rectangles = []
  const context = {
    fillStyle: '',
    fillRect: (...rectangle) => rectangles.push(rectangle),
  }
  const renderer = createBarRenderer()
  renderer.render({
    context,
    frame: {
      frequencyBandsDb: [-100, -20],
      analysis: { minDecibels: -100, maxDecibels: -20 },
    },
    viewport: { width: 100, height: 100 },
    parameters: {
      color: '#3ab246',
      gapRatio: 0,
      minimumBarHeightPx: 1,
      symmetry: false,
      roundedEdges: false,
    },
  })

  assert.deepEqual(rectangles, [
    [0, 49, 50, 1],
    [50, 0, 50, 50],
  ])
})

test('rounded zero-amplitude bars render as circles centered on the x-axis', () => {
  const roundedRectangles = []
  const context = {
    fillStyle: '',
    beginPath() {},
    roundRect: (...rectangle) => roundedRectangles.push(rectangle),
    fill() {},
  }
  const renderer = createBarRenderer()
  renderer.render({
    context,
    frame: {
      frequencyBandsDb: [-100],
      analysis: { minDecibels: -100, maxDecibels: -20 },
    },
    viewport: { width: 20, height: 100 },
    parameters: {
      color: '#3ab246',
      gapRatio: 0,
      minimumBarHeightPx: 1,
      symmetry: true,
      roundedEdges: true,
    },
  })

  assert.deepEqual(roundedRectangles, [[0, 40, 20, 20, 10]])
})

test('vertical bar gradient stays opaque until its configured fade point', () => {
  const gradientCalls = []
  const colorStops = []
  const gradient = {
    addColorStop: (...stop) => colorStops.push(stop),
  }
  const context = {
    fillStyle: '',
    createLinearGradient: (...coordinates) => {
      gradientCalls.push(coordinates)
      return gradient
    },
    fillRect() {},
  }
  const renderer = createBarRenderer()
  renderer.render({
    context,
    frame: {
      frequencyBandsDb: [-20],
      analysis: { minDecibels: -100, maxDecibels: -20 },
    },
    viewport: { width: 20, height: 100 },
    parameters: {
      ...DEFAULT_BAR_PARAMETERS,
      color: '#3AB246',
      gapRatio: 0,
      verticalGradient: true,
      verticalGradientFadeStart: 0.5,
    },
  })

  assert.deepEqual(gradientCalls, [[0, 50, 0, 0]])
  assert.deepEqual(colorStops, [
    [0, '#3AB246'],
    [0.5, '#3AB246'],
    [1, 'rgb(58 178 70 / 0)'],
  ])
  assert.equal(context.fillStyle, gradient)
})

test('symmetric vertical gradient fades toward both peaks', () => {
  const colorStops = []
  const context = {
    fillStyle: '',
    createLinearGradient: () => ({
      addColorStop: (...stop) => colorStops.push(stop),
    }),
    fillRect() {},
  }
  createBarRenderer().render({
    context,
    frame: {
      frequencyBandsDb: [-20],
      analysis: { minDecibels: -100, maxDecibels: -20 },
    },
    viewport: { width: 20, height: 100 },
    parameters: {
      ...DEFAULT_BAR_PARAMETERS,
      color: '#3AB246',
      gapRatio: 0,
      symmetry: true,
      verticalGradient: true,
      verticalGradientFadeStart: 0.5,
    },
  })

  assert.deepEqual(colorStops, [
    [0, 'rgb(58 178 70 / 0)'],
    [0.25, '#3AB246'],
    [0.75, '#3AB246'],
    [1, 'rgb(58 178 70 / 0)'],
  ])
})

test('frequency color gradient maps the first, middle, and last buckets to the palette', () => {
  const fills = []
  const context = {
    fillStyle: '',
    fillRect() {
      fills.push(this.fillStyle)
    },
  }
  createBarRenderer().render({
    context,
    frame: {
      frequencyBandsDb: [-20, -20, -20],
      analysis: { minDecibels: -100, maxDecibels: -20 },
    },
    viewport: { width: 60, height: 100 },
    parameters: {
      ...DEFAULT_BAR_PARAMETERS,
      frequencyColorGradient: true,
      frequencyColorPalette: 'cool',
      gapRatio: 0,
    },
  })

  assert.deepEqual(fills, ['#014F86', '#00B4D8', '#C0FDFF'])
})

test('user-defined frequency gradient uses all three custom colors', () => {
  const fills = []
  const context = {
    fillStyle: '',
    fillRect() {
      fills.push(this.fillStyle)
    },
  }
  createBarRenderer().render({
    context,
    frame: {
      frequencyBandsDb: [-20, -20, -20],
      analysis: { minDecibels: -100, maxDecibels: -20 },
    },
    viewport: { width: 60, height: 100 },
    parameters: {
      ...DEFAULT_BAR_PARAMETERS,
      frequencyColorGradient: true,
      frequencyColorPalette: 'custom',
      frequencyColorLow: '#112233',
      frequencyColorMid: '#445566',
      frequencyColorHigh: '#778899',
      gapRatio: 0,
    },
  })

  assert.deepEqual(fills, ['#112233', '#445566', '#778899'])
})

test('peak-hold cap waits for its hold duration before decaying', () => {
  const rectangles = []
  const context = {
    fillStyle: '',
    fillRect: (...rectangle) => rectangles.push(rectangle),
  }
  const renderer = createBarRenderer()
  const renderFrame = (timestampMs, decibels) => renderer.render({
    context,
    frame: {
      timestampMs,
      frequencyBandsDb: [decibels],
      analysis: { minDecibels: -100, maxDecibels: -20 },
    },
    viewport: { width: 20, height: 100 },
    parameters: {
      ...DEFAULT_BAR_PARAMETERS,
      gapRatio: 0,
      peakHold: true,
      peakHoldDurationMs: 500,
      peakDecayPerSecond: 0.75,
    },
  })

  renderFrame(0, -20)
  renderFrame(250, -100)
  renderFrame(1000, -100)

  const peakCaps = [rectangles[1], rectangles[3], rectangles[5]]
  assert.deepEqual(peakCaps[0], [0, 0, 20, 3])
  assert.deepEqual(peakCaps[1], [0, 0, 20, 3])
  assert.deepEqual(peakCaps[2], [0, 18.75, 20, 3])
})
