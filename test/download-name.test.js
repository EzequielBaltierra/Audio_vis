import assert from 'node:assert/strict'
import test from 'node:test'
import { buildDownloadName, sanitizeFileNamePart } from '../src/output/downloadName.js'

test('buildDownloadName preserves ordinary recording names', () => {
  assert.equal(buildDownloadName('my mix.mp3', 'bars', 'webm'), 'my mix-bars.webm')
})

test('buildDownloadName removes path and control characters', () => {
  assert.equal(
    buildDownloadName('../../<script>\u0000.wav', '../bars', 'MP4'),
    'script-bars.mp4',
  )
})

test('buildDownloadName uses safe fallbacks for invalid values', () => {
  assert.equal(buildDownloadName('...', '', 'video/webm'), 'audio-visualization.webm')
})

test('sanitizeFileNamePart limits untrusted names', () => {
  assert.equal(sanitizeFileNamePart('a'.repeat(100), 'audio').length, 80)
})
