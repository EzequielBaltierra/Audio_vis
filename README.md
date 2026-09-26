# AUDIO_VIS

A client-side audio visualizer for local WAV and MP3 files. It uses the Web
Audio API for analysis, renders to canvas, and can record the visualization
with audio as WebM or MP4 when the browser supports the selected format. Local
files remain on the device.

## Current features

- Local audio files and bundled demo tracks
- Configurable bar visualization, FFT analysis, and visual EQ
- Playback, seeking, looping, and mute controls
- Configurable recording resolution, frame rate, and output format
- In-browser recording review and download

Recording support varies by browser and operating system. The app only offers
codec and container combinations reported by the browser's `MediaRecorder`
implementation.

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

- [Architecture](docs/architecture.md)
- [Interface style guide](docs/style-guide.md)
- [Third-party notices](docs/third-party-notices.md)
