export function clearSurface(context, width, height) {
  context.clearRect(0, 0, width, height)
  context.fillStyle = '#090b09'
  context.fillRect(0, 0, width, height)
}
