const { createCanvas } = require('canvas')
const sharp = require('sharp')
const themes = require('./themes')
const state = require('./state')

async function generateBoard(game) {
  const theme = game.theme
  const size = game.boardSize
  const cellSize = 50
  const padding = 60
  const width = size * cellSize + padding * 2
  const height = size * cellSize + padding * 2
  
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  
  // Background
  ctx.fillStyle = theme.bg
  ctx.fillRect(0, 0, width, height)
  
  // Draw grid
  ctx.strokeStyle = theme.grid
  ctx.lineWidth = 2
  
  for (let i = 0; i <= size; i++) {
    // Vertical lines
    ctx.beginPath()
    ctx.moveTo(padding + i * cellSize, padding)
    ctx.lineTo(padding + i * cellSize, padding + size * cellSize)
    ctx.stroke()
    
    // Horizontal lines
    ctx.beginPath()
    ctx.moveTo(padding, padding + i * cellSize)
    ctx.lineTo(padding + size * cellSize, padding + i * cellSize)
    ctx.stroke()
  }
  
  // Draw numbers (zigzag)
  ctx.fillStyle = theme.text
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      let num
      if (row % 2 === 0) {
        // Left to right
        num = (size - row - 1) * size + col + 1
      } else {
        // Right to left
        num = (size - row - 1) * size + (size - col)
      }
      
      const x = padding + col * cellSize + cellSize / 2
      const y = padding + row * cellSize + cellSize / 2
      
      // Cell background untuk start dan finish
      if (num === 1) {
        ctx.fillStyle = '#90EE90'
        ctx.fillRect(padding + col * cellSize + 2, padding + row * cellSize + 2, cellSize - 4, cellSize - 4)
        ctx.fillStyle = theme.text
      } else if (num === size * size) {
        ctx.fillStyle = '#FFD700'
        ctx.fillRect(padding + col * cellSize + 2, padding + row * cellSize + 2, cellSize - 4, cellSize - 4)
        ctx.fillStyle = theme.text
      }
      
      ctx.fillText(num.toString(), x, y)
    }
  }
  
  // Draw snakes
  ctx.strokeStyle = theme.snake
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  
  game.snakes.forEach(snake => {
    const fromPos = getCellPosition(snake.from, size, cellSize, padding)
    const toPos = getCellPosition(snake.to, size, cellSize, padding)
    
    // Draw snake body (curve)
    ctx.beginPath()
    ctx.moveTo(fromPos.x, fromPos.y)
    ctx.bezierCurveTo(
      fromPos.x - 20, fromPos.y + 30,
      toPos.x + 20, toPos.y - 30,
      toPos.x, toPos.y
    )
    ctx.stroke()
    
    // Draw head
    ctx.fillStyle = theme.head
    ctx.beginPath()
    ctx.arc(fromPos.x, fromPos.y, 8, 0, Math.PI * 2)
    ctx.fill()
    
    // Eyes
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(fromPos.x - 3, fromPos.y - 3, 2, 0, Math.PI * 2)
    ctx.arc(fromPos.x + 3, fromPos.y - 3, 2, 0, Math.PI * 2)
    ctx.fill()
    
    // Tail
    ctx.fillStyle = theme.snake
    ctx.beginPath()
    ctx.arc(toPos.x, toPos.y, 5, 0, Math.PI * 2)
    ctx.fill()
  })
  
  // Draw ladders
  ctx.strokeStyle = theme.ladder
  ctx.lineWidth = 3
  
  game.ladders.forEach(ladder => {
    const fromPos = getCellPosition(ladder.from, size, cellSize, padding)
    const toPos = getCellPosition(ladder.to, size, cellSize, padding)
    
    const dx = toPos.x - fromPos.x
    const dy = toPos.y - fromPos.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const steps = Math.floor(distance / 15)
    
    // Ladder rails
    ctx.beginPath()
    ctx.moveTo(fromPos.x - 5, fromPos.y)
    ctx.lineTo(toPos.x - 5, toPos.y)
    ctx.moveTo(fromPos.x + 5, fromPos.y)
    ctx.lineTo(toPos.x + 5, toPos.y)
    ctx.stroke()
    
    // Ladder steps
    for (let i = 1; i < steps; i++) {
      const t = i / steps
      const x1 = fromPos.x - 5 + (toPos.x - fromPos.x) * t
      const y1 = fromPos.y + (toPos.y - fromPos.y) * t
      const x2 = fromPos.x + 5 + (toPos.x - fromPos.x) * t
      const y2 = fromPos.y + (toPos.y - fromPos.y) * t
      
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
  })
  
  // Draw players
  game.players.forEach((player, index) => {
    const pos = getCellPosition(player.position, size, cellSize, padding)
    const color = state.getPlayerColor(index)
    const offset = (index % 2) * 15 - 7
    const offsetY = Math.floor(index / 2) * 15 - 7
    
    ctx.fillStyle = color.hex
    
    // Draw shape
    const x = pos.x + offset
    const y = pos.y + offsetY
    
    switch (player.shape) {
      case 'circle':
        ctx.beginPath()
        ctx.arc(x, y, 10, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'square':
        ctx.fillRect(x - 10, y - 10, 20, 20)
        break
      case 'star':
        drawStar(ctx, x, y, 5, 10, 5)
        ctx.fill()
        break
      case 'triangle':
        ctx.beginPath()
        ctx.moveTo(x, y - 10)
        ctx.lineTo(x - 10, y + 10)
        ctx.lineTo(x + 10, y + 10)
        ctx.closePath()
        ctx.fill()
        break
    }
    
    // Initial
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(player.name.charAt(0).toUpperCase(), x, y)
  })
  
  // Title
  ctx.fillStyle = theme.text
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(`🐍 ULAR TANGGA - ${theme.name} 🪜`, width / 2, 30)
  
  // Info
  ctx.font = '12px Arial'
  ctx.fillText(`Size: ${size}×${size} | 🐍 ${game.snakes.length} | 🪜 ${game.ladders.length}`, width / 2, height - 20)
  
  const buffer = canvas.toBuffer('image/png')
  return sharp(buffer).webp({ quality: 80 }).toBuffer()
}

function getCellPosition(number, size, cellSize, padding) {
  const rowFromBottom = Math.floor((number - 1) / size)
  const row = size - 1 - rowFromBottom
  
  let col
  if (rowFromBottom % 2 === 0) {
    col = (number - 1) % size
  } else {
    col = size - 1 - ((number - 1) % size)
  }
  
  return {
    x: padding + col * cellSize + cellSize / 2,
    y: padding + row * cellSize + cellSize / 2
  }
}

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = Math.PI / 2 * 3
  let x = cx
  let y = cy
  let step = Math.PI / spikes

  ctx.beginPath()
  ctx.moveTo(cx, cy - outerRadius)
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius
    y = cy + Math.sin(rot) * outerRadius
    ctx.lineTo(x, y)
    rot += step

    x = cx + Math.cos(rot) * innerRadius
    y = cy + Math.sin(rot) * innerRadius
    ctx.lineTo(x, y)
    rot += step
  }
  ctx.lineTo(cx, cy - outerRadius)
  ctx.closePath()
}

module.exports = { generateBoard }