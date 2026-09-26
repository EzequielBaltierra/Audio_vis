import { normalizeDecibels } from '../../../audio/analysis/spectrum.js'
import {
  BAR_FREQUENCY_COLOR_PALETTES,
  DEFAULT_BAR_PARAMETERS,
} from './barParameters.js'

export function createBarRenderer() {
  let peakLevels = []
  let peakHoldUntilMs = []
  let lastTimestampMs = null
  let cachedColorSignature = ''
  let cachedBandColors = []

  const reset = () => {
    peakLevels = []
    peakHoldUntilMs = []
    lastTimestampMs = null
    cachedColorSignature = ''
    cachedBandColors = []
  }

  return {
    reset,

    render({ context, frame, viewport, parameters = DEFAULT_BAR_PARAMETERS }) {
      const { width, height } = viewport
      const values = frame.frequencyBandsDb
      if (!values.length) return

      const settings = { ...DEFAULT_BAR_PARAMETERS, ...parameters }
      const slotWidth = width / values.length
      const gap = slotWidth * settings.gapRatio
      const barWidth = Math.max(0.5, slotWidth - gap)
      const centerY = height / 2
      const availableHeight = height / 2
      const timestampMs = Number.isFinite(frame.timestampMs) ? frame.timestampMs : 0
      const bandColors = getBandColors(settings, values.length)

      if (peakLevels.length !== values.length) {
        peakLevels = Array(values.length).fill(0)
        peakHoldUntilMs = Array(values.length).fill(timestampMs)
        lastTimestampMs = timestampMs
      }
      const previousTimestampMs = lastTimestampMs ?? timestampMs
      lastTimestampMs = timestampMs

      values.forEach((value, index) => {
        const normalized = normalizeDecibels(
          value,
          frame.analysis.minDecibels,
          frame.analysis.maxDecibels,
        )
        const x = index * slotWidth + gap / 2
        const barColor = bandColors?.[index] ?? settings.color
        const upwardExtent = getUpwardExtent(
          normalized,
          settings,
          barWidth,
          availableHeight,
        )

        if (settings.roundedEdges) {
          const radius = barWidth / 2
          const y = centerY - upwardExtent
          const renderedHeight = settings.symmetry
            ? upwardExtent * 2
            : upwardExtent + radius
          setBarFillStyle(context, settings, barColor, y, renderedHeight)
          fillRoundedRect(context, x, y, barWidth, renderedHeight, radius)
        } else {
          const y = centerY - upwardExtent
          const renderedHeight = settings.symmetry ? upwardExtent * 2 : upwardExtent
          setBarFillStyle(context, settings, barColor, y, renderedHeight)
          context.fillRect(x, y, barWidth, renderedHeight)
        }

        if (settings.peakHold) {
          const peakLevel = updatePeakLevel({
            index,
            normalized,
            timestampMs,
            previousTimestampMs,
            settings,
            peakLevels,
            peakHoldUntilMs,
          })
          drawPeakCaps({
            context,
            settings,
            color: barColor,
            x,
            barWidth,
            centerY,
            availableHeight,
            peakLevel,
          })
        }
      })
    },
  }

  function getBandColors(settings, bandCount) {
    if (!settings.frequencyColorGradient) return null

    const signature = [
      bandCount,
      settings.frequencyColorPalette,
      settings.frequencyColorLow,
      settings.frequencyColorMid,
      settings.frequencyColorHigh,
    ].join('|')
    if (signature === cachedColorSignature) return cachedBandColors

    const colors = getFrequencyPalette(settings)
    cachedBandColors = Array.from({ length: bandCount }, (_, index) => {
      const position = bandCount === 1 ? 0.5 : index / (bandCount - 1)
      return position <= 0.5
        ? interpolateHex(colors[0], colors[1], position * 2)
        : interpolateHex(colors[1], colors[2], (position - 0.5) * 2)
    })
    cachedColorSignature = signature
    return cachedBandColors
  }
}

function getUpwardExtent(normalized, settings, barWidth, availableHeight) {
  if (!settings.roundedEdges) {
    return Math.max(settings.minimumBarHeightPx, normalized * availableHeight)
  }

  const radius = barWidth / 2
  return radius + normalized * Math.max(0, availableHeight - radius)
}

function updatePeakLevel({
  index,
  normalized,
  timestampMs,
  previousTimestampMs,
  settings,
  peakLevels,
  peakHoldUntilMs,
}) {
  const currentPeak = peakLevels[index]
  if (normalized >= currentPeak) {
    peakLevels[index] = normalized
    peakHoldUntilMs[index] = timestampMs + settings.peakHoldDurationMs
    return normalized
  }

  const decayStartMs = Math.max(previousTimestampMs, peakHoldUntilMs[index])
  const decaySeconds = Math.max(0, timestampMs - decayStartMs) / 1000
  const decayedPeak = Math.max(
    normalized,
    currentPeak - settings.peakDecayPerSecond * decaySeconds,
  )
  peakLevels[index] = decayedPeak
  return decayedPeak
}

function drawPeakCaps({
  context,
  settings,
  color,
  x,
  barWidth,
  centerY,
  availableHeight,
  peakLevel,
}) {
  const peakExtent = getUpwardExtent(
    peakLevel,
    settings,
    barWidth,
    availableHeight,
  )
  const thickness = Math.max(1, Math.min(3, barWidth * 0.15))
  context.fillStyle = color
  context.fillRect(x, centerY - peakExtent, barWidth, thickness)
  if (settings.symmetry) {
    context.fillRect(x, centerY + peakExtent - thickness, barWidth, thickness)
  }
}

function getFrequencyPalette(settings) {
  return settings.frequencyColorPalette === 'custom'
    ? [
        normalizeHexColor(settings.frequencyColorLow, BAR_FREQUENCY_COLOR_PALETTES.warm[0]),
        normalizeHexColor(settings.frequencyColorMid, BAR_FREQUENCY_COLOR_PALETTES.warm[1]),
        normalizeHexColor(settings.frequencyColorHigh, BAR_FREQUENCY_COLOR_PALETTES.warm[2]),
      ]
    : BAR_FREQUENCY_COLOR_PALETTES[settings.frequencyColorPalette]
      ?? BAR_FREQUENCY_COLOR_PALETTES.warm
}

function interpolateHex(startColor, endColor, amount) {
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

function setBarFillStyle(context, settings, color, y, height) {
  if (!settings.verticalGradient) {
    context.fillStyle = color
    return
  }

  const bottom = y + height
  const fadeStart = Math.min(1, Math.max(0, settings.verticalGradientFadeStart))
  const gradient = context.createLinearGradient(0, bottom, 0, y)
  const transparentColor = withAlpha(color, 0)

  if (settings.symmetry) {
    gradient.addColorStop(0, transparentColor)
    gradient.addColorStop((1 - fadeStart) / 2, color)
    gradient.addColorStop((1 + fadeStart) / 2, color)
    gradient.addColorStop(1, transparentColor)
  } else {
    gradient.addColorStop(0, color)
    gradient.addColorStop(fadeStart, color)
    gradient.addColorStop(1, transparentColor)
  }

  context.fillStyle = gradient
}

function withAlpha(hexColor, alpha) {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hexColor)
  if (!match) return `rgb(0 0 0 / ${alpha})`
  const [, red, green, blue] = match
  return `rgb(${Number.parseInt(red, 16)} ${Number.parseInt(green, 16)} ${Number.parseInt(blue, 16)} / ${alpha})`
}

function fillRoundedRect(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.roundRect(x, y, width, height, safeRadius)
  context.fill()
}
