import { buildLogBands, reduceToLogBands } from './spectrum.js'

export function createAnalysisFrameSampler(analyser, analysisParameters) {
  let frequencyData = new Float32Array(analyser.frequencyBinCount)
  let waveformData = new Float32Array(analyser.fftSize)
  let bands = buildBands(analyser, analysisParameters)
  let previousBandLevelsDb = []
  let previousTimestampMs = null

  function reconfigure(nextParameters) {
    frequencyData = new Float32Array(analyser.frequencyBinCount)
    waveformData = new Float32Array(analyser.fftSize)
    bands = buildBands(analyser, nextParameters)
    previousBandLevelsDb = []
    previousTimestampMs = null
  }

  function sample(timestampMs, nextParameters) {
    if (
      frequencyData.length !== analyser.frequencyBinCount ||
      waveformData.length !== analyser.fftSize ||
      bands.length !== nextParameters.bandCount
    ) {
      reconfigure(nextParameters)
    }

    analyser.getFloatFrequencyData(frequencyData)
    analyser.getFloatTimeDomainData(waveformData)

    const measuredBandLevelsDb = reduceToLogBands(
      frequencyData,
      bands,
      nextParameters.aggregation,
    )
    const elapsedMs = previousTimestampMs === null
      ? 0
      : Math.max(0, timestampMs - previousTimestampMs)
    const frequencyBandsDb = applyVisualEnvelope(
      measuredBandLevelsDb,
      previousBandLevelsDb,
      elapsedMs,
      nextParameters.attackMs,
      nextParameters.releaseMs,
    )
    previousBandLevelsDb = frequencyBandsDb
    previousTimestampMs = timestampMs

    return {
      timestampMs,
      frequencyBinsDb: frequencyData,
      frequencyBandsDb,
      waveform: waveformData,
      bands,
      analysis: {
        sampleRate: analyser.context.sampleRate,
        fftSize: analyser.fftSize,
        minDecibels: analyser.minDecibels,
        maxDecibels: analyser.maxDecibels,
      },
    }
  }

  return { reconfigure, sample }
}

export function applyVisualEnvelope(
  measuredLevelsDb,
  previousLevelsDb,
  elapsedMs,
  attackMs,
  releaseMs,
) {
  return measuredLevelsDb.map((measuredDb, index) => {
    const previousDb = previousLevelsDb[index]
    if (!Number.isFinite(previousDb) || elapsedMs <= 0) return measuredDb

    const responseMs = measuredDb >= previousDb ? attackMs : releaseMs
    if (!Number.isFinite(responseMs) || responseMs <= 0) return measuredDb

    const blend = 1 - Math.exp(-elapsedMs / responseMs)
    const previousAmplitude = 10 ** (previousDb / 20)
    const measuredAmplitude = 10 ** (measuredDb / 20)
    const nextAmplitude = previousAmplitude + (measuredAmplitude - previousAmplitude) * blend
    return nextAmplitude > 0 ? 20 * Math.log10(nextAmplitude) : -120
  })
}

function buildBands(analyser, parameters) {
  return buildLogBands({
    sampleRate: analyser.context.sampleRate,
    fftSize: analyser.fftSize,
    bandCount: parameters.bandCount,
    minFrequency: parameters.minFrequencyHz,
    maxFrequency: parameters.maxFrequencyHz,
  })
}
