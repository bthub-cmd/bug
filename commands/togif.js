const { downloadMediaMessage } = require('@whiskeysockets/baileys')
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

    const stickerMsg = quoted.stickerMessage
    if (!stickerMsg) {
      return sock.sendMessage(from, {
        text: '❌ Reply sticker yang ingin diconvert!'
      }, { quoted: msg })
    }

    const buffer = await downloadMediaMessage(
      { message: quoted },
      'buffer',
      {},
      { reuploadRequest: sock.updateMediaMessage }
    )

    const webpPath = path.join('./cache', `sticker_${Date.now()}.webp`)
    const gifPath = path.join('./cache', `temp_${Date.now()}.gif`)
    const mp4Path = path.join('./cache', `video_${Date.now()}.mp4`)

    fs.writeFileSync(webpPath, buffer)

    let isReallyAnimated = stickerMsg.isAnimated === true || buffer.length > 50000

    if (!isReallyAnimated) {
      fs.unlinkSync(webpPath)
      return sock.sendMessage(from, {
        text: '❌ Sticker ini tidak animasi!'
      }, { quoted: msg })
    }

    await sock.sendMessage(from, {
      text: '⏳ Converting...'
    }, { quoted: msg })

    // Convert animated WebP to GIF using Python Pillow
    const pythonScript = `#!/usr/bin/env python3
from PIL import Image
import sys
try:
    img = Image.open("${webpPath}")
    img.save("${gifPath}", save_all=True, duration=img.info.get('duration', 100), loop=0)
except Exception as e:
    sys.exit(1)
`
    const scriptPath = '/tmp/webp2gif.py'
    fs.writeFileSync(scriptPath, pythonScript)
    
    execSync(`python3 "${scriptPath}" 2>/dev/null`, { timeout: 15000 })

    if (!fs.existsSync(gifPath)) {
      throw new Error('Conversion failed')
    }

    // Convert GIF to MP4
    execSync(`ffmpeg -i "${gifPath}" -movflags faststart -pix_fmt yuv420p -c:v libx264 -preset fast -crf 23 -vf "fps=30,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:black" -t 10 "${mp4Path}" 2>/dev/null`, { timeout: 30000 })

    if (!fs.existsSync(mp4Path) || fs.statSync(mp4Path).size < 1000) {
      throw new Error('MP4 conversion failed')
    }

    const mp4Buffer = fs.readFileSync(mp4Path)
    const mp4Size = (mp4Buffer.length / 1024 / 1024).toFixed(2)

    await sock.sendMessage(from, { 
      video: mp4Buffer,
      caption: `✅ Success!\n📦 ${mp4Size} MB`
    }, { quoted: msg })

    setTimeout(() => {
      try {
        fs.unlinkSync(webpPath)
        fs.unlinkSync(gifPath)
        fs.unlinkSync(mp4Path)
      } catch (e) {}
    }, 5000)

  } catch (err) {
    return sock.sendMessage(from, {
      text: '❌ Conversion failed. Install: sudo apt install python3-pil'
    }, { quoted: msg })
  }
}

module.exports = { handle }
