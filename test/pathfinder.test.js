import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PATH_GLYPHS,
  createPathfinderGrid,
  formatPathfinderGrid,
  growPathfinderGrid,
  resizePathfinderGrid,
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

test('pathfinder resizing preserves overlapping cells and trims clipped cells', () => {
  const original = ['A', 'B', 'C', 'D', 'E', 'F']
  const expanded = resizePathfinderGrid(original, 3, 2, 4, 3, () => 0, 0)
  assert.deepEqual(expanded, [
    'A', 'B', 'C', ' ',
    'D', 'E', 'F', ' ',
    ' ', ' ', ' ', ' ',
  ])
  assert.deepEqual(resizePathfinderGrid(expanded, 4, 3, 2, 2, () => 0, 0), [
    'A', 'B',
    'D', 'E',
  ])
})

test('pathfinder resizing seeds only newly exposed cells', () => {
  const original = ['A', 'B', 'C', 'D']
  const expanded = resizePathfinderGrid(original, 2, 2, 3, 2, () => 0, 1)
  assert.deepEqual(expanded.slice(0, 2), ['A', 'B'])
  assert.deepEqual(expanded.slice(3, 5), ['C', 'D'])
  assert.ok(PATH_GLYPHS.includes(expanded[2]))
  assert.ok(PATH_GLYPHS.includes(expanded[5]))
})
