import test from 'node:test'
import assert from 'node:assert/strict'
import { subscribeMediaEvents } from '../src/audio/engine/mediaEvents.js'

test('queued player events cannot pause or overwrite live microphone state', async () => {
  const audio = new EventTarget()
  let sourceKind = 'media'
  let isPlaying = true
  let status = 'playing'
  const unsubscribe = subscribeMediaEvents(audio, {
    pause: () => { isPlaying = false; status = 'paused' },
    ended: () => { isPlaying = false; status = 'ended' },
    error: () => { status = 'error' },
    loadedmetadata: () => { status = 'ready' },
  }, () => sourceKind === 'media')

  const queuedEvents = Promise.resolve().then(() => {
    for (const name of ['pause', 'ended', 'error', 'loadedmetadata']) {
      audio.dispatchEvent(new Event(name))
    }
  })
  sourceKind = 'microphone'
  status = 'live'
  await queuedEvents
  assert.equal(isPlaying, true)
  assert.equal(status, 'live')

  sourceKind = 'media'
  audio.dispatchEvent(new Event('pause'))
  assert.equal(isPlaying, false)
  assert.equal(status, 'paused')

  unsubscribe()
  audio.dispatchEvent(new Event('error'))
  assert.equal(status, 'paused')
})
