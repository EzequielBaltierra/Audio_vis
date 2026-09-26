import { useEffect, useRef } from 'react'
import {
  createPathfinderGrid,
  formatPathfinderGrid,
  growPathfinderGrid,
} from '../../ascii/pathfinder.js'

const FPS = 30
const REDUCED_MOTION_FPS = 30
const MAX_FRAMES = 120
const SEED_DENSITY = 0.006
const GROWTH_CHANCE = 0.34

export function PathfinderBackground() {
  const layerRef = useRef(null)

  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return undefined

    let timer = 0
    let cancelled = false

    const start = () => {
      if (cancelled) return

      const style = window.getComputedStyle(layer)
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
      const characterWidth = Math.max(1, context.measureText('━').width)
      const lineHeight = Number.parseFloat(style.lineHeight) || 12
      const columns = Math.max(1, Math.floor(layer.clientWidth / characterWidth))
      const rows = Math.max(1, Math.ceil(layer.clientHeight / lineHeight))
      let grid = createPathfinderGrid(columns, rows, Math.random, SEED_DENSITY)
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const interval = 1000 / (reduceMotion ? REDUCED_MOTION_FPS : FPS)
      layer.textContent = formatPathfinderGrid(grid, columns, rows)
      let renderedFrames = 0

      const draw = () => {
        if (cancelled) return
        const result = growPathfinderGrid(
          grid,
          columns,
          rows,
          Math.random,
          GROWTH_CHANCE,
        )
        grid = result.grid
        renderedFrames += 1
        layer.textContent = formatPathfinderGrid(grid, columns, rows)

        if (result.active && renderedFrames < MAX_FRAMES) {
          timer = window.setTimeout(draw, interval)
        }
      }

      timer = window.setTimeout(draw, interval)
    }

    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })

    return () => {
      cancelled = true
      window.removeEventListener('load', start)
      window.clearTimeout(timer)
    }
  }, [])

  return <pre ref={layerRef} className="pathfinder-background" aria-hidden="true" />
}
