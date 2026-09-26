import test from 'node:test'
import assert from 'node:assert/strict'
import {
  LOCAL_AUDIO_ACCEPT,
  getMicrophoneErrorMessage,
  getSourceRouting,
  isSupportedAudioFile,
  MICROPHONE_SOURCE,
} from '../src/audio/engine/audioSource.js'

test('local audio selection accepts WAV and MP3 files', () => {
  assert.equal(isSupportedAudioFile({ name: 'track.wav', type: '' }), true)
  assert.equal(isSupportedAudioFile({ name: 'track.mp3', type: '' }), true)
  assert.equal(isSupportedAudioFile({ name: 'track', type: 'audio/mpeg' }), true)
  assert.equal(isSupportedAudioFile({ name: 'track.flac', type: 'audio/flac' }), false)
  assert.match(LOCAL_AUDIO_ACCEPT, /\.wav/)
  assert.match(LOCAL_AUDIO_ACCEPT, /\.mp3/)
})

test('microphone source is live and explicitly not monitored', () => {
  assert.equal(MICROPHONE_SOURCE.kind, 'microphone')
  assert.equal(MICROPHONE_SOURCE.title, 'Microphone input')
  assert.match(MICROPHONE_SOURCE.artist, /MONITOR OFF/)
  assert.deepEqual(getSourceRouting('microphone'), {
    playback: false,
    recording: false,
  })
  assert.deepEqual(getSourceRouting('file'), {
    playback: true,
    recording: true,
  })
})

test('microphone failures provide actionable messages', () => {
  assert.match(getMicrophoneErrorMessage({ name: 'NotAllowedError' }), /denied/i)
  assert.match(getMicrophoneErrorMessage({ name: 'NotFoundError' }), /No microphone/i)
  assert.match(getMicrophoneErrorMessage({ name: 'NotReadableError' }), /in use/i)
  assert.equal(
    getMicrophoneErrorMessage({ name: 'UnknownError', message: 'Device failed' }),
    'Device failed',
  )
})
