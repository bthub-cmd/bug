const { createCanvas } = require('canvas')

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  let line = ''
  let yPos = y

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' '
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width

    if (testWidth > maxWidth && i > 0) {
      ctx.fillText(line, x, yPos)
      line = words[i] + ' '
      yPos += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, yPos)
}

function createBoardCanvas(size) {
  const cellSize = 40
  const width = size * cellSize
  const height = size * cellSize
  return createCanvas(width, height)
}

module.exports = {
  wrapText,
  createBoardCanvas
}