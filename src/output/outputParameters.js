export const OUTPUT_FORMATS = Object.freeze({
  webm: Object.freeze({
    id: 'webm',
    extension: 'webm',
    label: 'WEBM / VP9 OR VP8 + OPUS',
    mimeTypes: [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ],
    affects: 'Exports an opaque WebM video with its audio included.',
  }),
  mp4: Object.freeze({
    id: 'mp4',
    extension: 'mp4',
    label: 'MP4 / H.264 + AAC',
    mimeTypes: [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4',
    ],
    affects: 'Exports an opaque MP4 video with its audio included when supported by this browser.',
  }),
})

export const OUTPUT_FORMAT_OPTIONS = Object.freeze(
  Object.values(OUTPUT_FORMATS).map(({ id, label }) => ({ value: id, label })),
)

export const DEFAULT_OUTPUT_PARAMETERS = Object.freeze({
  format: OUTPUT_FORMATS.webm.id,
  fps: 60,
  width: 1920,
  height: 1080,
})

export const OUTPUT_PARAMETER_DEFINITIONS = Object.freeze([
  {
    id: 'format',
    label: 'FORMAT',
    type: 'enum',
    values: OUTPUT_FORMAT_OPTIONS.map(({ value }) => value),
    labels: Object.fromEntries(OUTPUT_FORMAT_OPTIONS.map(({ value, label }) => [value, label])),
    affects: 'Choose WebM or MP4. Recording is available only when this browser supports the selected format.',
  },
  {
    id: 'fps',
    label: 'FPS',
    type: 'number',
    minimum: 1,
    maximum: 60,
    step: 1,
    presets: [1, 12, 15, 24, 25, 30, 48, 50, 60],
    affects:
      'Sets how many visual frames are recorded each second. Higher values look smoother but require more rendering and encoding work.',
  },
  {
    id: 'width',
    label: 'WIDTH',
    type: 'number',
    minimum: 320,
    maximum: 7680,
    step: 16,
    presets: [320, 640, 854, 1280, 1920, 2560, 3840, 7680],
    unit: 'px',
    affects:
      'Sets the exported video horizontal pixel count. Higher values create a sharper, wider frame and increase recording workload.',
  },
  {
    id: 'height',
    label: 'HEIGHT',
    type: 'number',
    minimum: 180,
    maximum: 4320,
    step: 16,
    presets: [180, 360, 480, 720, 1080, 1440, 2160, 4320],
    unit: 'px',
    affects:
      'Sets the exported video vertical pixel count. Higher values create a sharper, taller frame and increase recording workload.',
  },
])

export function findSupportedOutputMimeType(
  MediaRecorderClass = globalThis.MediaRecorder,
  formatId = DEFAULT_OUTPUT_PARAMETERS.format,
) {
  if (!MediaRecorderClass?.isTypeSupported) return null
  const format = OUTPUT_FORMATS[formatId]
  if (!format) return null
  return format.mimeTypes.find((type) => MediaRecorderClass.isTypeSupported(type)) ?? null
}
