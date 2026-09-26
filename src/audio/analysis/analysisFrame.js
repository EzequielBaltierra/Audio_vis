import { buildLogBands, reduceToLogBands } from './spectrum.js'

export function createAnalysisFrameSampler(analyser, analysisParameters) {
  let frequencyData = new Float32Array(analyser.frequencyBinCount)
  let waveformData = new Float32Array(analyser.fftSize)
  let bands = buildBands(analyser, analysisParameters)

  function reconfigure(nextParameters) {
    frequencyData = new Float32Array(analyser.frequencyBinCount)
    waveformData = new Float32Array(analyser.fftSize)
    bands = buildBands(analyser, nextParameters)
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

    return {
      timestampMs,
      frequencyBinsDb: frequencyData,
      frequencyBandsDb: reduceToLogBands(
        frequencyData,
        bands,
        nextParameters.aggregation,
      ),
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

function buildBands(analyser, parameters) {
  return buildLogBands({
    sampleRate: analyser.context.sampleRate,
    fftSize: analyser.fftSize,
    bandCount: parameters.bandCount,
    minFrequency: parameters.minFrequencyHz,
    maxFrequency: parameters.maxFrequencyHz,
  })
}
