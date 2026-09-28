import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildFrequencyColors,
  getFrequencyPalette,
} from '../src/visualization/color/frequencyColors.js'

test('frequency colors blend through the low, middle, and high colors', () => {
  const settings = {
    colorMode: 'frequency',
    frequencyColorPalette: 'custom',
    frequencyColorLow: '#000000',
    frequencyColorMid: '#FF0000',
    frequencyColorHigh: '#FFFFFF',
  }

  assert.deepEqual(buildFrequencyColors(settings, 5), [
    '#000000',
    '#800000',
    '#FF0000',
    '#FF8080',
    '#FFFFFF',
  ])
  assert.deepEqual(getFrequencyPalette(settings), [
    '#000000',
    '#FF0000',
    '#FFFFFF',
  ])
})

test('solid color mode does not create per-frequency colors', () => {
  assert.equal(buildFrequencyColors({ colorMode: 'solid' }, 6), null)
})
