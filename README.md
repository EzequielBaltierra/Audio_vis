# AUDIO_VIS

A client-side audio visualizer for local WAV and MP3 files or live microphone
input. It uses the Web Audio API for analysis, renders to canvas, and can record
file/demo visualizations with audio as WebM or MP4 when the browser supports the
selected format. Local files remain on the device, and microphone input is never
routed back to the speakers.

## Current features

- Local audio files, bundled demo tracks, and unmonitored microphone input
- Configurable bar and sine-wave visualizations, FFT analysis, and visual EQ
- Playback, seeking, looping, and mute controls
- Configurable recording resolution, frame rate, and output format
- In-browser recording review and download

Recording support varies by browser and operating system. The app only offers
codec and container combinations reported by the browser's `MediaRecorder`
implementation.

## Panel layout

Drag the narrow dotted divider between the controls and preview to resize the
controls panel. The Pathfinder background keeps the existing pattern, removes
clipped cells, and grows into only the newly exposed space.
Focus the divider and use Left/Right arrows for keyboard adjustment;
Home/End select the minimum/maximum width. Double-click to reset to 320 pixels.
The chosen width lasts until the page reloads. The narrow ASCII scrollbar inside
the controls panel still scrolls vertically. At window widths of 700 pixels or
less, controls stack above the preview. EQ tracks adapt to the window height,
and playback controls wrap to fit the available preview width.

## Sine-wave renderer

Select **SINE WAVE** after opening audio. Each frequency bucket draws a wave
across the whole canvas, with both ends at the centerline by default. Selecting
SINE WAVE starts with 6 broad logarithmic buckets (BAR starts with 72). Each wave
combines the FFT frequencies above the dB floor inside its bucket, weighted by
their linear amplitudes. Their interference varies the spacing and height across
the curve as the spectrum changes. The aggregate bucket decibel level controls
overall height; mixture weights are normalized to keep the curve bounded.
Silence becomes a flat line. TIME SPAN stretches or compresses the cycles.
AMPLITUDE OPACITY can fade each wave from transparent to opaque using its own
frequency bucket level within the configured decibel range.

FIXED POSITION starts enabled and keeps every wave centered. Turn it off to
reveal numbered handles from low to high frequency, then drag a handle vertically
to move its wave. SHOW POSITION HANDLES can hide the handles without resetting
the arrangement. MEET AT CENTER brings every offset wave to the canvas center at
the left and right edges. CENTER SLOPE controls how quickly the waves transition
between those edges and their assigned positions using a smooth nonlinear curve.
Slope values extend down to 0.25 for gentler transitions. LINE WIDTH ranges from
0.2 px for fine waves to 10 px for heavy strokes.
POSITION LAYOUT can place bands evenly from -75% to +75%, assign frequencies to
those slots in a stable shuffled order, or combine neighboring frequencies into
a chosen number of shared positions. TOP/BOTTOM PADDING changes how far the
outer automatic positions sit from the canvas edges. Arrow keys move a focused handle by 5%, Page Up/Down by 25%,
and Home centers it. Positions remain attached to bucket numbers when analysis
settings change. Color and line width are adjustable. These are shapes driven
by spectrum levels, rather than recovered audio waveforms. Preview and recording
use the same renderer. The BANDS control appears inside the active renderer
section while continuing to set the frequency groups produced by analysis.

## Frequency guides and visual response

The BAR renderer's FREQUENCY RULER starts off. Its toggle adds logarithmic
frequency markers to the top of the live preview. It is an interface guide and is not burned into a
recorded video. VISUAL ATTACK controls how quickly bars and waves rise toward a
louder level; VISUAL RELEASE controls how slowly they fall after energy drops.
Both controls change visualization response only, without changing playback or
recorded audio. They appear inside the active renderer section; for SINE WAVE,
they sit between TIME SPAN and AMPLITUDE OPACITY.

BAR and SINE WAVE share a separate COLOR section. Its COLOR MODE menu switches
between SOLID COLOR and FREQUENCY GRADIENT. SOLID COLOR includes eight presets and a ninth
blank custom slot. The custom slot opens hue, saturation, and lightness controls
with a live preview and hex value. Changing any channel updates the visualization
immediately; choosing a preset closes the custom menu.

When FREQUENCY PALETTE is USER DEFINED, LOW, MIDDLE, and HIGH appear
side by side. Each bucket accepts a hex value and has a color swatch that opens
the same hue, saturation, and lightness picker. Colors between the three points
are blended across the bars or sine-wave frequency buckets. When COLOR is
collapsed, its header shows the solid color or the two gradient endpoint colors.

`src/visualization/renderers/sine/sineRenderer.js` owns canvas drawing;
`sineParameters.js` defines its defaults and controls. The renderer registry
connects both to the existing selector, controls, and recording pipeline.

## Development

Requires Node.js `^20.19.0` or `>=22.12.0` with npm.

```bash
npm install
npm run dev
```

Run all checks and create a production build:

```bash
npm run check
```

Preview the production build with `npm run preview`. The generated `dist/`
directory can be deployed as a static site at a domain root or subpath.

## Documentation

- [Third-party notices](docs/third-party-notices.md)
