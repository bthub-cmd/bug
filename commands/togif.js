const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const sharp = require('sharp')
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')
const { checkCooldown } = require('../utils/cooldown')
const { ensureCacheDir } = require('../utils/helpers')

async function handle(sock, msg, from, quoted) {
  const sender = msg.key.participant || from
  const cooldownCheck = checkCooldown(sender, 'togif')

  if (cooldownCheck.onCooldown) {
    return sock.sendMessage(from, {
      text: `⏳ Cooldown aktif! Tunggu ${cooldownCheck.timeLeft} detik lagi.`
    }, { quoted: msg })
  }

  try {
    ensureCacheDir()

    // Check if sticker is animated
    const stickerMsg = quoted.stickerMessage
    if (!stickerMsg) {
      return sock.sendMessage(from, {
        text: '❌ Reply sticker yang ingin diconvert!'
      }, { quoted: msg })
    }

    // Animated sticker has isAnimated property or mimetype video/webm
    const isAnimated = stickerMsg.isAnimated || stickerMsg.mimetype === 'image/webp'
    
    console.log('[TOGIF] Sticker info:', {
      isAnimated: stickerMsg.isAnimated,
      mimetype: stickerMsg.mimetype,
      fileLength: stickerMsg.fileLength
    })

    const buffer = await downloadMediaMessage(
      { message: quoted },
      'buffer',
      {},
      { reuploadRequest: sock.updateMediaMessage }
    )

    const webpPath = path.join('./cache', `sticker_${Date.now()}.webp`)
    const gifPath = path.join('./cache', `gif_${Date.now()}.gif`)
    const mp4Path = path.join('./cache', `video_${Date.now()}.mp4`)

    fs.writeFileSync(webpPath, buffer)

    // Try to detect if it's animated by checking file
    let isReallyAnimated = false
    try {
      const fileInfo = execSync(`file "${webpPath}"`).toString()
      isReallyAnimated = fileInfo.includes('animated') || fileInfo.includes('VP8')
      console.log('[TOGIF] File info:', fileInfo.trim())
    } catch (e) {
      console.log('[TOGIF] File check error:', e.message)
    }

    if (!isReallyAnimated) {
      // Try ffprobe to check if it has multiple frames
      try {
        const frameCheck = execSync(`ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of default=noprint_wrappers=1:nokey=1 "${webpPath}"`).toString().trim()
        const frameCount = parseInt(frameCheck)
        isReallyAnimated = frameCount > 1
        console.log('[TOGIF] Frame count:', frameCount)
      } catch (e) {
        console.log('[TOGIF] Frame check error:', e.message)
      }
    }

    if (!isReallyAnimated) {
      // Cleanup
      fs.unlinkSync(webpPath)
      return sock.sendMessage(from, {
        text: '❌ Sticker ini tidak animasi!\n\nGunakan .toimg untuk convert sticker biasa ke gambar.'
      }, { quoted: msg })
    }

    await sock.sendMessage(from, {
      text: '⏳ Converting animated sticker to GIF...'
    }, { quoted: msg })

    // Convert webp to mp4 first (better compatibility)
    execSync(`ffmpeg -i "${webpPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=512:512:force_original_aspect_ratio=decrease" "${mp4Path}"`)

    // Convert mp4 to gif
    execSync(`ffmpeg -i "${mp4Path}" -vf "fps=15,scale=512:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 "${gifPath}"`)

    // Check if GIF was created
    if (!fs.existsSync(gifPath)) {
      throw new Error('GIF conversion failed')
    }

    const gifBuffer = fs.readFileSync(gifPath)
    const gifSize = (gifBuffer.length / 1024 / 1024).toFixed(2)

    await sock.sendMessage(from, { 
      video: gifBuffer,
      gifPlayback: true,
      caption: `✅ Sticker converted to GIF!\n📦 Size: ${gifSize} MB`
    }, { quoted: msg })

    // Cleanup
    setTimeout(() => {
      try {
        fs.unlinkSync(webpPath)
        fs.unlinkSync(gifPath)
        fs.unlinkSync(mp4Path)
      } catch (e) {}
    }, 5000)

  } catch (err) {
    console.error('Error togif:', err)
    return sock.sendMessage(from, {
      text: '❌ Gagal convert sticker.\n\nPastikan:\n• Sticker adalah ANIMASI (bukan sticker biasa)\n• FFmpeg terinstall dengan benar\n• File tidak corrupt'
    }, { quoted: msg })
  }
}

module.exports = { handle }
