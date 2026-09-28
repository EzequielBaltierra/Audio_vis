import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ANALYSIS_PARAMETER_DEFINITIONS,
  BAND_COUNT_PARAMETER_DEFINITION,
} from '../src/audio/analysis/analysisParameters.js'
import { VISUAL_EQ_PARAMETER_DEFINITIONS } from '../src/audio/analysis/visualEqParameters.js'
import {
  OUTPUT_FORMATS,
  OUTPUT_PARAMETER_DEFINITIONS,
} from '../src/output/outputParameters.js'
import {
  clampParameterValue,
  nextParameterValue,
} from '../src/ui/parameterValues.js'
import {
  BAR_COLOR_PARAMETER_DEFINITIONS,
  BAR_PARAMETER_DEFINITIONS,
} from '../src/visualization/renderers/bar/barParameters.js'
import { SINE_PARAMETER_DEFINITIONS } from '../src/visualization/renderers/sine/sineParameters.js'

const definition = {
  minimum: 0,
  maximum: 100,
  step: 1,
  presets: [0, 10, 25, 50, 100],
}

test('band count supports six waves and finer low-count cycling', () => {
  const bands = BAND_COUNT_PARAMETER_DEFINITION
  assert.equal(clampParameterValue(6, bands), 6)
  assert.equal(nextParameterValue(5, bands, 1), 6)
  assert.equal(nextParameterValue(6, bands, 1), 8)
  assert.equal(nextParameterValue(6, bands, -1), 5)
  assert.equal(nextParameterValue(8, bands, 1), 10)
})

test('sine line width and center slope include the expanded ranges', () => {
  const lineWidth = SINE_PARAMETER_DEFINITIONS.find(({ id }) => id === 'lineWidthPx')
  const centerSlope = SINE_PARAMETER_DEFINITIONS.find(({ id }) => id === 'centerMeetSlope')

  assert.equal(lineWidth.minimum, 0.2)
  assert.equal(lineWidth.maximum, 10)
  assert.ok(lineWidth.presets.includes(0.3))
  assert.ok(lineWidth.presets.includes(8))
  assert.equal(centerSlope.minimum, 0.25)
  assert.ok(centerSlope.presets.includes(0.5))
  assert.ok(centerSlope.presets.includes(0.75))
})

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
    BAND_COUNT_PARAMETER_DEFINITION,
    ...VISUAL_EQ_PARAMETER_DEFINITIONS,
    ...OUTPUT_PARAMETER_DEFINITIONS,
    ...BAR_PARAMETER_DEFINITIONS,
    ...BAR_COLOR_PARAMETER_DEFINITIONS,
    ...SINE_PARAMETER_DEFINITIONS,
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
