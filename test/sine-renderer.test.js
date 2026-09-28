import test from 'node:test'
import assert from 'node:assert/strict'
import { createSineRenderer } from '../src/visualization/renderers/sine/sineRenderer.js'

function drawWaves(levels, parameters = {}, viewport = { width: 200, height: 100 }, frameOverrides = {}) {
  const paths = []
  const context = {
    beginPath() {},
    moveTo(x, y) { paths.push([[x, y]]) },
    lineTo(x, y) { paths.at(-1).push([x, y]) },
    stroke() {},
  }
  createSineRenderer().render({
    context, viewport, parameters,
    frame: {
      frequencyBandsDb: levels,
      frequencyBinsDb: [-Infinity, -20],
      bands: levels.map(() => ({ startBin: 1, endBin: 1, highHz: 100 })),
      analysis: { minDecibels: -100, maxDecibels: -20, sampleRate: 1000, fftSize: 10 },
      ...frameOverrides,
    },
  })
  return paths
}

test('every bucket spans the canvas and returns to its centered baseline', () => {
  const paths = drawWaves([-20, -60, -Infinity])
  assert.equal(paths.length, 3)
  for (const path of paths) {
    assert.deepEqual(path[0], [0, 50])
    assert.deepEqual(path.at(-1), [200, 50])
  }
  const loudAmplitude = 50 - Math.min(...paths[0].map(([, y]) => y))
  const quietAmplitude = 50 - Math.min(...paths[1].map(([, y]) => y))
  assert.ok(loudAmplitude > 0)
  assert.ok(Math.abs(loudAmplitude / 2 - quietAmplitude) < 0.00001)
  assert.ok(paths[2].every(([, y]) => y === 50))
})

test('a broad bucket mixes frequencies according to their linear amplitudes', () => {
  const frame = { bands: [{ startBin: 1, endBin: 2, highHz: 200 }] }
  const render = (bins) => drawWaves([-20], {}, undefined, {
    ...frame, frequencyBinsDb: bins,
  })[0]
  const low = render([-Infinity, -20, -Infinity])
  const high = render([-Infinity, -Infinity, -20])
  const mixed = render([-Infinity, -20, -40])
  assert.notDeepEqual(low, high)
  assert.notDeepEqual(mixed, low)
  for (let point = 0; point < mixed.length; point += 1) {
    // A 20 dB difference means the second frequency has 1/10 the amplitude.
    const expectedY = (low[point][1] + 0.1 * high[point][1]) / 1.1
    assert.ok(Math.abs(mixed[point][1] - expectedY) < 1e-8)
    assert.ok(mixed[point][1] >= 0 && mixed[point][1] <= 100)
  }
})

test('bins outside a bucket and bins below the floor do not affect its shape', () => {
  const reference = drawWaves([-20])
  assert.deepEqual(drawWaves([-20], {}, undefined, {
    frequencyBinsDb: [0, -20, 0],
  }), reference)
  const [silent] = drawWaves([-20], {}, undefined, {
    frequencyBinsDb: [NaN, -110],
  })
  assert.ok(silent.every(([, y]) => y === 50))
})

test('manual bucket offsets move only the selected wave and scale with canvas height', () => {
  const paths = drawWaves([-Infinity, -Infinity], {
    fixedPosition: false,
    bandOffsets: { 1: 50 },
  })
  assert.ok(paths[0].every(([, y]) => y === 50))
  assert.ok(paths[1].every(([, y]) => y === 25.375))
  const large = drawWaves(
    [-Infinity],
    { fixedPosition: false, bandOffsets: { 0: -50 } },
    { width: 400, height: 200 },
  )
  assert.equal(large[0][0][1], 149.625)
})

test('fixed position keeps waves centered while preserving manual offsets', () => {
  const [fixed] = drawWaves([-Infinity], { bandOffsets: { 0: 75 } })
  assert.ok(fixed.every(([, y]) => y === 50))

  const [manual] = drawWaves([-Infinity], {
    fixedPosition: false,
    bandOffsets: { 0: 75 },
  })
  assert.ok(manual.every(([, y]) => y === 13.0625))
})

test('manual waves can meet at the center edges with an adjustable slope', () => {
  const parameters = {
    fixedPosition: false,
    meetAtCenter: true,
    bandOffsets: { 0: 75 },
  }
  const [gentle] = drawWaves([-Infinity], { ...parameters, centerMeetSlope: 1 })
  const [steep] = drawWaves([-Infinity], { ...parameters, centerMeetSlope: 4 })
  const [extraGentle] = drawWaves([-Infinity], { ...parameters, centerMeetSlope: 0.25 })

  assert.deepEqual(gentle[0], [0, 50])
  assert.deepEqual(gentle.at(-1), [200, 50])
  assert.ok(extraGentle.find(([x]) => x === 20)[1] > gentle.find(([x]) => x === 20)[1])
  assert.ok(gentle.find(([x]) => x === 20)[1] > steep.find(([x]) => x === 20)[1])
  assert.equal(extraGentle.find(([x]) => x === 100)[1], 13.0625)
  assert.equal(steep.find(([x]) => x === 100)[1], 13.0625)
})

test('time span changes wave cycles while silence and missing data remain safe', () => {
  assert.notDeepEqual(drawWaves([-20], { timeSpanMs: 5 }), drawWaves([-20], { timeSpanMs: 20 }))
  assert.deepEqual(drawWaves([]), [])
  assert.deepEqual(drawWaves([-20], {}, { width: 0, height: 100 }), [])
  assert.ok(drawWaves([NaN])[0].every(([x, y]) => Number.isFinite(x) && y === 50))
})

test('frequency gradient assigns the shared low-to-high colors to sine buckets', () => {
  const strokeColors = []
  const context = {
    strokeStyle: '',
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() { strokeColors.push(this.strokeStyle) },
  }
  createSineRenderer().render({
    context,
    viewport: { width: 200, height: 100 },
    parameters: {
      colorMode: 'frequency',
      frequencyColorPalette: 'custom',
      frequencyColorLow: '#000000',
      frequencyColorMid: '#FF0000',
      frequencyColorHigh: '#FFFFFF',
    },
    frame: {
      frequencyBandsDb: [-20, -20, -20],
      frequencyBinsDb: [-Infinity, -20],
      bands: Array.from({ length: 3 }, () => ({ startBin: 1, endBin: 1, highHz: 100 })),
      analysis: { minDecibels: -100, maxDecibels: -20, sampleRate: 1000, fftSize: 10 },
    },
  })

  assert.deepEqual(strokeColors, ['#000000', '#FF0000', '#FFFFFF'])
})

test('amplitude opacity maps each bucket level to its wave opacity', () => {
  const strokeOpacities = []
  const context = {
    globalAlpha: 1,
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() { strokeOpacities.push(this.globalAlpha) },
  }
  createSineRenderer().render({
    context,
    viewport: { width: 200, height: 100 },
    parameters: { amplitudeOpacity: true },
    frame: {
      frequencyBandsDb: [-20, -60, -100],
      frequencyBinsDb: [-Infinity, -20],
      bands: Array.from({ length: 3 }, () => ({ startBin: 1, endBin: 1, highHz: 100 })),
      analysis: { minDecibels: -100, maxDecibels: -20, sampleRate: 1000, fftSize: 10 },
    },
  })

  assert.deepEqual(strokeOpacities, [1, 0.5, 0])
  assert.equal(context.globalAlpha, 1)
})

test('a highlighted sine wave stays opaque while amplitude opacity is enabled', () => {
  const strokeOpacities = []
  const context = {
    globalAlpha: 1,
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() { strokeOpacities.push(this.globalAlpha) },
  }
  createSineRenderer().render({
    context,
    viewport: { width: 200, height: 100 },
    parameters: { amplitudeOpacity: true, highlightedBandIndex: 0 },
    frame: {
      frequencyBandsDb: [-100],
      frequencyBinsDb: [-Infinity, -100],
      bands: [{ startBin: 1, endBin: 1, highHz: 100 }],
      analysis: { minDecibels: -100, maxDecibels: -20, sampleRate: 1000, fftSize: 10 },
    },
  })

  assert.deepEqual(strokeOpacities, [1])
})
