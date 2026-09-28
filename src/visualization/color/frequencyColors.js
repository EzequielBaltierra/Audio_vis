import { FREQUENCY_COLOR_PALETTES } from './colorParameters.js'

export function buildFrequencyColors(settings, bandCount) {
  if (settings.colorMode !== 'frequency') return null
  const colors = getFrequencyPalette(settings)
  return Array.from({ length: bandCount }, (_, index) => {
    const position = bandCount === 1 ? 0.5 : index / (bandCount - 1)
    return position <= 0.5
      ? interpolateHex(colors[0], colors[1], position * 2)
      : interpolateHex(colors[1], colors[2], (position - 0.5) * 2)
  })
}

export function getFrequencyPalette(settings) {
  return settings.frequencyColorPalette === 'custom'
    ? [
        normalizeHexColor(settings.frequencyColorLow, FREQUENCY_COLOR_PALETTES.warm[0]),
        normalizeHexColor(settings.frequencyColorMid, FREQUENCY_COLOR_PALETTES.warm[1]),
        normalizeHexColor(settings.frequencyColorHigh, FREQUENCY_COLOR_PALETTES.warm[2]),
      ]
    : FREQUENCY_COLOR_PALETTES[settings.frequencyColorPalette]
      ?? FREQUENCY_COLOR_PALETTES.warm
}

export function interpolateHex(startColor, endColor, amount) {
  const start = parseHexColor(startColor)
  const end = parseHexColor(endColor)
  const channels = start.map((channel, index) => (
    Math.round(channel + (end[index] - channel) * amount)
  ))
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

function normalizeHexColor(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback
}

function parseHexColor(hexColor) {
  return [
    Number.parseInt(hexColor.slice(1, 3), 16),
    Number.parseInt(hexColor.slice(3, 5), 16),
    Number.parseInt(hexColor.slice(5, 7), 16),
  ]
}
