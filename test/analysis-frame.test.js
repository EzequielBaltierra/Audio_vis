import test from 'node:test'
import assert from 'node:assert/strict'
import { applyVisualEnvelope } from '../src/audio/analysis/analysisFrame.js'

test('visual envelope applies attack only while levels rise', () => {
  const [slowedRise] = applyVisualEnvelope([-20], [-80], 50, 200, 0)
  const [immediateFall] = applyVisualEnvelope([-80], [-20], 50, 200, 0)
  assert.ok(slowedRise > -80 && slowedRise < -20)
  assert.equal(immediateFall, -80)
})

test('visual envelope applies release only while levels fall', () => {
  const [immediateRise] = applyVisualEnvelope([-20], [-80], 50, 0, 200)
  const [slowedFall] = applyVisualEnvelope([-80], [-20], 50, 0, 200)
  assert.equal(immediateRise, -20)
  assert.ok(slowedFall < -20 && slowedFall > -80)
})

test('visual envelope uses measured levels for its first frame', () => {
  assert.deepEqual(applyVisualEnvelope([-40, -20], [], 0, 500, 500), [-40, -20])
})
