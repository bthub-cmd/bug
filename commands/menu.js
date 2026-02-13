const fs = require('fs')
const configManager = require('../utils/config')

async function handle(sock, msg, from) {
  const config = configManager.getConfig()
  
  // Check if banner exists
  let bannerPath = './banner.png'
  let hasBanner = fs.existsSync(bannerPath)
  
  const menuText = `${config.BOT_NAME}


${config.BOT_DESC}

┌─「 📥 DOWNLOADER 」
│ • .ytmp3 [url] - YouTube MP3
│ • .ytmp4 [url] - YouTube MP4 (HD)
│ • .tt [url] - TikTok Video
│ • .ig [url] - Instagram Post
└────────────

┌─「 🤖 AI & FUN 」
│ • .ai [text] - Chat dengan AI
│ • .brat [text] - BRAT Maker
│ • .tod - Truth or Dare
│ • .cekjodoh [nama] & [nama]
│ • .love [nama] & [nama]
│ • .meme - Random Meme
│ • .quotes - Quote Motivasi
│ • .tebak start - Tebak Angka Game
│ • .tebak [angka] - Jawab tebakan
└────────────

┌─「 🎨 MEDIA 」
│ • .s - Image to sticker
│ • .sv - Video/GIF to sticker
│ • .toimg - Sticker to image
│ • .togif - Sticker to GIF
└────────────

┌─「 🎲 GAME 」
│ • .ut - Ular Tangga
└────────────

┌─「 ⚙️ UTILITY 」
│ • .ping - Cek bot status & system
│ • .menu - List Menu
└────────────

${config.OWNER ? `┌─「 👑 OWNER 」
│ • .setname [text] - Ubah nama bot
│ • .setdesc [text] - Ubah deskripsi
│ • .setbanner - Ubah banner (reply img)
│ • .broadcast - Broadcast update
│ • .maintenance [waktu] - Maintenance mode
└────────────` : `┌─「 🔑 CLAIM BOT 」
│ • .code [kode] - Claim ownership
│   Kode: ${config.CLAIM_CODE}
└────────────`}

─────────────
Berkah Tobrut Community®`

  if (hasBanner) {
    await sock.sendMessage(from, {
      image: fs.readFileSync(bannerPath),
      caption: menuText
    }, { quoted: msg })
  } else {
    await sock.sendMessage(from, {
      text: menuText
    }, { quoted: msg })
  }
}

module.exports = { handle }
