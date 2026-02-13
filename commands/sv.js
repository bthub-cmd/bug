const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')
const { checkCooldown } = require('../utils/cooldown')
const { ensureCacheDir } = require('../utils/helpers')

async function handle(sock, msg, from, quoted) {
  const sender = msg.key.participant || from
  const cooldownCheck = checkCooldown(sender, 'sv')

  if (cooldownCheck.onCooldown) {
    return sock.sendMessage(from, {
      text: `⏳ Cooldown aktif! Tunggu ${cooldownCheck.timeLeft} detik lagi.`
    }, { quoted: msg })
  }

  try {
    ensureCacheDir()

    await sock.sendMessage(from, {
      text: '⏳ Memproses video... Tunggu sebentar'
    }, { quoted: msg })

    const buffer = await downloadMediaMessage(
      { message: quoted },
      'buffer',
      {},
      { reuploadRequest: sock.updateMediaMessage }
    )

    const videoPath = path.join('./cache', `video_${Date.now()}.mp4`)
    const webpPath = path.join('./cache', `sticker_${Date.now()}.webp`)

    fs.writeFileSync(videoPath, buffer)

    // Get video duration
    const durationCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
    const duration = parseFloat(execSync(durationCmd).toString().trim())

    if (duration > 10) {
      fs.unlinkSync(videoPath)
      return sock.sendMessage(from, {
        text: '❌ Video terlalu panjang! Maksimal 10 detik.\n\nTips: Potong video terlebih dahulu.'
      }, { quoted: msg })
    }

    // Convert to webp sticker (animated)
    execSync(`ffmpeg -i "${videoPath}" -vf "fps=15,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0.0" -loop 0 -preset default -an -vsync 0 "${webpPath}"`)

    const stickerBuffer = fs.readFileSync(webpPath)

    await sock.sendMessage(from, { 
      sticker: stickerBuffer 
    }, { quoted: msg })

    // Cleanup
    setTimeout(() => {
      try {
        fs.unlinkSync(videoPath)
        fs.unlinkSync(webpPath)
      } catch (e) {}
    }, 5000)

  } catch (err) {
    console.error('Error sv:', err)
    return sock.sendMessage(from, {
      text: '❌ Gagal convert video.\n\nPastikan:\n• Video tidak corrupt\n• Durasi max 10 detik\n• Format didukung (MP4/GIF)'
    }, { quoted: msg })
  }
}

module.exports = { handle }
