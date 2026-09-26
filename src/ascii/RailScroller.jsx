import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'

export const RailScroller = forwardRef(function RailScroller(
  { children, onMetricsChange },
  forwardedRef,
) {
  const scrollerRef = useRef(null)
  const contentRef = useRef(null)

  const updateMetrics = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    const overflow = scroller.scrollHeight > scroller.clientHeight + 1
    const maxScroll = Math.max(1, scroller.scrollHeight - scroller.clientHeight)
    onMetricsChange?.({
      overflow,
      visibleRatio: Math.min(1, scroller.clientHeight / Math.max(1, scroller.scrollHeight)),
      value: overflow ? Math.min(1, scroller.scrollTop / maxScroll) : 0,
    })
  }, [onMetricsChange])

  useImperativeHandle(forwardedRef, () => ({
    scrollToRatio(ratio) {
      const scroller = scrollerRef.current
      if (!scroller) return
      const safeRatio = Math.min(1, Math.max(0, ratio))
      scroller.scrollTop = safeRatio * (scroller.scrollHeight - scroller.clientHeight)
    },
    handleKey(key) {
      const scroller = scrollerRef.current
      if (!scroller) return
      const increments = {
        ArrowUp: -24,
        ArrowDown: 24,
        PageUp: -scroller.clientHeight * 0.8,
        PageDown: scroller.clientHeight * 0.8,
        Home: -scroller.scrollHeight,
        End: scroller.scrollHeight,
      }
      if (!(key in increments)) return
      scroller.scrollBy({ top: increments[key], behavior: 'smooth' })
    },
  }), [])

  useEffect(() => {
    const scroller = scrollerRef.current
    const content = contentRef.current
    if (!scroller || !content) return undefined

    const resizeObserver = new ResizeObserver(updateMetrics)
    resizeObserver.observe(scroller)
    resizeObserver.observe(content)
    scroller.addEventListener('scroll', updateMetrics, { passive: true })
    updateMetrics()

    return () => {
      resizeObserver.disconnect()
      scroller.removeEventListener('scroll', updateMetrics)
    }
  }, [updateMetrics])

  return (
    <div className="rail-scroll-shell">
      <div id="rail-controls" ref={scrollerRef} className="rail-scroll-region" tabIndex="0">
        <div ref={contentRef} className="rail-scroll-content">
          {children}
        </div>
      </div>
    </div>
  )
})
