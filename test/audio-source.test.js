import test from 'node:test'
import assert from 'node:assert/strict'
import {
  LOCAL_AUDIO_ACCEPT,
  isSupportedAudioFile,
} from '../src/audio/engine/audioSource.js'

test('local audio selection accepts WAV and MP3 files', () => {
  assert.equal(isSupportedAudioFile({ name: 'track.wav', type: '' }), true)
  assert.equal(isSupportedAudioFile({ name: 'track.mp3', type: '' }), true)
  assert.equal(isSupportedAudioFile({ name: 'track', type: 'audio/mpeg' }), true)
  assert.equal(isSupportedAudioFile({ name: 'track.flac', type: 'audio/flac' }), false)
  assert.match(LOCAL_AUDIO_ACCEPT, /\.wav/)
  assert.match(LOCAL_AUDIO_ACCEPT, /\.mp3/)
})
