export const LOCAL_AUDIO_ACCEPT = '.wav,.mp3,audio/wav,audio/x-wav,audio/mpeg,audio/mp3'

export const MICROPHONE_SOURCE = Object.freeze({
  kind: 'microphone',
  title: 'Microphone input',
  artist: 'LIVE / MONITOR OFF',
  fileName: 'microphone',
})

export function isSupportedAudioFile(file) {
  if (!file) return false
  const supportedExtension = /\.(wav|mp3)$/i.test(file.name)
  const supportedMimeType = /^(audio\/(wav|wave|x-wav|mpeg|mp3))$/i.test(file.type)
  return supportedExtension || supportedMimeType
}

export function getSourceRouting(kind) {
  return kind === 'microphone'
    ? { playback: false, recording: false }
    : { playback: true, recording: true }
}

export function getMicrophoneErrorMessage(error) {
  if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
    return 'Microphone access was denied. Allow access and try again.'
  }
  if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
    return 'No microphone was found.'
  }
  if (error?.name === 'NotReadableError' || error?.name === 'TrackStartError') {
    return 'The microphone is already in use or could not be started.'
  }
  return error?.message || 'The microphone could not be started.'
}
