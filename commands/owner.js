const configManager = require('../utils/config')
const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const pino = require('pino')
const sharp = require('sharp')

async function handleCode(sock, msg, from, sender, body) {
  const config = configManager.getConfig()
  if (config.CODE_USED) return

  const input = body.replace('.code ', '').trim().toUpperCase()

  if (input === config.CLAIM_CODE) {
    configManager.setOwner(sender)
    return sock.sendMessage(from, {
      text: '✅ *Berhasil Claim Owner!*\n\nAnda sekarang adalah owner bot ini.\nGunakan .menu untuk melihat semua perintah.'
    }, { quoted: msg })
  } else {
    return sock.sendMessage(from, { text: '❌ Kode salah!' }, { quoted: msg })
  }
}

async function handleSetName(sock, msg, from, sender, body) {
  const config = configManager.getConfig()
  if (sender !== config.OWNER) {
    return sock.sendMessage(from, { text: '❌ Khusus Owner!' }, { quoted: msg })
  }

  configManager.setBotName(body.replace('.setname ', ''))
  return sock.sendMessage(from, {
    text: '✅ Nama bot berhasil diupdate!\n\nGunakan .menu untuk melihat perubahan.'
  }, { quoted: msg })
}

async function handleSetDesc(sock, msg, from, sender, body) {
  const config = configManager.getConfig()
  if (sender !== config.OWNER) {
    return sock.sendMessage(from, { text: '❌ Khusus Owner!' }, { quoted: msg })
  }

  configManager.setBotDesc(body.replace('.setdesc ', ''))
  return sock.sendMessage(from, {
    text: '✅ Deskripsi bot berhasil diupdate!\n\nGunakan .menu untuk melihat perubahan.'
  }, { quoted: msg })
}

async function handleSetBanner(sock, msg, from, sender, quoted) {
  const config = configManager.getConfig()
  if (sender !== config.OWNER) {
    return sock.sendMessage(from, { text: '❌ Khusus Owner!' }, { quoted: msg })
  }

  try {
    const buffer = await downloadMediaMessage(
      { message: quoted },
      'buffer',
      {},
      { reuploadRequest: sock.updateMediaMessage }
    )

    const resized = await sharp(buffer)
      .resize(1920, 1080, { fit: 'cover' })
      .png()
      .toBuffer()

    require('fs').writeFileSync('./banner.png', resized)

    return sock.sendMessage(from, {
      text: '✅ Banner image berhasil diupdate!\n\nGunakan .menu untuk melihat banner baru.'
    }, { quoted: msg })
  } catch {
    return sock.sendMessage(from, { text: '❌ Gagal update banner!' }, { quoted: msg })
  }
}

async function handleBroadcast(sock, msg, from, sender, body) {
  const config = configManager.getConfig()
  if (sender !== config.OWNER) {
    return sock.sendMessage(from, { text: '❌ Khusus Owner!' }, { quoted: msg })
  }

  // Cek apakah file broadcast.js dan version.js ada
  try {
    const { manualBroadcast } = require('../utils/broadcast')
    const { CURRENT_VERSION, CHANGELOG } = require('../version')
    
    const params = body.split(' ')
    const targetVersion = params[1] || CURRENT_VERSION
    
    await sock.sendMessage(from, {
      text: `📡 Broadcasting version ${targetVersion}...`
    }, { quoted: msg })
    
    const result = await manualBroadcast(sock, targetVersion, CHANGELOG)
    
    await sock.sendMessage(from, {
      text: `✅ Broadcast complete!\n📊 Sent to ${result.count} groups`
    }, { quoted: msg })
  } catch (error) {
    return sock.sendMessage(from, {
      text: '❌ Broadcast feature tidak tersedia!\nFile broadcast.js atau version.js tidak ditemukan.'
    }, { quoted: msg })
  }
}

module.exports = {
  handleCode,
  handleSetName,
  handleSetDesc,
  handleSetBanner,
  handleBroadcast
}
