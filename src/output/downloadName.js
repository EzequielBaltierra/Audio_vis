// eslint-disable-next-line no-control-regex -- Download names must reject ASCII control characters.
const UNSAFE_FILE_NAME_CHARACTERS = /[\u0000-\u001f\u007f<>:"/\\|?*]+/g
const EDGE_PUNCTUATION = /^[.\s-]+|[.\s-]+$/g

export function buildDownloadName(fileName, rendererId, extension) {
  const baseName = String(fileName ?? '').replace(/\.(wav|mp3)$/i, '')
  const safeBaseName = sanitizeFileNamePart(baseName, 'audio')
  const safeRendererId = sanitizeFileNamePart(rendererId, 'visualization')
  const safeExtension = /^[a-z0-9]+$/i.test(extension) ? extension.toLowerCase() : 'webm'

  return `${safeBaseName}-${safeRendererId}.${safeExtension}`
}

export function sanitizeFileNamePart(value, fallback) {
  const sanitized = String(value ?? '')
    .normalize('NFKC')
    .replace(UNSAFE_FILE_NAME_CHARACTERS, '-')
    .replace(/\s+/g, ' ')
    .replace(EDGE_PUNCTUATION, '')
    .slice(0, 80)

  return sanitized || fallback
}
