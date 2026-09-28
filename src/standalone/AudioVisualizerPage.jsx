import { useCallback, useMemo, useRef, useState } from 'react'
import { AsciiDivider, AsciiRailDivider } from '../ascii/AsciiDivider.jsx'
import { AsciiSelect } from '../ascii/AsciiSelect.jsx'
import { RailScroller } from '../ascii/RailScroller.jsx'
import {
  ANALYSIS_PARAMETER_DEFINITIONS,
  BAND_COUNT_PARAMETER_DEFINITION,
  DEFAULT_ANALYSIS_PARAMETERS,
} from '../audio/analysis/analysisParameters.js'
import {
  DEFAULT_VISUAL_EQ_PARAMETERS,
  VISUAL_EQ_PARAMETER_DEFINITIONS,
} from '../audio/analysis/visualEqParameters.js'
import { useAudioEngine } from '../audio/engine/useAudioEngine.js'
import { DEMO_TRACKS } from '../audio/sources/demoTracks.js'
import {
  DEFAULT_OUTPUT_PARAMETERS,
  OUTPUT_PARAMETER_DEFINITIONS,
} from '../output/outputParameters.js'
import { useCaptureWorkflow } from '../output/useCaptureWorkflow.js'
import { AudioSourceControls } from '../ui/components/AudioSourceControls.jsx'
import { CollapsibleParameterGroup } from '../ui/components/CollapsibleParameterGroup.jsx'
import { ColorSectionSummary } from '../ui/components/ColorSectionSummary.jsx'
import { FrequencyGradientControls } from '../ui/components/FrequencyGradientControls.jsx'
import { FrequencyRuler } from '../ui/components/FrequencyRuler.jsx'
import { ParameterControls } from '../ui/components/ParameterControls.jsx'
import { SineWaveHandles } from '../ui/components/SineWaveHandles.jsx'
import { TransportControls } from '../ui/components/TransportControls.jsx'
import { VisualEqControls } from '../ui/components/VisualEqControls.jsx'
import { PathfinderBackground } from '../ui/layout/PathfinderBackground.jsx'
import { PanelDivider } from '../ui/layout/PanelDivider.jsx'
import { VisualizationCanvas } from '../visualization/engine/VisualizationCanvas.jsx'
import {
  getRendererDefinition,
  listAvailableRenderers,
} from '../visualization/registry/rendererRegistry.js'
import './AudioVisualizerPage.css'

const RENDERER_OPTIONS = listAvailableRenderers().map(({ id, label }) => ({
  value: id,
  label,
}))
const VISUAL_RESPONSE_PARAMETER_IDS = new Set(['attackMs', 'releaseMs'])
const VISUAL_RESPONSE_PARAMETER_DEFINITIONS = ANALYSIS_PARAMETER_DEFINITIONS.filter(
  ({ id }) => VISUAL_RESPONSE_PARAMETER_IDS.has(id),
)
const TECHNICAL_ANALYSIS_PARAMETER_DEFINITIONS = ANALYSIS_PARAMETER_DEFINITIONS.filter(
  ({ id }) => !VISUAL_RESPONSE_PARAMETER_IDS.has(id),
)
const BAND_COUNT_PARAMETER_DEFINITIONS = [BAND_COUNT_PARAMETER_DEFINITION]

export function AudioVisualizerPage() {
  const [panelWidth, setPanelWidth] = useState(320)
  const [rendererId, setRendererId] = useState('')
  const [analysisParameters, setAnalysisParameters] = useState(DEFAULT_ANALYSIS_PARAMETERS)
  const [visualEqParameters, setVisualEqParameters] = useState(DEFAULT_VISUAL_EQ_PARAMETERS)
  const [rendererParameters, setRendererParameters] = useState({})
  const [highlightedSineBand, setHighlightedSineBand] = useState(null)
  const [outputParameters, setOutputParameters] = useState(DEFAULT_OUTPUT_PARAMETERS)
  const [audioMuted, setAudioMuted] = useState(false)
  const [loopPlayback, setLoopPlayback] = useState(false)
  const audio = useAudioEngine({
    analysisParameters,
    visualEqParameters,
    muted: audioMuted,
    loop: loopPlayback,
  })
  const exportCanvasRef = useRef(null)
  const capture = useCaptureWorkflow({ audio, rendererId, outputParameters, exportCanvasRef })
  const {
    cancelReview,
    captureActive,
    captureError,
    capturePhase,
    downloadReview,
    handleCaptureFrame,
    resetForSource: resetCaptureForSource,
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
  } = capture
  const railScrollerRef = useRef(null)
  const [railScrollMetrics, setRailScrollMetrics] = useState({
    overflow: false,
    visibleRatio: 1,
    value: 0,
  })
  const [draggingFile, setDraggingFile] = useState(false)
  const { loadDemo, loadFile, loadMicrophone, source } = audio

  const resetForSource = useCallback(() => {
    setRendererId('')
    setRendererParameters({})
    setHighlightedSineBand(null)
    railScrollerRef.current?.scrollToRatio(0)
  }, [])

  const handleFile = useCallback(
    async (file) => {
      resetCaptureForSource()
      if (await loadFile(file)) resetForSource()
    },
    [loadFile, resetCaptureForSource, resetForSource],
  )

  const handleDemo = useCallback(
    async (demo) => {
      resetCaptureForSource()
      if (await loadDemo(demo)) resetForSource()
    },
    [loadDemo, resetCaptureForSource, resetForSource],
  )

  const handleMicrophone = useCallback(async () => {
    resetCaptureForSource()
    if (await loadMicrophone()) resetForSource()
  }, [loadMicrophone, resetCaptureForSource, resetForSource])

  const selectRenderer = (nextRendererId) => {
    const definition = getRendererDefinition(nextRendererId)
    setRendererId(nextRendererId)
    setRendererParameters({ ...definition.defaultParameters })
    setHighlightedSineBand(null)
    setAnalysisParameters((current) => ({
      ...current,
      bandCount: nextRendererId === 'sine' ? 6 : DEFAULT_ANALYSIS_PARAMETERS.bandCount,
    }))
  }

  const handleGlobalDrop = (event) => {
    event.preventDefault()
    setDraggingFile(false)
    const [file] = event.dataTransfer.files
    if (file) handleFile(file)
  }

  const rendererDefinition = rendererId ? getRendererDefinition(rendererId) : null
  const rendererParameterDefinitions = rendererDefinition?.parameterDefinitions ?? []
  const timeSpanIndex = rendererParameterDefinitions.findIndex(({ id }) => id === 'timeSpanMs')
  const rendererParametersBeforeResponse = timeSpanIndex >= 0
    ? rendererParameterDefinitions.slice(0, timeSpanIndex + 1)
    : []
  const rendererParametersAfterResponse = timeSpanIndex >= 0
    ? rendererParameterDefinitions.slice(timeSpanIndex + 1)
    : rendererParameterDefinitions
  const hasSource = Boolean(source)
  const microphoneActive = source?.kind === 'microphone'
  const sampleRate = audio.analyser?.context.sampleRate ?? 48_000
  const visibleMaximumFrequency = Math.min(
    analysisParameters.maxFrequencyHz,
    sampleRate / 2,
  )
  const canvasRendererParameters = useMemo(() => (
    rendererId === 'sine'
      ? { ...rendererParameters, highlightedBandIndex: highlightedSineBand }
      : rendererParameters
  ), [highlightedSineBand, rendererId, rendererParameters])

  const updateSineOffset = (bandIndex, offset) => {
    setRendererParameters((current) => ({
      ...current,
      bandOffsets: { ...current.bandOffsets, [bandIndex]: offset },
    }))
  }

  const activeTransport = reviewUrl
    ? {
        currentTime: reviewCurrentTime,
        disabled: false,
        duration: reviewDuration,
        isPlaying: reviewPlaying,
        loop: loopPlayback,
        loopDisabled: false,
        muted: audioMuted,
        onPlayPause: toggleReviewPlayback,
        onSeek: seekReview,
        onToggleLoop: () => setLoopPlayback((current) => !current),
        onToggleMute: () => setAudioMuted((current) => !current),
      }
    : {
        currentTime: audio.currentTime,
        disabled: !source || microphoneActive || audio.status === 'loading' || captureActive,
        duration: audio.duration,
        isPlaying: audio.isPlaying,
        loop: loopPlayback,
        loopDisabled: captureActive || microphoneActive,
        muted: audioMuted,
        muteDisabled: microphoneActive,
        onPlayPause: audio.togglePlayback,
        onSeek: audio.seek,
        onToggleLoop: () => setLoopPlayback((current) => !current),
        onToggleMute: () => setAudioMuted((current) => !current),
      }

  return (
    <main
      className={`app-shell ${draggingFile ? 'is-dragging-file' : ''}`}
      style={{ '--panel-width': `${panelWidth}px` }}
      onDragEnter={(event) => {
        event.preventDefault()
        if (event.dataTransfer.types.includes('Files')) setDraggingFile(true)
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setDraggingFile(false)
      }}
      onDrop={handleGlobalDrop}
    >
      <aside id="audio-controls" className="control-rail" aria-label="Audio controls">
        <PathfinderBackground />
        <header className="rail-header">
          <h1 className="wordmark">
            AUDIO_VIS
          </h1>
        </header>

        <RailScroller ref={railScrollerRef} onMetricsChange={setRailScrollMetrics}>
          <div>
            <section className="rail-section" aria-label="Audio source">
              <AudioSourceControls
                source={source}
                demos={DEMO_TRACKS}
                status={audio.status}
                error={audio.error}
                dragging={draggingFile}
              disabled={captureActive}
                onFile={handleFile}
                onDemo={handleDemo}
                onMicrophone={handleMicrophone}
              />
            </section>

            {hasSource ? <AsciiDivider /> : null}

            {hasSource ? (
              <section className="rail-section renderer-selection" aria-label="Renderer selection">
                <AsciiSelect
                  label="RENDERER"
                  value={rendererId}
                  options={RENDERER_OPTIONS}
                  placeholder="SELECT RENDERER"
                  showDisclosure
                  disabled={captureActive}
                  onChange={selectRenderer}
                />
              </section>
            ) : null}

            {rendererDefinition?.colorParameterDefinitions ? (
              <>
                <AsciiDivider />
                <CollapsibleParameterGroup
                  key={`color-${rendererId}`}
                  label="COLOR"
                  ariaLabel="Visualization color parameters"
                  collapsedSummary={<ColorSectionSummary parameters={rendererParameters} />}
                >
                  <ParameterControls
                    definitions={rendererDefinition.colorParameterDefinitions}
                    values={rendererParameters}
                    disabled={captureActive}
                    onChange={(id, value) => updateParameter(setRendererParameters, id, value)}
                  />
                  {rendererParameters.colorMode === 'frequency' &&
                  rendererParameters.frequencyColorPalette === 'custom' ? (
                    <FrequencyGradientControls
                      values={rendererParameters}
                      disabled={captureActive}
                      onChange={(id, value) => updateParameter(setRendererParameters, id, value)}
                    />
                  ) : null}
                </CollapsibleParameterGroup>
              </>
            ) : null}

            {rendererDefinition ? (
              <>
                <AsciiDivider />
                <CollapsibleParameterGroup
                  key={`renderer-${rendererId}`}
                  label={`${rendererDefinition.label} RENDERER`}
                  ariaLabel={`${rendererDefinition.label} renderer parameters`}
                >
                  <ParameterControls
                    definitions={BAND_COUNT_PARAMETER_DEFINITIONS}
                    values={analysisParameters}
                    disabled={captureActive}
                    onChange={(id, value) => updateParameter(setAnalysisParameters, id, value)}
                  />
                  <ParameterControls
                    definitions={rendererParametersBeforeResponse}
                    values={rendererParameters}
                    disabled={captureActive}
                    onChange={(id, value) => updateParameter(setRendererParameters, id, value)}
                  />
                  <ParameterControls
                    definitions={VISUAL_RESPONSE_PARAMETER_DEFINITIONS}
                    values={analysisParameters}
                    disabled={captureActive}
                    onChange={(id, value) => updateParameter(setAnalysisParameters, id, value)}
                  />
                  <ParameterControls
                    definitions={rendererParametersAfterResponse}
                    values={rendererParameters}
                    disabled={captureActive}
                    onChange={(id, value) => updateParameter(setRendererParameters, id, value)}
                  />
                </CollapsibleParameterGroup>
              </>
            ) : null}

            {rendererDefinition ? (
              <>
                <AsciiDivider />
                <CollapsibleParameterGroup
                  key={`visual-eq-${rendererId}`}
                  label="VISUAL EQ"
                  ariaLabel="Visual EQ parameters"
                  defaultOpen={false}
                >
                  <VisualEqControls
                    definitions={VISUAL_EQ_PARAMETER_DEFINITIONS}
                    values={visualEqParameters}
                    disabled={captureActive}
                    onChange={(id, value) => updateParameter(setVisualEqParameters, id, value)}
                  />
                </CollapsibleParameterGroup>
              </>
            ) : null}

            {rendererDefinition ? (
              <>
                <AsciiDivider />
                <CollapsibleParameterGroup
                  key={`analysis-${rendererId}`}
                  label="ANALYSIS"
                  ariaLabel="Audio analysis parameters"
                  defaultOpen={false}
                >
                  <ParameterControls
                    definitions={TECHNICAL_ANALYSIS_PARAMETER_DEFINITIONS}
                    values={analysisParameters}
                    disabled={captureActive}
                    onChange={(id, value) => updateParameter(setAnalysisParameters, id, value)}
                  />
                </CollapsibleParameterGroup>
              </>
            ) : null}

            {rendererDefinition ? (
              <>
                <AsciiDivider />
                <CollapsibleParameterGroup
                  key={`output-${rendererId}`}
                  label="OUTPUT"
                  ariaLabel="Output parameters"
                  defaultOpen={false}
                >
                  <ParameterControls
                    definitions={OUTPUT_PARAMETER_DEFINITIONS}
                    values={outputParameters}
                    disabled={captureActive}
                    onChange={(id, value) => updateParameter(setOutputParameters, id, value)}
                  />
                </CollapsibleParameterGroup>
              </>
            ) : null}
          </div>
        </RailScroller>
        <AsciiRailDivider
          scrollMetrics={railScrollMetrics}
          onScrollRatio={(ratio) => railScrollerRef.current?.scrollToRatio(ratio)}
          onScrollKey={(key) => railScrollerRef.current?.handleKey(key)}
        />
      </aside>

      <PanelDivider width={panelWidth} onChange={setPanelWidth} />

      <section className="visualizer-stage" aria-label="Audio visualization">
        {hasSource ? (
          <>
            <div className="stage-surface">
              {rendererDefinition ? (
                <VisualizationCanvas
                  exportCanvasRef={exportCanvasRef}
                  analyser={audio.analyser}
                  captureActive={captureActive}
                  isPlaying={audio.isPlaying}
                  onCaptureFrame={handleCaptureFrame}
                  rendererId={rendererId}
                  analysisParameters={analysisParameters}
                  rendererParameters={canvasRendererParameters}
                  outputParameters={outputParameters}
                  reviewVisible={Boolean(reviewUrl)}
                />
              ) : null}
              {rendererId === 'bar' && rendererParameters.showFrequencyRuler && !reviewUrl ? (
                <FrequencyRuler
                  minimumHz={analysisParameters.minFrequencyHz}
                  maximumHz={visibleMaximumFrequency}
                />
              ) : null}
              {rendererId === 'sine' &&
              !rendererParameters.fixedPosition &&
              rendererParameters.positionLayout === 'manual' &&
              rendererParameters.showPositionHandles &&
              !reviewUrl ? (
                <SineWaveHandles
                  analysisParameters={analysisParameters}
                  sampleRate={sampleRate}
                  offsets={rendererParameters.bandOffsets}
                  disabled={captureActive}
                  onOffsetChange={updateSineOffset}
                  onHighlightChange={setHighlightedSineBand}
                />
              ) : null}
              {reviewUrl ? (
                <video
                  ref={reviewVideoRef}
                  className="review-video"
                  src={reviewUrl}
                  muted={audioMuted}
                  loop={loopPlayback}
                  playsInline
                  onDurationChange={(event) => setReviewDuration(event.currentTarget.duration || 0)}
                  onTimeUpdate={(event) => setReviewCurrentTime(event.currentTarget.currentTime)}
                  onPlay={() => setReviewPlaying(true)}
                  onPause={() => setReviewPlaying(false)}
                  onEnded={() => setReviewPlaying(false)}
                />
              ) : null}
            </div>

            <div className="stage-controls">
              <TransportControls {...activeTransport} />
              <div className="export-actions">
                {reviewUrl ? (
                  <>
                    <button type="button" onClick={cancelReview}>[ CANCEL OUTPUT ]</button>
                    <button type="button" onClick={downloadReview}>[ DOWNLOAD ]</button>
                    <button type="button" onClick={startCapture}>[ RECORD AGAIN ]</button>
                  </>
                ) : (
                  <button
                    className={captureActive ? 'is-active' : ''}
                    type="button"
                    disabled={!source || !rendererDefinition || microphoneActive}
                    onClick={() => {
                      if (captureActive) {
                        stopCapture({ discard: capturePhase === 'preparing' })
                      }
                      else startCapture()
                    }}
                  >
                    {capturePhase === 'preparing'
                      ? '[ CANCEL RECORDING ]'
                      : captureActive ? '[ STOP + REVIEW ]' : '[ RECORD ]'}
                  </button>
                )}
              </div>
              {captureError ? <p className="operation-error" role="alert">{captureError}</p> : null}
            </div>
          </>
        ) : null}
      </section>

      <canvas
        ref={exportCanvasRef}
        className="export-canvas"
        width={outputParameters.width}
        height={outputParameters.height}
        aria-hidden="true"
      />
    </main>
  )
}

function updateParameter(setter, id, value) {
  setter((current) => ({ ...current, [id]: value }))
}
