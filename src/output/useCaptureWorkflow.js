import { useCallback, useEffect, useRef, useState } from 'react'
import {
  findSupportedOutputMimeType,
  OUTPUT_FORMATS,
} from './outputParameters.js'

export function useCaptureWorkflow({ audio, rendererId, outputParameters, exportCanvasRef }) {
  const captureAttemptRef = useRef(null)
  const capturePhaseRef = useRef('idle')
  const reviewUrlRef = useRef('')
  const reviewVideoRef = useRef(null)
  const [capturePhase, setCapturePhase] = useState('idle')
  const [captureError, setCaptureError] = useState('')
  const [reviewUrl, setReviewUrl] = useState('')
  const [reviewCurrentTime, setReviewCurrentTime] = useState(0)
  const [reviewDuration, setReviewDuration] = useState(0)
  const [reviewPlaying, setReviewPlaying] = useState(false)
  const {
    getRecordingStream,
    pausePlayback,
    playFromStart,
    preparePlayback,
    restorePlaybackLoop,
    seek,
    source,
    status,
  } = audio
  const captureActive = capturePhase !== 'idle'

  const updateCapturePhase = useCallback((nextPhase) => {
    capturePhaseRef.current = nextPhase
    setCapturePhase(nextPhase)
  }, [])

  const clearReview = useCallback(() => {
    reviewVideoRef.current?.pause()
    if (reviewUrlRef.current) URL.revokeObjectURL(reviewUrlRef.current)
    reviewUrlRef.current = ''
    setReviewUrl('')
    setReviewCurrentTime(0)
    setReviewDuration(0)
    setReviewPlaying(false)
  }, [])

  const stopCapture = useCallback(
    ({ pauseAudio = true, discard = false } = {}) => {
      const attempt = captureAttemptRef.current
      if (!attempt) return
      if (discard) attempt.discard = true
      if (pauseAudio) pausePlayback()
      attempt.controller.abort()

      if (attempt.recorder?.state === 'recording') {
        attempt.recorder.stop()
        return
      }

      stopStream(attempt.stream)
      if (captureAttemptRef.current === attempt) {
        captureAttemptRef.current = null
        updateCapturePhase('idle')
        restorePlaybackLoop()
      }
    },
    [pausePlayback, restorePlaybackLoop, updateCapturePhase],
  )

  const resetForSource = useCallback(() => {
    stopCapture({ discard: true })
    clearReview()
    setCaptureError('')
  }, [clearReview, stopCapture])

  const handleCaptureFrame = useCallback(() => {
    const attempt = captureAttemptRef.current
    attempt?.resolveCaptureFrame?.()
  }, [])

  const startCapture = useCallback(async () => {
    const exportCanvas = exportCanvasRef.current
    if (
      capturePhaseRef.current !== 'idle'
      || !source
      || !rendererId
      || !exportCanvas
    ) return

    const attempt = {
      chunks: [],
      controller: new AbortController(),
      discard: false,
      recorder: null,
      resolveCaptureFrame: null,
      stream: null,
    }
    captureAttemptRef.current = attempt
    updateCapturePhase('preparing')
    clearReview()
    setCaptureError('')

    if (!window.MediaRecorder || !exportCanvas.captureStream) {
      setCaptureError('VIDEO CAPTURE IS NOT AVAILABLE IN THIS BROWSER')
      captureAttemptRef.current = null
      updateCapturePhase('idle')
      return
    }

    const format = OUTPUT_FORMATS[outputParameters.format]
    const mimeType = findSupportedOutputMimeType(window.MediaRecorder, outputParameters.format)
    if (!mimeType) {
      setCaptureError(`THIS BROWSER CANNOT ENCODE ${format?.id.toUpperCase() ?? 'VIDEO'} WITH AUDIO`)
      captureAttemptRef.current = null
      updateCapturePhase('idle')
      return
    }

    try {
      const prepared = await preparePlayback({ signal: attempt.controller.signal })
      if (!prepared || captureAttemptRef.current !== attempt) {
        if (captureAttemptRef.current === attempt) {
          captureAttemptRef.current = null
          updateCapturePhase('idle')
        }
        return
      }

      const canvasStream = exportCanvas.captureStream(outputParameters.fps)
      const audioStream = getRecordingStream()
      const tracks = [...canvasStream.getVideoTracks()]
      const audioTrack = audioStream?.getAudioTracks()[0]
      if (!audioTrack) {
        canvasStream.getTracks().forEach((track) => track.stop())
        throw new Error('AUDIO CAPTURE IS NOT AVAILABLE')
      }
      tracks.push(audioTrack.clone())

      const captureStream = new MediaStream(tracks)
      const recorder = new MediaRecorder(captureStream, {
        mimeType,
        videoBitsPerSecond: 8_000_000,
      })

      attempt.stream = captureStream
      attempt.recorder = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size) attempt.chunks.push(event.data)
      }
      recorder.onerror = () => {
        if (captureAttemptRef.current === attempt) setCaptureError('CAPTURE FAILED')
      }
      recorder.onstop = () => {
        const blob = new Blob(attempt.chunks, { type: mimeType })
        stopStream(attempt.stream)
        attempt.stream = null
        attempt.recorder = null
        restorePlaybackLoop()

        const isCurrentAttempt = captureAttemptRef.current === attempt
        if (isCurrentAttempt) {
          captureAttemptRef.current = null
          updateCapturePhase('idle')
        }

        if (!isCurrentAttempt || attempt.discard) {
          attempt.chunks = []
          return
        }
        if (!blob.size) {
          setCaptureError('NO VIDEO DATA WAS CAPTURED')
          return
        }

        const url = URL.createObjectURL(blob)
        reviewUrlRef.current = url
        setReviewUrl(url)
      }

      await waitForCaptureFrame(attempt)
      if (captureAttemptRef.current !== attempt) return

      const recorderStarted = waitForRecorderStart(recorder, attempt.controller.signal)
      recorder.start(1000)
      await recorderStarted
      if (captureAttemptRef.current !== attempt || recorder.state !== 'recording') return
      updateCapturePhase('recording')
      await playFromStart({ useLoop: false })
    } catch (error) {
      attempt.discard = true
      attempt.controller.abort()
      if (attempt.recorder?.state === 'recording') attempt.recorder.stop()
      else stopStream(attempt.stream)

      if (captureAttemptRef.current === attempt) {
        captureAttemptRef.current = null
        updateCapturePhase('idle')
        restorePlaybackLoop()
        if (error.name !== 'AbortError') {
          setCaptureError(error.message || 'CAPTURE COULD NOT START')
        }
      }
    }
  }, [
    clearReview,
    exportCanvasRef,
    getRecordingStream,
    outputParameters.format,
    outputParameters.fps,
    playFromStart,
    preparePlayback,
    rendererId,
    restorePlaybackLoop,
    source,
    updateCapturePhase,
  ])

  useEffect(() => {
    if (capturePhase === 'recording' && status === 'ended') {
      stopCapture({ pauseAudio: false })
    }
  }, [capturePhase, status, stopCapture])

  useEffect(() => () => {
    const attempt = captureAttemptRef.current
    if (attempt) {
      captureAttemptRef.current = null
      attempt.discard = true
      attempt.controller.abort()
      if (attempt.recorder?.state === 'recording') attempt.recorder.stop()
      else stopStream(attempt.stream)
    }
    if (reviewUrlRef.current) URL.revokeObjectURL(reviewUrlRef.current)
  }, [])

  const downloadReview = useCallback(() => {
    if (!reviewUrl || !source) return
    const baseName = source.fileName.replace(/\.(wav|mp3)$/i, '')
    const anchor = document.createElement('a')
    anchor.href = reviewUrl
    anchor.download = `${baseName}-${rendererId}.${OUTPUT_FORMATS[outputParameters.format].extension}`
    anchor.click()
  }, [outputParameters.format, rendererId, reviewUrl, source])

  const cancelReview = useCallback(() => {
    clearReview()
    seek(0)
  }, [clearReview, seek])

  const toggleReviewPlayback = useCallback(async () => {
    const video = reviewVideoRef.current
    if (!video) return
    if (video.paused) await video.play()
    else video.pause()
  }, [])

  const seekReview = useCallback((timeSeconds) => {
    if (!reviewVideoRef.current || !Number.isFinite(timeSeconds)) return
    reviewVideoRef.current.currentTime = timeSeconds
    setReviewCurrentTime(timeSeconds)
  }, [])

  return {
    cancelReview,
    captureActive,
    captureError,
    capturePhase,
    downloadReview,
    handleCaptureFrame,
    resetForSource,
    reviewCurrentTime,
    reviewDuration,
    reviewPlaying,
    reviewUrl,
    reviewVideoRef,
    seekReview,
    startCapture,
    stopCapture,
    toggleReviewPlayback,
    setReviewCurrentTime,
    setReviewDuration,
    setReviewPlaying,
  }
}

function waitForCaptureFrame(attempt) {
  return new Promise((resolve, reject) => {
    const { signal } = attempt.controller
    if (signal.aborted) {
      reject(createAbortError())
      return
    }

    const cleanup = () => {
      signal.removeEventListener('abort', onAbort)
      attempt.resolveCaptureFrame = null
    }
    const onAbort = () => {
      cleanup()
      reject(createAbortError())
    }
    attempt.resolveCaptureFrame = () => {
      cleanup()
      resolve()
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

function waitForRecorderStart(recorder, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(createAbortError())
      return
    }
    const cleanup = () => {
      recorder.removeEventListener('start', onStart)
      recorder.removeEventListener('error', onError)
      signal.removeEventListener('abort', onAbort)
    }
    const onStart = () => {
      cleanup()
      resolve()
    }
    const onError = (event) => {
      cleanup()
      reject(event.error ?? new Error('CAPTURE COULD NOT START'))
    }
    const onAbort = () => {
      cleanup()
      reject(createAbortError())
    }
    recorder.addEventListener('start', onStart)
    recorder.addEventListener('error', onError)
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

function stopStream(stream) {
  stream?.getTracks().forEach((track) => track.stop())
}

function createAbortError() {
  const error = new Error('The operation was cancelled.')
  error.name = 'AbortError'
  return error
}
