export function nextParameterValue(value, definition, direction) {
  const presets = definition.presets
    ?.map(Number)
    .filter(Number.isFinite)
    .sort((left, right) => left - right)

  if (presets?.length) {
    const numericValue = Number(value)
    const exactIndex = presets.indexOf(numericValue)
    if (exactIndex >= 0) {
      const nextIndex = Math.min(
        presets.length - 1,
        Math.max(0, exactIndex + direction),
      )
      return presets[nextIndex]
    }

    if (direction > 0) {
      return presets.find((preset) => preset > numericValue) ?? presets.at(-1)
    }
    return presets.findLast((preset) => preset < numericValue) ?? presets[0]
  }

  const stepped = Number(value) + definition.step * direction
  const clamped = Math.min(definition.maximum, Math.max(definition.minimum, stepped))
  return Number(clamped.toFixed(6))
}

export function clampParameterValue(value, definition) {
  if (value === null || value === undefined || String(value).trim() === '') return null
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return null
  return Math.min(definition.maximum, Math.max(definition.minimum, numericValue))
}
