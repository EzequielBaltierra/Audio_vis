const DEFAULT_LAYOUT_PADDING_PERCENT = 12.5

export function buildSineBandOffsets(settings, bandCount) {
  if (settings.fixedPosition) return Array(bandCount).fill(0)

  if (settings.positionLayout === 'distributed') {
    return Array.from({ length: bandCount }, (_, bandIndex) => (
      offsetForSlot(bandIndex, bandCount, settings.layoutPaddingPercent)
    ))
  }

  if (settings.positionLayout === 'shuffled') {
    const shuffledSlots = buildShuffledSlots(bandCount)
    return shuffledSlots.map((slotIndex) => (
      offsetForSlot(slotIndex, bandCount, settings.layoutPaddingPercent)
    ))
  }

  if (settings.positionLayout === 'groups') {
    const requestedGroupCount = Number.isFinite(settings.positionGroupCount)
      ? Math.round(settings.positionGroupCount)
      : 1
    const groupCount = Math.min(bandCount, Math.max(1, requestedGroupCount))
    return Array.from({ length: bandCount }, (_, bandIndex) => {
      const groupIndex = Math.floor(bandIndex * groupCount / bandCount)
      return offsetForSlot(groupIndex, groupCount, settings.layoutPaddingPercent)
    })
  }

  return Array.from({ length: bandCount }, (_, bandIndex) => (
    settings.bandOffsets?.[bandIndex] ?? 0
  ))
}

function offsetForSlot(
  slotIndex,
  slotCount,
  paddingPercent = DEFAULT_LAYOUT_PADDING_PERCENT,
) {
  if (slotCount <= 1) return 0
  const safePadding = Math.min(50, Math.max(0, paddingPercent))
  const maximumOffset = 100 - safePadding * 2
  const progress = slotIndex / (slotCount - 1)
  return -maximumOffset + progress * maximumOffset * 2
}

function buildShuffledSlots(bandCount) {
  const slots = Array.from({ length: bandCount }, (_, index) => index)
  let randomState = (bandCount * 2_654_435_761) >>> 0

  for (let index = bandCount - 1; index > 0; index -= 1) {
    randomState = (Math.imul(randomState, 1_664_525) + 1_013_904_223) >>> 0
    const swapIndex = randomState % (index + 1)
    const currentSlot = slots[index]
    slots[index] = slots[swapIndex]
    slots[swapIndex] = currentSlot
  }

  if (bandCount > 1 && slots.every((slot, index) => slot === index)) {
    const firstSlot = slots[0]
    slots[0] = slots[1]
    slots[1] = firstSlot
  }
  return slots
}
