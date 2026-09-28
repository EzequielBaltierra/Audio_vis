import { useEffect, useRef } from 'react'
import {
  createPathfinderGrid,
  formatPathfinderGrid,
  growPathfinderGrid,
  resizePathfinderGrid,
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

    let animationTimer = 0
    let resizeTimer = 0
    let cancelled = false
    let columns = 0
    let rows = 0
    let grid = []
    let renderedFrames = 0

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const interval = 1000 / (reduceMotion ? REDUCED_MOTION_FPS : FPS)

    const measureGrid = () => {
      const style = window.getComputedStyle(layer)
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
      const characterWidth = Math.max(1, context.measureText('━').width)
      const lineHeight = Number.parseFloat(style.lineHeight) || 12
      return {
        columns: Math.max(1, Math.floor(layer.clientWidth / characterWidth)),
        rows: Math.max(1, Math.ceil(layer.clientHeight / lineHeight)),
      }
    }

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
        animationTimer = window.setTimeout(draw, interval)
      }
    }

    const restartAnimation = () => {
      window.clearTimeout(animationTimer)
      renderedFrames = 0
      layer.textContent = formatPathfinderGrid(grid, columns, rows)
      animationTimer = window.setTimeout(draw, interval)
    }

    const start = () => {
      if (cancelled) return
      const measured = measureGrid()
      columns = measured.columns
      rows = measured.rows
      grid = createPathfinderGrid(columns, rows, Math.random, SEED_DENSITY)
      restartAnimation()
    }

    const resize = () => {
      if (cancelled || grid.length === 0) return
      const measured = measureGrid()
      if (measured.columns === columns && measured.rows === rows) return

      grid = resizePathfinderGrid(
        grid,
        columns,
        rows,
        measured.columns,
        measured.rows,
        Math.random,
        SEED_DENSITY,
      )
      columns = measured.columns
      rows = measured.rows
      restartAnimation()
    }

    const resizeObserver = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer)
      // Keep the current animation running while divider movement settles.
      // resize() restarts it only when the measured grid dimensions change.
      resizeTimer = window.setTimeout(resize, 100)
    })

    const begin = () => {
      start()
      resizeObserver.observe(layer)
    }

    if (document.readyState === 'complete') begin()
    else window.addEventListener('load', begin, { once: true })

    return () => {
      cancelled = true
      resizeObserver.disconnect()
      window.removeEventListener('load', begin)
      window.clearTimeout(animationTimer)
      window.clearTimeout(resizeTimer)
    }
  }, [])

  return <pre ref={layerRef} className="pathfinder-background" aria-hidden="true" />
}
