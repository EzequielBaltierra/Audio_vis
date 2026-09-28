// Adapted for a finite UI background from Alex Miller's Pathfinder sketch in
// ertdfgcvb/play.core. The original project is licensed under Apache-2.0.

export const PATH_GLYPHS = '┃━┏┓┗┛┣┫┳┻╋'

const FROM_TOP = '┃┃┃┃┃┃┃┃┃┃┃┃┃┃┃┃┃┃┃┃┗┛┣┫┻╋'
const FROM_BOTTOM = '┃┃┃┃┃┃┃┃┃┃┃┃┃┃┃┃┃┃┃┃┏┓┣┫┳╋'
const FROM_LEFT = '━━━━━━━━━━━━━━━━━━━━┓┛┫┳┻╋'
const FROM_RIGHT = '━━━━━━━━━━━━━━━━━━━━┏┗┣┳┻╋'

function choose(characters, random) {
  return characters.charAt(Math.floor(random() * characters.length))
}

function read(grid, columns, rows, x, y) {
  if (x < 0 || x >= columns || y < 0 || y >= rows) return ''
  return grid[y * columns + x]
}

export function createPathfinderGrid(columns, rows, random = Math.random, density = 0.001) {
  const length = Math.max(1, columns * rows)
  const grid = Array.from({ length }, () => ' ')
  const seedCount = Math.min(length, Math.max(2, Math.round(length * density)))
  const seeded = new Set()
  let attempts = 0

  while (seeded.size < seedCount && attempts < length * 4) {
    const index = Math.min(length - 1, Math.floor(random() * length))
    seeded.add(index)
    attempts += 1
  }

  for (let index = 0; seeded.size < seedCount && index < length; index += 1) {
    seeded.add(index)
  }

  seeded.forEach((index) => {
    grid[index] = choose(PATH_GLYPHS, random)
  })

  return grid
}

export function resizePathfinderGrid(
  grid,
  previousColumns,
  previousRows,
  nextColumns,
  nextRows,
  random = Math.random,
  density = 0.001,
) {
  const resizedGrid = Array.from({ length: nextColumns * nextRows }, () => ' ')
  const copiedColumns = Math.min(previousColumns, nextColumns)
  const copiedRows = Math.min(previousRows, nextRows)

  for (let y = 0; y < copiedRows; y += 1) {
    for (let x = 0; x < copiedColumns; x += 1) {
      resizedGrid[y * nextColumns + x] = grid[y * previousColumns + x]
    }
  }

  const newCellIndexes = []
  for (let y = 0; y < nextRows; y += 1) {
    for (let x = 0; x < nextColumns; x += 1) {
      if (x >= previousColumns || y >= previousRows) {
        newCellIndexes.push(y * nextColumns + x)
      }
    }
  }

  const seedCount = density > 0
    ? Math.min(newCellIndexes.length, Math.max(1, Math.round(newCellIndexes.length * density)))
    : 0
  const availableIndexes = [...newCellIndexes]
  for (let seed = 0; seed < seedCount; seed += 1) {
    const choiceIndex = Math.min(
      availableIndexes.length - 1,
      Math.floor(random() * availableIndexes.length),
    )
    const [gridIndex] = availableIndexes.splice(choiceIndex, 1)
    resizedGrid[gridIndex] = choose(PATH_GLYPHS, random)
  }

  return resizedGrid
}

export function growPathfinderGrid(
  grid,
  columns,
  rows,
  random = Math.random,
  growthChance = 1,
) {
  const next = [...grid]
  let changed = false
  let active = false

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const index = y * columns + x
      if (grid[index] !== ' ') continue

      const top = read(grid, columns, rows, x, y - 1)
      const bottom = read(grid, columns, rows, x, y + 1)
      const left = read(grid, columns, rows, x - 1, y)
      const right = read(grid, columns, rows, x + 1, y)
      let character = ' '

      if ('┃┫┣╋┏┓┳'.includes(top)) character = FROM_TOP
      else if ('┃┗┛┣┫┻╋'.includes(bottom)) character = FROM_BOTTOM
      else if ('━┏┗┣┳┻╋'.includes(left)) character = FROM_LEFT
      else if ('━┓┛┫┳┻╋'.includes(right)) character = FROM_RIGHT

      if (character !== ' ') {
        active = true
      }

      if (character !== ' ' && random() <= growthChance) {
        next[index] = choose(character, random)
        changed = true
      }
    }
  }

  return { active, changed, grid: next }
}

export function settlePathfinderGrid(
  initialGrid,
  columns,
  rows,
  random = Math.random,
  maxFrames = 90,
) {
  let grid = initialGrid
  for (let frame = 0; frame < maxFrames; frame += 1) {
    const result = growPathfinderGrid(grid, columns, rows, random)
    grid = result.grid
    if (!result.changed) break
  }
  return grid
}

export function formatPathfinderGrid(grid, columns, rows) {
  const lines = []
  for (let y = 0; y < rows; y += 1) {
    lines.push(grid.slice(y * columns, (y + 1) * columns).join('').trimEnd())
  }
  return lines.join('\n')
}
