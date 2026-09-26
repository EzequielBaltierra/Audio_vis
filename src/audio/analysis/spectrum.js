const DEFAULT_BAND_COUNT = 96
const DEFAULT_MIN_FREQUENCY = 20

export function frequencyForBin(binIndex, sampleRate, fftSize) {
  return (binIndex * sampleRate) / fftSize
}

export function buildLogBands({
  sampleRate,
  fftSize,
  bandCount = DEFAULT_BAND_COUNT,
  minFrequency = DEFAULT_MIN_FREQUENCY,
  maxFrequency = null,
}) {
  if (sampleRate <= 0 || fftSize <= 0 || bandCount <= 0) {
    throw new RangeError('sampleRate, fftSize, and bandCount must be positive')
  }

  const nyquist = sampleRate / 2
  const safeMaximum = Math.min(
    nyquist,
    Number.isFinite(maxFrequency) ? maxFrequency : nyquist,
  )
  const safeMinimum = Math.max(minFrequency, sampleRate / fftSize)
  if (safeMaximum <= safeMinimum) {
    throw new RangeError('maxFrequency must be greater than minFrequency')
  }
  const ratio = Math.pow(safeMaximum / safeMinimum, 1 / bandCount)

  return Array.from({ length: bandCount }, (_, index) => {
    const lowHz = safeMinimum * Math.pow(ratio, index)
    const highHz = safeMinimum * Math.pow(ratio, index + 1)
    const startBin = Math.max(0, Math.floor((lowHz * fftSize) / sampleRate))
    const endBin = Math.min(
      fftSize / 2 - 1,
      Math.max(startBin, Math.ceil((highHz * fftSize) / sampleRate) - 1),
    )

    return {
      lowHz: Number(lowHz.toFixed(2)),
      highHz: Number(highHz.toFixed(2)),
      centerHz: Number(Math.sqrt(lowHz * highHz).toFixed(2)),
      startBin,
      endBin,
    }
  })
}

export function reduceToLogBands(amplitudesDb, bands, aggregation = 'peak') {
  return bands.map(({ startBin, endBin }) => {
    if (aggregation === 'mean' || aggregation === 'rms') {
      let sum = 0
      let count = 0
      for (let bin = startBin; bin <= endBin; bin += 1) {
        const decibels = amplitudesDb[bin]
        const amplitude = Number.isFinite(decibels) ? Math.pow(10, decibels / 20) : 0
        sum += aggregation === 'rms' ? amplitude * amplitude : amplitude
        count += 1
      }
      const aggregateAmplitude = aggregation === 'rms'
        ? Math.sqrt(sum / Math.max(1, count))
        : sum / Math.max(1, count)
      return amplitudeToDecibels(aggregateAmplitude)
    }

    if (aggregation !== 'peak') {
      throw new RangeError(`Unsupported aggregation method: ${aggregation}`)
    }

    let peak = Number.NEGATIVE_INFINITY
    for (let bin = startBin; bin <= endBin; bin += 1) {
      peak = Math.max(peak, amplitudesDb[bin] ?? Number.NEGATIVE_INFINITY)
    }
    return Number.isFinite(peak) ? peak : -120
  })
}

function amplitudeToDecibels(amplitude) {
  return amplitude > 0 ? 20 * Math.log10(amplitude) : -120
}

export function normalizeDecibels(value, minimum = -100, maximum = -20) {
  return Math.min(1, Math.max(0, (value - minimum) / (maximum - minimum)))
}
