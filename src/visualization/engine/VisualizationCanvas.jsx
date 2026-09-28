import { forwardRef, useEffect, useRef } from 'react'
import { createAnalysisFrameSampler } from '../../audio/analysis/analysisFrame.js'
import { DEFAULT_ANALYSIS_PARAMETERS } from '../../audio/analysis/analysisParameters.js'
import { DEFAULT_OUTPUT_PARAMETERS } from '../../output/outputParameters.js'
import { getRendererDefinition } from '../registry/rendererRegistry.js'
import { clearSurface } from './surface.js'

const IDLE_DECAY_FPS = 12
const IDLE_DECAY_DURATION_MS = 30_000

export const VisualizationCanvas = forwardRef(function VisualizationCanvas(
  {
    analyser,
    rendererId,
    analysisParameters = DEFAULT_ANALYSIS_PARAMETERS,
    rendererParameters,
    outputParameters = DEFAULT_OUTPUT_PARAMETERS,
    exportCanvasRef,
    captureActive = false,
    isPlaying = false,
    onCaptureFrame,
    reviewVisible = false,
  },
  forwardedRef,
) {
  const localRef = useRef(null)
  const activityRef = useRef({ isPlaying, reviewVisible })
  const rendererParametersRef = useRef(rendererParameters)
  const wakeRendererRef = useRef(null)

  useEffect(() => {
    if (typeof forwardedRef === 'function') forwardedRef(localRef.current)
    else if (forwardedRef) forwardedRef.current = localRef.current
  }, [forwardedRef])

  useEffect(() => {
    const canvas = localRef.current
    const context = canvas.getContext('2d')
    const exportCanvas = exportCanvasRef?.current ?? null
    const exportContext = exportCanvas?.getContext('2d') ?? null
    const renderer = getRendererDefinition(rendererId).create()
    let animationFrame = 0
    let idleTimer = 0
    let frameScheduled = false
    let stopped = false
    let idleDeadlineMs = performance.now() + IDLE_DECAY_DURATION_MS
    let previewWidth = 1
    let previewHeight = 1
    let previewScale = window.devicePixelRatio || 1
    let nextCaptureFrameMs = null

    const resize = (dimensions = canvas.getBoundingClientRect()) => {
      previewWidth = Math.max(1, dimensions.width)
      previewHeight = Math.max(1, dimensions.height)
      previewScale = window.devicePixelRatio || 1
      canvas.width = Math.max(1, Math.floor(previewWidth * previewScale))
      canvas.height = Math.max(1, Math.floor(previewHeight * previewScale))
      context.setTransform(previewScale, 0, 0, previewScale, 0, 0)
      if (!analyser) {
        clearSurface(context, previewWidth, previewHeight)
      }
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      resize(entry?.contentRect)
      wakeRendererRef.current?.()
    })
    resizeObserver.observe(canvas)
    resize()

    if (!analyser) {
      return () => {
        renderer.reset()
        resizeObserver.disconnect()
      }
    }

    const sampler = createAnalysisFrameSampler(analyser, analysisParameters)
    const captureFrameIntervalMs = 1000 / Math.max(1, outputParameters.fps)

    const drawPreview = (frame) => {
      context.setTransform(previewScale, 0, 0, previewScale, 0, 0)
      drawSurface({
        context,
        renderer,
        frame,
        width: previewWidth,
        height: previewHeight,
        rendererParameters: rendererParametersRef.current,
      })
    }

    const drawCaptureFrame = (frame) => {
      if (!exportCanvas || !exportContext) {
        drawPreview(frame)
        return
      }

      exportContext.setTransform(1, 0, 0, 1, 0, 0)
      drawSurface({
        context: exportContext,
        renderer,
        frame,
        width: exportCanvas.width,
        height: exportCanvas.height,
        rendererParameters: rendererParametersRef.current,
      })

      context.setTransform(previewScale, 0, 0, previewScale, 0, 0)
      context.clearRect(0, 0, previewWidth, previewHeight)
      drawContainedCanvas(context, exportCanvas, previewWidth, previewHeight)
      onCaptureFrame?.()
    }

    const scheduleFrame = () => {
      if (stopped || frameScheduled) return
      const activity = activityRef.current
      if (!captureActive && activity.reviewVisible) return

      const active = captureActive || activity.isPlaying
      if (!active && performance.now() >= idleDeadlineMs) return

      frameScheduled = true
      if (active) {
        animationFrame = requestAnimationFrame(draw)
      } else {
        idleTimer = window.setTimeout(() => {
          idleTimer = 0
          animationFrame = requestAnimationFrame(draw)
        }, 1000 / IDLE_DECAY_FPS)
      }
    }

    const wakeRenderer = () => {
      const activity = activityRef.current
      if (!captureActive && !activity.isPlaying && !activity.reviewVisible) {
        idleDeadlineMs = performance.now() + IDLE_DECAY_DURATION_MS
      }
      scheduleFrame()
    }
    wakeRendererRef.current = wakeRenderer

    const draw = (timestampMs) => {
      frameScheduled = false
      animationFrame = 0
      if (!captureActive && activityRef.current.reviewVisible) return

      if (captureActive) {
        if (nextCaptureFrameMs === null) nextCaptureFrameMs = timestampMs
        if (timestampMs + 0.5 >= nextCaptureFrameMs) {
          const frame = sampler.sample(timestampMs, analysisParameters)
          drawCaptureFrame(frame)
          do {
            nextCaptureFrameMs += captureFrameIntervalMs
          } while (nextCaptureFrameMs <= timestampMs + 0.5)
        }
      } else {
        const frame = sampler.sample(timestampMs, analysisParameters)
        drawPreview(frame)
      }

      scheduleFrame()
    }

    scheduleFrame()
    return () => {
      stopped = true
      cancelAnimationFrame(animationFrame)
      window.clearTimeout(idleTimer)
      if (wakeRendererRef.current === wakeRenderer) wakeRendererRef.current = null
      renderer.reset()
      resizeObserver.disconnect()
    }
  }, [
    analyser,
    analysisParameters,
    captureActive,
    exportCanvasRef,
    outputParameters,
    onCaptureFrame,
    rendererId,
  ])

  useEffect(() => {
    activityRef.current = { isPlaying, reviewVisible }
    wakeRendererRef.current?.()
  }, [isPlaying, reviewVisible])

  useEffect(() => {
    rendererParametersRef.current = rendererParameters
    wakeRendererRef.current?.()
  }, [rendererParameters])

  return (
    <canvas
      ref={localRef}
      className="spectrum-canvas"
      aria-label={`Live ${rendererId} audio visualization`}
    />
  )
})

function drawSurface({
  context,
  renderer,
  frame,
  width,
  height,
  rendererParameters,
}) {
  clearSurface(context, width, height)
  renderer.render({
    context,
    frame,
    viewport: { width, height },
    parameters: rendererParameters,
  })
}

function drawContainedCanvas(context, sourceCanvas, width, height) {
  const scale = Math.min(width / sourceCanvas.width, height / sourceCanvas.height)
  const renderedWidth = sourceCanvas.width * scale
  const renderedHeight = sourceCanvas.height * scale
  const x = (width - renderedWidth) / 2
  const y = (height - renderedHeight) / 2
  context.drawImage(sourceCanvas, x, y, renderedWidth, renderedHeight)
}
