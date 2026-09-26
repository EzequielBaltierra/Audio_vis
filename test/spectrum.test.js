import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildLogBands,
  frequencyForBin,
  normalizeDecibels,
  reduceToLogBands,
} from '../src/audio/analysis/spectrum.js'

test('frequencyForBin uses the FFT bin-width formula', () => {
  assert.equal(frequencyForBin(100, 48_000, 4_800), 1_000)
})

test('buildLogBands spans the audible range without invalid bins', () => {
  const bands = buildLogBands({ sampleRate: 48_000, fftSize: 4_096, bandCount: 12 })
  assert.equal(bands.length, 12)
  assert.ok(bands[0].lowHz >= 20)
  assert.equal(bands.at(-1).highHz, 24_000)
  assert.ok(bands.every((band) => band.startBin <= band.endBin))
})

test('buildLogBands honors a visualizer frequency ceiling', () => {
  const bands = buildLogBands({
    sampleRate: 48_000,
    fftSize: 4_096,
    bandCount: 12,
    maxFrequency: 12_000,
  })
  assert.equal(bands.at(-1).highHz, 12_000)
})

test('reduceToLogBands keeps the peak decibel magnitude in each band', () => {
  const magnitudes = new Float32Array([-80, -30, -60, -42])
  const bands = [
    { startBin: 0, endBin: 1 },
    { startBin: 2, endBin: 3 },
  ]
  assert.deepEqual(reduceToLogBands(magnitudes, bands), [-30, -42])
})

test('mean aggregation averages linear amplitudes before returning decibels', () => {
  const magnitudes = new Float32Array([-20, -40])
  const [mean] = reduceToLogBands(
    magnitudes,
    [{ startBin: 0, endBin: 1 }],
    'mean',
  )
  assert.ok(Math.abs(mean - -25.19274621) < 1e-8)
})

test('RMS aggregation averages linear power before returning decibels', () => {
  const magnitudes = new Float32Array([-20, -40])
  const [rms] = reduceToLogBands(
    magnitudes,
    [{ startBin: 0, endBin: 1 }],
    'rms',
  )
  assert.ok(Math.abs(rms - -22.96708622) < 1e-8)
})

test('unsupported aggregation methods are rejected', () => {
  assert.throws(
    () => reduceToLogBands(new Float32Array([-20]), [{ startBin: 0, endBin: 0 }], 'median'),
    /Unsupported aggregation method/,
  )
})

test('normalization clamps decibels to the display range', () => {
  assert.equal(normalizeDecibels(-120), 0)
  assert.equal(normalizeDecibels(-60), 0.5)
  assert.equal(normalizeDecibels(0), 1)
})
