// Check ownership when events arrive, since media events can outlive a source switch.
export function subscribeMediaEvents(audio, handlers, isMediaActive) {
  const listeners = Object.entries(handlers).map(([eventName, handler]) => {
    const listener = () => {
      if (isMediaActive()) handler()
    }
    audio.addEventListener(eventName, listener)
    return [eventName, listener]
  })

  return () => {
    for (const [eventName, listener] of listeners) {
      audio.removeEventListener(eventName, listener)
    }
  }
}
