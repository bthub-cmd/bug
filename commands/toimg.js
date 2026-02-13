const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const sharp = require('sharp')
const path = require('path')
const fs = require('fs')
const { checkCooldown } = require('../utils/cooldown')
const { ensureCacheDir } = require('../utils/helpers')

async function handle(sock, msg, from, quoted) {
  const sender = msg.key.participant || from
  const cooldownCheck = checkCooldown(sender, 'toimg')

  if (cooldownCheck.onCooldown) {
    return sock.sendMessage(from, {
      text: `⏳ Cooldown aktif! Tunggu ${cooldownCheck.timeLeft} detik lagi.`
    }, { quoted: msg })
  }

  try {
    ensureCacheDir()

    const buffer = await downloadMediaMessage(
      { message: quoted },
      'buffer',
      {},
      { reuploadRequest: sock.updateMediaMessage }
    )

    const filename = `image_${Date.now()}.png`
    const cachePath = path.join('./cache', filename)

    const image = await sharp(buffer)
      .png()
      .toBuffer()

    fs.writeFileSync(cachePath, image)

    await sock.sendMessage(from, { image }, { quoted: msg })

  } catch (err) {
    return sock.sendMessage(from, {
      text: '❌ Gagal convert sticker. Pastikan sticker valid.'
    }, { quoted: msg })
  }
}

module.exports = { handle }