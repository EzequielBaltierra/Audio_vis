import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_VISUAL_EQ_PARAMETERS,
  VISUAL_EQ_BANDS,
  VISUAL_EQ_PARAMETER_DEFINITIONS,
} from '../src/audio/analysis/visualEqParameters.js'
import { configureVisualEq } from '../src/audio/engine/useAudioEngine.js'

test('visual EQ defines five fixed frequency bands from bass through treble', () => {
  assert.deepEqual(
    VISUAL_EQ_BANDS.map(({ frequencyHz }) => frequencyHz),
    [60, 250, 1000, 4000, 12000],
  )
})

test('every visual EQ band defaults to 0 dB and spans -30 dB to +30 dB', () => {
  assert.equal(VISUAL_EQ_PARAMETER_DEFINITIONS.length, 5)
  for (const definition of VISUAL_EQ_PARAMETER_DEFINITIONS) {
    assert.equal(DEFAULT_VISUAL_EQ_PARAMETERS[definition.id], 0)
    assert.equal(definition.minimum, -30)
    assert.equal(definition.maximum, 30)
  }
})

test('visual EQ configures five peaking filters with independent gains', () => {
  const nodes = VISUAL_EQ_BANDS.map(() => ({
    type: '',
    frequency: { value: 0 },
    Q: { value: 0 },
    gain: { value: 0 },
  }))
  const parameters = { ...DEFAULT_VISUAL_EQ_PARAMETERS, gain1kHzDb: 30 }

  configureVisualEq(nodes, parameters, 48000)

  assert.deepEqual(nodes.map(({ type }) => type), Array(5).fill('peaking'))
  assert.deepEqual(nodes.map(({ frequency }) => frequency.value), [60, 250, 1000, 4000, 12000])
  assert.deepEqual(nodes.map(({ gain }) => gain.value), [0, 0, 30, 0, 0])
  assert.deepEqual(nodes.map(({ Q }) => Q.value), Array(5).fill(1))
})
