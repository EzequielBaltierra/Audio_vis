import test from 'node:test'
import assert from 'node:assert/strict'
import { ANALYSIS_PARAMETER_DEFINITIONS } from '../src/audio/analysis/analysisParameters.js'
import { VISUAL_EQ_PARAMETER_DEFINITIONS } from '../src/audio/analysis/visualEqParameters.js'
import {
  OUTPUT_FORMATS,
  OUTPUT_PARAMETER_DEFINITIONS,
} from '../src/output/outputParameters.js'
import {
  clampParameterValue,
  nextParameterValue,
} from '../src/ui/parameterValues.js'
import { BAR_PARAMETER_DEFINITIONS } from '../src/visualization/renderers/bar/barParameters.js'

const definition = {
  minimum: 0,
  maximum: 100,
  step: 1,
  presets: [0, 10, 25, 50, 100],
}

test('parameter stepping follows explicit presets', () => {
  assert.equal(nextParameterValue(10, definition, 1), 25)
  assert.equal(nextParameterValue(25, definition, -1), 10)
})

test('custom parameter values step to the nearest preset in the requested direction', () => {
  assert.equal(nextParameterValue(26, definition, 1), 50)
  assert.equal(nextParameterValue(26, definition, -1), 25)
})

test('typed parameter overrides are clamped to their valid range', () => {
  assert.equal(clampParameterValue(73, definition), 73)
  assert.equal(clampParameterValue(120, definition), 100)
  assert.equal(clampParameterValue('', definition), null)
  assert.equal(clampParameterValue('not-a-number', definition), null)
})

test('every parameter has user-facing help text', () => {
  const definitions = [
    ...ANALYSIS_PARAMETER_DEFINITIONS,
    ...VISUAL_EQ_PARAMETER_DEFINITIONS,
    ...OUTPUT_PARAMETER_DEFINITIONS,
    ...BAR_PARAMETER_DEFINITIONS,
    ...Object.values(OUTPUT_FORMATS),
  ]

  for (const parameter of definitions) {
    assert.equal(
      typeof parameter.affects,
      'string',
      `${parameter.label} is missing help text`,
    )
    assert.notEqual(
      parameter.affects.trim(),
      '',
      `${parameter.label} has empty help text`,
    )
  }
})
