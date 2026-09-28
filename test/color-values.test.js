import test from 'node:test'
import assert from 'node:assert/strict'
import { hexToHsl, hslToHex, normalizeHexColor } from '../src/ui/colorValues.js'

test('hex colors normalize to the renderer format', () => {
  assert.equal(normalizeHexColor('3ab246'), '#3AB246')
  assert.equal(normalizeHexColor('#ABCDEF'), '#ABCDEF')
  assert.equal(normalizeHexColor('#123'), null)
})

test('primary HSL colors convert to hexadecimal', () => {
  assert.equal(hslToHex(0, 100, 50), '#FF0000')
  assert.equal(hslToHex(120, 100, 50), '#00FF00')
  assert.equal(hslToHex(240, 100, 50), '#0000FF')
})

test('hexadecimal colors convert to HSL channel values', () => {
  assert.deepEqual(hexToHsl('#FF0000'), { hue: 0, saturation: 100, lightness: 50 })
  assert.deepEqual(hexToHsl('#808080'), {
    hue: 0,
    saturation: 0,
    lightness: 50.19607843137255,
  })
})
