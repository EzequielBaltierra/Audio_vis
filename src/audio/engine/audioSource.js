export const LOCAL_AUDIO_ACCEPT = '.wav,.mp3,audio/wav,audio/x-wav,audio/mpeg,audio/mp3'

export function isSupportedAudioFile(file) {
  if (!file) return false
  const supportedExtension = /\.(wav|mp3)$/i.test(file.name)
  const supportedMimeType = /^(audio\/(wav|wave|x-wav|mpeg|mp3))$/i.test(file.type)
  return supportedExtension || supportedMimeType
}
