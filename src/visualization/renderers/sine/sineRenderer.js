import { frequencyForBin, normalizeDecibels } from '../../../audio/analysis/spectrum.js'
import { buildFrequencyColors } from '../../color/frequencyColors.js'
import { DEFAULT_SINE_PARAMETERS } from './sineParameters.js'
import { buildSineBandOffsets } from './sinePositions.js'

export function createSineRenderer() {
  return {
    // This renderer uses only the current frame; there is no history to clear.
    reset() {},

    render({ context, frame, viewport, parameters }) {
      const levelsDb = frame.frequencyBandsDb
      const { width, height } = viewport
      if (!levelsDb.length || width <= 0 || height <= 0) return

      const settings = { ...DEFAULT_SINE_PARAMETERS, ...parameters }
      const lineWidth = Math.min(settings.lineWidthPx, height)
      const activeWidth = width
      const maximumAmplitude = Math.max(0, (height - lineWidth) / 2)
      const bandColors = buildFrequencyColors(settings, levelsDb.length)
      const bandOffsets = buildSineBandOffsets(settings, levelsDb.length)

      context.lineCap = 'round'
      context.lineJoin = 'round'

      for (let bandIndex = 0; bandIndex < levelsDb.length; bandIndex += 1) {
        const highlighted = bandIndex === settings.highlightedBandIndex
        const bandColor = bandColors?.[bandIndex] ?? settings.color
        context.strokeStyle = highlighted ? '#e6e6e6' : bandColor
        context.lineWidth = highlighted ? Math.min(lineWidth + 1, height) : lineWidth
        context.beginPath()
        const levelDb = levelsDb[bandIndex]
        let normalizedLevel = 0
        if (Number.isFinite(levelDb)) {
          normalizedLevel = normalizeDecibels(
            levelDb,
            frame.analysis.minDecibels,
            frame.analysis.maxDecibels,
          )
        }
        context.globalAlpha = settings.amplitudeOpacity && !highlighted
          ? normalizedLevel
          : 1
        const amplitude = normalizedLevel * maximumAmplitude
        // Offsets are percentages of half the canvas height; positive means up.
        const offset = bandOffsets[bandIndex]
        const positionedCenterY = height / 2 - (offset / 100) * maximumAmplitude
        const edgeCenterY = settings.meetAtCenter ? height / 2 : positionedCenterY
        context.moveTo(0, edgeCenterY)

        const band = frame.bands[bandIndex]
        const cycles = band.highHz * settings.timeSpanMs / 1000
        // Sample each cycle often enough to keep high-frequency curves smooth.
        const segmentCount = Math.max(24, Math.ceil(cycles * 12), Math.ceil(activeWidth))
        const wave = synthesizeBand(frame, band, settings.timeSpanMs, segmentCount)

        // A sine envelope brings both ends smoothly back to the baseline.
        // The bins supply the shape; the aggregate band level sets its height.
        for (let segment = 1; activeWidth > 0 && segment < segmentCount; segment += 1) {
          const progress = segment / segmentCount
          const envelope = Math.sin(progress * Math.PI) ** 2
          const x = progress * activeWidth
          const baselineY = getWaveBaselineY({
            canvasCenterY: height / 2,
            positionedCenterY,
            progress,
            meetAtCenter: settings.meetAtCenter,
            slope: settings.centerMeetSlope,
          })
          const y = baselineY - wave[segment] * amplitude * envelope
          context.lineTo(x, y)
        }
        context.lineTo(width, edgeCenterY)
        context.stroke()
      }
      context.globalAlpha = 1
    },
  }
}

function getWaveBaselineY({
  canvasCenterY,
  positionedCenterY,
  progress,
  meetAtCenter,
  slope,
}) {
  if (!meetAtCenter) return positionedCenterY
  const distanceFromNearestEdge = Math.min(progress, 1 - progress)
  const safeSlope = Math.min(8, Math.max(0.25, slope))
  const edgeProgress = Math.min(1, distanceFromNearestEdge * 2)
  // This curve always reaches the assigned position at the canvas midpoint.
  // Higher slopes reach it sooner; lower slopes stay near the edge center longer.
  const positionBlend = 1 - (1 - edgeProgress) ** safeSlope
  return canvasCenterY + (positionedCenterY - canvasCenterY) * positionBlend
}

function synthesizeBand(frame, band, timeSpanMs, segmentCount) {
  const wave = new Float64Array(segmentCount)
  let totalAmplitude = 0
  for (let bin = band.startBin; bin <= band.endBin; bin += 1) {
    const decibels = frame.frequencyBinsDb?.[bin]
    if (!Number.isFinite(decibels) || decibels <= frame.analysis.minDecibels) continue

    const amplitude = 10 ** (decibels / 20)
    const frequencyHz = frequencyForBin(bin, frame.analysis.sampleRate, frame.analysis.fftSize)
    const phaseStep = 2 * Math.PI * frequencyHz * timeSpanMs / 1000 / segmentCount
    // sin(n * step) = 2*cos(step)*sin((n-1)*step) - sin((n-2)*step).
    // This avoids a trigonometric call for every bin at every canvas point.
    const multiplier = 2 * Math.cos(phaseStep)
    let previous = 0
    let current = Math.sin(phaseStep)
    for (let segment = 1; segment < segmentCount; segment += 1) {
      wave[segment] += current * amplitude
      const next = multiplier * current - previous
      previous = current
      current = next
    }
    totalAmplitude += amplitude
  }
  // Relative linear amplitudes preserve the mixture without clipping when
  // a broad bucket contains many bins. FFT phase is unavailable here.
  if (totalAmplitude > 0) {
    for (let segment = 1; segment < segmentCount; segment += 1) {
      wave[segment] /= totalAmplitude
    }
  }
  return wave
}
