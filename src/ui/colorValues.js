export function normalizeHexColor(value) {
  const digits = value.replace('#', '')
  return /^[0-9a-f]{6}$/i.test(digits) ? `#${digits.toUpperCase()}` : null
}

export function hexToHsl(hexColor) {
  const normalized = normalizeHexColor(hexColor)
  if (!normalized) return { hue: 0, saturation: 0, lightness: 0 }

  const red = Number.parseInt(normalized.slice(1, 3), 16) / 255
  const green = Number.parseInt(normalized.slice(3, 5), 16) / 255
  const blue = Number.parseInt(normalized.slice(5, 7), 16) / 255
  const maximum = Math.max(red, green, blue)
  const minimum = Math.min(red, green, blue)
  const difference = maximum - minimum
  const lightness = (maximum + minimum) / 2

  if (difference === 0) {
    return { hue: 0, saturation: 0, lightness: lightness * 100 }
  }

  const saturation = difference / (1 - Math.abs(2 * lightness - 1))
  let hue
  if (maximum === red) hue = 60 * (((green - blue) / difference) % 6)
  else if (maximum === green) hue = 60 * ((blue - red) / difference + 2)
  else hue = 60 * ((red - green) / difference + 4)

  return {
    hue: hue < 0 ? hue + 360 : hue,
    saturation: saturation * 100,
    lightness: lightness * 100,
  }
}

export function hslToHex(hue, saturation, lightness) {
  const safeHue = ((Number(hue) % 360) + 360) % 360
  const safeSaturation = clamp(Number(saturation), 0, 100) / 100
  const safeLightness = clamp(Number(lightness), 0, 100) / 100
  const chroma = (1 - Math.abs(2 * safeLightness - 1)) * safeSaturation
  const section = safeHue / 60
  const secondary = chroma * (1 - Math.abs(section % 2 - 1))
  const [red, green, blue] = hueSectionToRgb(section, chroma, secondary)
  const offset = safeLightness - chroma / 2

  return `#${[red, green, blue].map((channel) => (
    Math.round((channel + offset) * 255).toString(16).padStart(2, '0')
  )).join('').toUpperCase()}`
}

function hueSectionToRgb(section, chroma, secondary) {
  if (section < 1) return [chroma, secondary, 0]
  if (section < 2) return [secondary, chroma, 0]
  if (section < 3) return [0, chroma, secondary]
  if (section < 4) return [0, secondary, chroma]
  if (section < 5) return [secondary, 0, chroma]
  return [chroma, 0, secondary]
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value))
}
