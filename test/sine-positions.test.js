import test from 'node:test'
import assert from 'node:assert/strict'
import { buildSineBandOffsets } from '../src/visualization/renderers/sine/sinePositions.js'

test('distributed sine bands fill even positions from bottom to top', () => {
  assert.deepEqual(buildSineBandOffsets({
    fixedPosition: false,
    positionLayout: 'distributed',
  }, 4), [-75, -25, 25, 75])
})

test('automatic layout padding moves the outer positions away from the edges', () => {
  assert.deepEqual(buildSineBandOffsets({
    fixedPosition: false,
    positionLayout: 'distributed',
    layoutPaddingPercent: 25,
  }, 3), [-50, 0, 50])
  assert.deepEqual(buildSineBandOffsets({
    fixedPosition: false,
    positionLayout: 'distributed',
    layoutPaddingPercent: 0,
  }, 2), [-100, 100])
})

test('shuffled sine bands use every even position outside frequency order', () => {
  const distributed = buildSineBandOffsets({
    fixedPosition: false,
    positionLayout: 'distributed',
  }, 8)
  const shuffled = buildSineBandOffsets({
    fixedPosition: false,
    positionLayout: 'shuffled',
  }, 8)

  assert.notDeepEqual(shuffled, distributed)
  assert.deepEqual([...shuffled].sort((left, right) => left - right), distributed)
})

test('frequency groups keep neighboring bands at four shared positions', () => {
  const offsets = buildSineBandOffsets({
    fixedPosition: false,
    positionLayout: 'groups',
    positionGroupCount: 4,
  }, 16)

  assert.deepEqual(offsets, [
    -75, -75, -75, -75,
    -25, -25, -25, -25,
    25, 25, 25, 25,
    75, 75, 75, 75,
  ])
})

test('fixed and manual layouts retain their existing position behavior', () => {
  assert.deepEqual(buildSineBandOffsets({ fixedPosition: true }, 3), [0, 0, 0])
  assert.deepEqual(buildSineBandOffsets({
    fixedPosition: false,
    positionLayout: 'manual',
    bandOffsets: { 0: 20, 2: -40 },
  }, 3), [20, 0, -40])
})
