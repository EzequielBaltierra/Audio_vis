import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PATH_GLYPHS,
  createPathfinderGrid,
  formatPathfinderGrid,
  growPathfinderGrid,
} from '../src/ascii/pathfinder.js'

test('pathfinder seeding always creates the requested minimum without hanging', () => {
  const grid = createPathfinderGrid(4, 4, () => 0)
  assert.equal(grid.filter((character) => character !== ' ').length, 2)
  assert.ok(grid.filter((character) => character !== ' ').every((character) => {
    return PATH_GLYPHS.includes(character)
  }))
})

test('pathfinder growth reads the previous frame without mutating it', () => {
  const grid = [
    ' ', '┃', ' ',
    ' ', ' ', ' ',
    ' ', ' ', ' ',
  ]
  const snapshot = [...grid]
  const result = growPathfinderGrid(grid, 3, 3, () => 0)

  assert.deepEqual(grid, snapshot)
  assert.equal(result.grid[4], '┃')
  assert.equal(result.changed, true)
})

test('pathfinder reports an active frontier when a throttled frame does not grow', () => {
  const grid = [
    ' ', '┃', ' ',
    ' ', ' ', ' ',
    ' ', ' ', ' ',
  ]
  const result = growPathfinderGrid(grid, 3, 3, () => 0.9, 0.2)

  assert.equal(result.active, true)
  assert.equal(result.changed, false)
})

test('formatted pathfinder rows contain no trailing spaces', () => {
  const output = formatPathfinderGrid(['┃', ' ', ' ', ' ', '━', ' '], 3, 2)
  assert.equal(output, '┃\n ━')
  assert.ok(output.split('\n').every((line) => !line.endsWith(' ')))
})
