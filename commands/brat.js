const { createCanvas } = require('canvas')
const sharp = require('sharp')
const { wrapText } = require('../utils/canvas')

async function handle(sock, msg, from, body) {
  const text = body.replace('.brat ', '').toUpperCase()

  const width = 512
  const height = 512
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = '#000000'
  ctx.font = 'bold 65px Sans'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  wrapText(ctx, text, 40, 40, 430, 80)

  const buffer = canvas.toBuffer('image/png')

  const sticker = await sharp(buffer)
    .webp({ quality: 100 })
    .toBuffer()

  return sock.sendMessage(from, { sticker }, { quoted: msg })
}

module.exports = { handle }