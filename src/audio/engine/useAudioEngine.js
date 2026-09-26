import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_ANALYSIS_PARAMETERS,
  normalizeAnalysisParameters,
} from '../analysis/analysisParameters.js'
import {
  DEFAULT_VISUAL_EQ_PARAMETERS,
  decibelsToGain,
  normalizeVisualEqParameters,
} from '../analysis/visualEqParameters.js'
import { isSupportedAudioFile } from './audioSource.js'

export function useAudioEngine({
  analysisParameters = DEFAULT_ANALYSIS_PARAMETERS,
  visualEqParameters = DEFAULT_VISUAL_EQ_PARAMETERS,
  muted = false,
  loop = false,
} = {}) {
  const audioRef = useRef(null)
  const contextRef = useRef(null)
  const analyserRef = useRef(null)
  const recordingDestinationRef = useRef(null)
  const playbackGainRef = useRef(null)
  const visualEqNodesRef = useRef(null)
  const mediaElementSourceRef = useRef(null)
  const activeSourceNodeRef = useRef(null)
  const analysisParametersRef = useRef(normalizeAnalysisParameters(analysisParameters))
  const visualEqParametersRef = useRef(normalizeVisualEqParameters(visualEqParameters))
  const mutedRef = useRef(Boolean(muted))
  const loopRef = useRef(Boolean(loop))
  const objectUrlRef = useRef(null)
  const [analyser, setAnalyser] = useState(null)
  const [source, setSource] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const ensureAudioGraph = useCallback(() => {
    if (analyserRef.current) return analyserRef.current

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) {
      throw new Error('This browser does not support the Web Audio API.')
    }

    const context = new AudioContextClass()
    const nextAnalyser = context.createAnalyser()
    const recordingDestination = context.createMediaStreamDestination()
    const playbackGain = context.createGain()
    const analysisGain = context.createGain()
    const lowShelf = context.createBiquadFilter()
    const highShelf = context.createBiquadFilter()
    const silentSink = context.createGain()

    configureAnalyser(nextAnalyser, analysisParametersRef.current)
    configureVisualEq(
      { analysisGain, lowShelf, highShelf },
      visualEqParametersRef.current,
      context.sampleRate,
    )

    playbackGain.gain.value = mutedRef.current ? 0 : 1
    playbackGain.connect(context.destination)
    analysisGain.connect(lowShelf)
    lowShelf.connect(highShelf)
    highShelf.connect(nextAnalyser)
    nextAnalyser.connect(silentSink)
    silentSink.gain.value = 0
    silentSink.connect(context.destination)

    contextRef.current = context
    analyserRef.current = nextAnalyser
    recordingDestinationRef.current = recordingDestination
    playbackGainRef.current = playbackGain
    visualEqNodesRef.current = { analysisGain, lowShelf, highShelf }
    setAnalyser(nextAnalyser)
    return nextAnalyser
  }, [])

  const connectSourceNode = useCallback((node, { playback }) => {
    activeSourceNodeRef.current?.disconnect()
    activeSourceNodeRef.current = node
    if (playback) node.connect(playbackGainRef.current)
    node.connect(recordingDestinationRef.current)
    node.connect(visualEqNodesRef.current.analysisGain)
  }, [])

  const connectMediaElement = useCallback(() => {
    ensureAudioGraph()
    if (!mediaElementSourceRef.current) {
      mediaElementSourceRef.current = contextRef.current.createMediaElementSource(audioRef.current)
    }
    connectSourceNode(mediaElementSourceRef.current, { playback: true })
  }, [connectSourceNode, ensureAudioGraph])

  useEffect(() => {
    analysisParametersRef.current = normalizeAnalysisParameters(analysisParameters)
    if (!analyserRef.current) return
    configureAnalyser(analyserRef.current, analysisParametersRef.current)
  }, [analysisParameters])

  useEffect(() => {
    visualEqParametersRef.current = normalizeVisualEqParameters(visualEqParameters)
    const context = contextRef.current
    if (!context || !visualEqNodesRef.current) return
    configureVisualEq(
      visualEqNodesRef.current,
      visualEqParametersRef.current,
      context.sampleRate,
    )
  }, [visualEqParameters])

  useEffect(() => {
    mutedRef.current = Boolean(muted)
    const context = contextRef.current
    const playbackGain = playbackGainRef.current
    if (!context || !playbackGain) return
    playbackGain.gain.setValueAtTime(muted ? 0 : 1, context.currentTime)
  }, [muted])

  useEffect(() => {
    loopRef.current = Boolean(loop)
    if (audioRef.current) audioRef.current.loop = Boolean(loop)
  }, [loop])

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.preload = 'auto'
    }
    const audio = audioRef.current

    const onLoadedMetadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
      setStatus('ready')
    }
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onPlay = () => {
      setIsPlaying(true)
      setStatus('playing')
    }
    const onPause = () => {
      setIsPlaying(false)
      if (!audio.ended && audio.src) setStatus('paused')
    }
    const onEnded = () => {
      setIsPlaying(false)
      setStatus('ended')
      setCurrentTime(audio.duration)
    }
    const onError = () => {
      setError('The browser could not decode this audio source.')
      setStatus('error')
    }

    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [])

  useEffect(
    () => () => {
      audioRef.current?.pause()
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
      contextRef.current?.close()
    },
    [],
  )

  const loadMediaSource = useCallback(
    async (url, nextSource) => {
      setError('')
      const audio = audioRef.current
      if (!audio) return false

      audio.pause()
      if (objectUrlRef.current && objectUrlRef.current !== url) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }

      audio.loop = loopRef.current
      audio.src = url
      audio.load()
      setCurrentTime(0)
      setDuration(0)
      setIsPlaying(false)
      setStatus('loading')

      try {
        connectMediaElement()
        setSource(nextSource)
        return true
      } catch (graphError) {
        setError(graphError.message)
        setStatus('error')
        return false
      }
    },
    [connectMediaElement],
  )

  const loadFile = useCallback(
    async (nextFile) => {
      setError('')
      if (!isSupportedAudioFile(nextFile)) {
        setError('Please choose a WAV or MP3 audio file.')
        setStatus('error')
        return false
      }

      const objectUrl = URL.createObjectURL(nextFile)
      const loaded = await loadMediaSource(objectUrl, {
        kind: 'file',
        title: nextFile.name,
        artist: `${(nextFile.size / 1024 / 1024).toFixed(1)} MB`,
        fileName: nextFile.name,
        size: nextFile.size,
      })
      if (loaded) objectUrlRef.current = objectUrl
      else URL.revokeObjectURL(objectUrl)
      return loaded
    },
    [loadMediaSource],
  )

  const loadDemo = useCallback(
    (demo) => loadMediaSource(demo.url, {
      kind: 'demo',
      demoId: demo.id,
      title: demo.title,
      artist: demo.artist,
      fileName: demo.fileName,
    }),
    [loadMediaSource],
  )

  const preparePlayback = useCallback(async ({ signal } = {}) => {
    if (!source || !audioRef.current) return false

    try {
      if (signal?.aborted) return false
      connectMediaElement()
      await contextRef.current?.resume()
      if (signal?.aborted) return false
      const audio = audioRef.current
      audio.pause()
      audio.currentTime = 0
      setCurrentTime(0)
      if (audio.error) throw new Error('The browser could not decode this audio source.')
      if (audio.readyState < 3) await waitForPlayableAudio(audio, signal)
      if (signal?.aborted) return false
      setStatus('paused')
      return true
    } catch (prepareError) {
      if (prepareError.name === 'AbortError') return false
      setError(prepareError.message || 'Audio could not be prepared for recording.')
      setStatus('error')
      return false
    }
  }, [connectMediaElement, source])

  const togglePlayback = useCallback(async () => {
    if (!source) return

    try {
      connectMediaElement()
      await contextRef.current?.resume()
      audioRef.current.loop = loopRef.current
      if (audioRef.current.paused) {
        await audioRef.current.play()
      } else {
        audioRef.current.pause()
      }
    } catch (playError) {
      setError(playError.message || 'Playback could not be started.')
      setStatus('error')
    }
  }, [connectMediaElement, source])

  const playFromStart = useCallback(async ({ useLoop = true } = {}) => {
    if (!source || !audioRef.current) return

    try {
      connectMediaElement()
      await contextRef.current?.resume()
      audioRef.current.loop = useLoop ? loopRef.current : false
      audioRef.current.currentTime = 0
      setCurrentTime(0)
      setIsPlaying(true)
      setStatus('playing')
      await audioRef.current.play()
    } catch (playError) {
      setIsPlaying(false)
      setError(playError.message || 'Playback could not be started.')
      setStatus('error')
      throw playError
    }
  }, [connectMediaElement, source])

  const restorePlaybackLoop = useCallback(() => {
    if (audioRef.current) audioRef.current.loop = loopRef.current
  }, [])

  const pausePlayback = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const seek = useCallback((timeSeconds) => {
    if (!audioRef.current || !Number.isFinite(timeSeconds)) return
    audioRef.current.currentTime = timeSeconds
    setCurrentTime(timeSeconds)
  }, [])

  const getCurrentTime = useCallback(() => audioRef.current?.currentTime ?? 0, [])
  const getRecordingStream = useCallback(
    () => recordingDestinationRef.current?.stream ?? null,
    [],
  )

  return {
    analyser,
    currentTime,
    duration,
    error,
    getCurrentTime,
    getRecordingStream,
    isPlaying,
    loadDemo,
    loadFile,
    pausePlayback,
    playFromStart,
    preparePlayback,
    restorePlaybackLoop,
    seek,
    source,
    status,
    togglePlayback,
  }
}

function waitForPlayableAudio(audio, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError())
      return
    }
    if (audio.error) {
      reject(new Error('The browser could not buffer this audio source.'))
      return
    }
    const cleanup = () => {
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('error', onError)
      signal?.removeEventListener('abort', onAbort)
    }
    const onCanPlay = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('The browser could not buffer this audio source.'))
    }
    const onAbort = () => {
      cleanup()
      reject(createAbortError())
    }
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('error', onError)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function createAbortError() {
  const error = new Error('The operation was cancelled.')
  error.name = 'AbortError'
  return error
}

function configureAnalyser(analyser, parameters) {
  analyser.fftSize = parameters.fftSize
  analyser.minDecibels = parameters.minDecibels
  analyser.maxDecibels = parameters.maxDecibels
  analyser.smoothingTimeConstant = parameters.smoothingTimeConstant
}

function configureVisualEq(nodes, parameters, sampleRate) {
  const nyquist = sampleRate / 2
  nodes.analysisGain.gain.value = decibelsToGain(parameters.inputGainDb)
  nodes.lowShelf.type = 'lowshelf'
  nodes.lowShelf.frequency.value = Math.min(nyquist, parameters.lowShelfFrequencyHz)
  nodes.lowShelf.gain.value = parameters.lowShelfGainDb
  nodes.highShelf.type = 'highshelf'
  nodes.highShelf.frequency.value = Math.min(nyquist, parameters.highShelfFrequencyHz)
  nodes.highShelf.gain.value = parameters.highShelfGainDb
}
