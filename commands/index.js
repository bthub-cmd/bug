const fs = require('fs')
const configManager = require('../utils/config')
const ownerCommands = require('./owner')
const menuCommand = require('./menu')
const aiCommand = require('./ai')
const stickerCommand = require('./sticker')
const toimgCommand = require('./toimg')
const bratCommand = require('./brat')
const pingCommand = require('./ping')
const togifCommand = require('./togif')
const svCommand = require('./sv')
const funCommands = require('./fun')
const ulartanggaHandler = require('./ulartangga/index')
const { downloadYouTube, downloadYouTubeVideo } = require('../downloader/youtube')
const { downloadTikTok } = require('../downloader/tiktok')
const { downloadInstagram } = require('../downloader/instagram')

async function handleCommand(sock, msg, from, sender, body, startTime) {
  const config = configManager.getConfig()
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
  
  // Owner commands
  if (body.startsWith('.code ')) {
    return ownerCommands.handleCode(sock, msg, from, sender, body)
  }
  
  if (body.startsWith('.setname ')) {
    return ownerCommands.handleSetName(sock, msg, from, sender, body)
  }
  
  if (body.startsWith('.setdesc ')) {
    return ownerCommands.handleSetDesc(sock, msg, from, sender, body)
  }
  
  if (body.startsWith('.setbanner') && quoted?.imageMessage) {
    return ownerCommands.handleSetBanner(sock, msg, from, sender, quoted)
  }
  
  if (body.startsWith('.broadcast')) {
    return ownerCommands.handleBroadcast(sock, msg, from, sender, body)
  }
  
  if (body.startsWith('.maintenance')) {
    return ownerCommands.handleMaintenance(sock, msg, from, sender, body)
  }
  
  // Menu command
  if (body === '.menu') {
    return menuCommand.handle(sock, msg, from)
  }
  
  // AI command
  if (body.startsWith('.ai ')) {
    return aiCommand.handle(sock, msg, from, body)
  }
  
  // Sticker commands
  if (body === '.s' && quoted?.imageMessage) {
    return stickerCommand.handle(sock, msg, from, quoted)
  }
  
  if (body === '.sv' && quoted?.videoMessage) {
    return svCommand.handle(sock, msg, from, quoted)
  }
  
  // To image command
  if (body === '.toimg' && quoted?.stickerMessage) {
    return toimgCommand.handle(sock, msg, from, quoted)
  }
  
  // To GIF command
  if (body === '.togif' && quoted?.stickerMessage) {
    return togifCommand.handle(sock, msg, from, quoted)
  }
  
  // Brat command
  if (body.startsWith('.brat ')) {
    return bratCommand.handle(sock, msg, from, body)
  }
  
  // Ping command
  if (body === '.ping') {
    return pingCommand.handle(sock, msg, from, startTime)
  }
  
  // Fun commands
  if (body === '.tod') {
    return funCommands.truthOrDare(sock, msg, from)
  }
  
  if (body.startsWith('.cekjodoh ')) {
    return funCommands.cekJodoh(sock, msg, from, body)
  }
  
  if (body === '.meme') {
    return funCommands.meme(sock, msg, from)
  }
  
  if (body === '.quotes') {
    return funCommands.quotes(sock, msg, from)
  }
  
  if (body.startsWith('.tebak')) {
    return funCommands.tebakAngka(sock, msg, from, sender, body)
  }
  
  if (body.startsWith('.love ')) {
    return funCommands.kalkulatorCinta(sock, msg, from, body)
  }
  
  // Ular Tangga commands
  if (body.startsWith('.ut')) {
    return ulartanggaHandler.handler(sock, msg, from, sender, body)
  }
  
  // ===== DOWNLOADER COMMANDS =====
  
  // YouTube MP3
  if (body.startsWith('.ytmp3 ')) {
    const url = body.replace('.ytmp3 ', '').trim()
    
    if (!url || !url.match(/youtube\.com|youtu\.be/i)) {
      return sock.sendMessage(from, {
        text: '❌ Berikan URL YouTube yang valid!\n\nContoh: .ytmp3 https://youtube.com/watch?v=xxxxx'
      }, { quoted: msg })
    }
    
    await sock.sendMessage(from, {
      text: '⏳ Mengunduh audio...'
    }, { quoted: msg })
    
    try {
      const filePath = await downloadYouTube(url)
      const stats = fs.statSync(filePath)
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
      
      await sock.sendMessage(from, {
        audio: fs.readFileSync(filePath),
        mimetype: 'audio/mpeg',
        fileName: `youtube_audio_${Date.now()}.mp3`,
        caption: `✅ *YouTube Audio Downloaded*\n\n📦 Size: ${sizeMB} MB`
      }, { quoted: msg })
      
      // Clean up
      setTimeout(() => {
        try { fs.unlinkSync(filePath) } catch (e) {}
      }, 300000)
      
    } catch (error) {
      console.error('[YTMP3] Error:', error)
      await sock.sendMessage(from, {
        text: `❌ Gagal mengunduh: ${error.message}`
      }, { quoted: msg })
    }
  }
  
  // YouTube MP4
  if (body.startsWith('.ytmp4 ') || body.startsWith('.yt ')) {
    const url = body.replace(/^\.(ytmp4|yt) /, '').trim()
    
    if (!url || !url.match(/youtube\.com|youtu\.be/i)) {
      return sock.sendMessage(from, {
        text: '❌ Berikan URL YouTube yang valid!\n\nContoh: .ytmp4 https://youtube.com/watch?v=xxxxx'
      }, { quoted: msg })
    }
    
    await sock.sendMessage(from, {
      text: '⏳ Mengunduh video...'
    }, { quoted: msg })
    
    try {
      const result = await downloadYouTubeVideo(url)
      const stats = fs.statSync(result.path)
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
      
      // Always send as document
      await sock.sendMessage(from, {
        document: fs.readFileSync(result.path),
        mimetype: 'video/mp4',
        fileName: `${result.title.substring(0, 50)}.mp4`,
        caption: `✅ *YouTube Video Downloaded*\n\n📦 Size: ${sizeMB} MB\n🎬 Quality: Best available (highest)`
      }, { quoted: msg })
      
      // Clean up
      setTimeout(() => {
        try { fs.unlinkSync(result.path) } catch (e) {}
      }, 300000)
      
    } catch (error) {
      console.error('[YTMP4] Error:', error)
      let errMsg = error.message
      if (errMsg.includes('private')) {
        errMsg = 'Video private atau age restricted'
      } else if (errMsg.includes('copyright')) {
        errMsg = 'Video terkena copyright'
      }
      await sock.sendMessage(from, {
        text: `❌ Gagal mengunduh: ${errMsg}`
      }, { quoted: msg })
    }
  }
  
  // TikTok
  if (body.startsWith('.tt ')) {
    const url = body.replace('.tt ', '').trim()
    
    if (!url || !url.match(/tiktok\.com|vm\.tiktok|vt\.tiktok/i)) {
      return sock.sendMessage(from, {
        text: '❌ Berikan URL TikTok yang valid!\n\nContoh: .tt https://vt.tiktok.com/xxxxx'
      }, { quoted: msg })
    }
    
    await sock.sendMessage(from, {
      text: '⏳ Mengunduh TikTok...'
    }, { quoted: msg })
    
    try {
      const result = await downloadTikTok(url)
      const stats = fs.statSync(result.path)
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
      
      if (result.asDocument) {
        await sock.sendMessage(from, {
          document: fs.readFileSync(result.path),
          mimetype: 'video/mp4',
          fileName: `tiktok_${Date.now()}.mp4`,
          caption: `✅ *TikTok Downloaded*\n\n📦 Size: ${sizeMB} MB`
        }, { quoted: msg })
      } else {
        await sock.sendMessage(from, {
          video: fs.readFileSync(result.path),
          caption: `✅ *TikTok Downloaded*\n\n📦 Size: ${sizeMB} MB`
        }, { quoted: msg })
      }
      
      // Clean up
      setTimeout(() => {
        try { fs.unlinkSync(result.path) } catch (e) {}
      }, 300000)
      
    } catch (error) {
      console.error('[TT] Error:', error)
      let errMsg = error.message
      if (errMsg.includes('private')) {
        errMsg = 'Video private atau sudah dihapus'
      } else if (errMsg.includes('not found')) {
        errMsg = 'Video tidak ditemukan'
      }
      await sock.sendMessage(from, {
        text: `❌ Gagal mengunduh: ${errMsg}`
      }, { quoted: msg })
    }
  }
  
  // Instagram
  if (body.startsWith('.ig ')) {
    const url = body.replace('.ig ', '').trim()
    
    if (!url || !url.match(/instagram\.com/i)) {
      return sock.sendMessage(from, {
        text: '❌ Berikan URL Instagram yang valid!\n\nContoh: .ig https://instagram.com/p/xxxxx'
      }, { quoted: msg })
    }
    
    await sock.sendMessage(from, {
      text: '⏳ Mengunduh dari Instagram...'
    }, { quoted: msg })
    
    try {
      const result = await downloadInstagram(url)
      const stats = fs.statSync(result.path)
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
      
      // Detect if image or video
      const isImage = result.path.match(/\.(jpg|jpeg|png|webp)$/i)
      
      if (result.asDocument) {
        await sock.sendMessage(from, {
          document: fs.readFileSync(result.path),
          mimetype: isImage ? 'image/jpeg' : 'video/mp4',
          fileName: `instagram_${Date.now()}.${isImage ? 'jpg' : 'mp4'}`,
          caption: `✅ *Instagram Downloaded*\n\n📦 Size: ${sizeMB} MB`
        }, { quoted: msg })
      } else if (isImage) {
        await sock.sendMessage(from, {
          image: fs.readFileSync(result.path),
          caption: `✅ *Instagram Downloaded*\n\n📦 Size: ${sizeMB} MB`
        }, { quoted: msg })
      } else {
        await sock.sendMessage(from, {
          video: fs.readFileSync(result.path),
          caption: `✅ *Instagram Downloaded*\n\n📦 Size: ${sizeMB} MB`
        }, { quoted: msg })
      }
      
      // Clean up
      setTimeout(() => {
        try { fs.unlinkSync(result.path) } catch (e) {}
      }, 300000)
      
    } catch (error) {
      console.error('[IG] Error:', error)
      let errMsg = error.message
      if (errMsg.includes('private')) {
        errMsg = 'Akun private atau post tidak bisa diakses'
      } else if (errMsg.includes('not found')) {
        errMsg = 'Post tidak ditemukan atau sudah dihapus'
      } else if (errMsg.includes('story')) {
        errMsg = 'Story tidak bisa diunduh (gunakan link post/reels)'
      } else if (errMsg.includes('unavailable')) {
        errMsg = 'Konten tidak tersedia'
      }
      await sock.sendMessage(from, {
        text: `❌ Gagal mengunduh: ${errMsg}`
      }, { quoted: msg })
    }
  }
}

module.exports = handleCommand
