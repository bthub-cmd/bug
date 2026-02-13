const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const pino = require('pino')
const sharp = require('sharp')
const { checkCooldown } = require('../utils/cooldown')

async function handle(sock, msg, from, quoted) {
  const sender = msg.key.participant || from
  const cooldownCheck = checkCooldown(sender, 'sticker')

  if (cooldownCheck.onCooldown) {
    return sock.sendMessage(from, {
      text: `⏳ Cooldown aktif! Tunggu ${cooldownCheck.timeLeft} detik lagi.`
    }, { quoted: msg })
  }

  const buffer = await downloadMediaMessage(
    { message: quoted },
    'buffer',
    {},
    { logger: pino(), reuploadRequest: sock.updateMediaMessage }
  )

  const sticker = await sharp(buffer)
    .resize(512, 512)
    .webp({ quality: 90 })
    .toBuffer()

  await sock.sendMessage(from, { sticker }, { quoted: msg })
}

module.exports = { handle }