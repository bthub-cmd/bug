const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')
const qrcode = require('qrcode-terminal')
const configManager = require('./utils/config')
const handleCommand = require('./commands/index')
const { cleanCache, formatJakartaTime } = require('./utils/helpers')

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false
  })
  
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    
    if (qr) {
      console.log('\n🔷 Scan QR Code di bawah ini:\n')
      qrcode.generate(qr, { small: true })
    }
    
    if (connection === 'close') {
      // Update last disconnect timestamp SEBELUM reconnect
      configManager.saveLastDisconnect()
      
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      
      console.log('❌ Connection closed. Reason:', lastDisconnect?.error?.output?.statusCode)
      console.log('🕐 Disconnected at:', formatJakartaTime())
      
      // Send notification to owner if exists
      const config = configManager.getConfig()
      if (config.OWNER) {
        try {
          await sock.sendMessage(config.OWNER, {
            text: `🔴 *BOT DISCONNECTED*\n\n❌ Connection closed\n🕐 ${formatJakartaTime()}\n\n${shouldReconnect ? '🔄 Reconnecting...' : '🚪 Logged out'}`
          })
        } catch (e) {
          console.log('Cannot send disconnect notification:', e.message)
        }
      }
      
      if (shouldReconnect) {
        console.log('🔄 Reconnecting in 3 seconds...')
        setTimeout(() => connectToWhatsApp(), 3000)
      } else {
        console.log('🚪 Logged out. Please delete auth_info folder and restart.')
      }
    } else if (connection === 'open') {
      console.log('✅ Bot connected successfully!')
      console.log('🤖 Bot is ready to receive messages')
      console.log('🕐 Connected at:', formatJakartaTime())
      
      const config = configManager.getConfig()
      if (config.OWNER) {
        await sock.sendMessage(config.OWNER, {
          text: `🟢 *BOT ONLINE*\n\n✅ Bot berhasil terhubung!\n🕐 ${formatJakartaTime()}`
        })
      }
    }
  })
  
  sock.ev.on('creds.update', saveCreds)
  
  const startTime = Date.now()
  
  // Auto cleanup cache setiap 10 menit
  setInterval(() => {
    console.log('🧹 Running auto cache cleanup...')
    console.log('🕐 Time:', formatJakartaTime())
    cleanCache(sock)
  }, 10 * 60 * 1000) // 10 minutes
  
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    
    // Ignore if no message or from bot itself
    if (!msg.message || msg.key.fromMe) return
    
    const from = msg.key.remoteJid
    const sender = msg.key.participant || msg.key.remoteJid
    const body = msg.message.conversation || 
                 msg.message.extendedTextMessage?.text || 
                 msg.message.imageMessage?.caption || 
                 msg.message.videoMessage?.caption || ''
    
    // Log incoming message
    const senderName = msg.pushName || 'Unknown'
    const chatType = from.endsWith('@g.us') ? 'Group' : 'Private'
    const timestamp = formatJakartaTime(msg.messageTimestamp * 1000, 'short')
    console.log(`📨 [${chatType}] ${senderName} (${timestamp}): ${body.substring(0, 50)}${body.length > 50 ? '...' : ''}`)
    
    // Handle commands (starts with .)
    if (body.startsWith('.')) {
      try {
        await handleCommand(sock, msg, from, sender, body, startTime)
      } catch (error) {
        console.error('❌ Error handling command:', error)
        console.error('🕐 Time:', formatJakartaTime())
        await sock.sendMessage(from, {
          text: '❌ Terjadi error saat memproses command. Silakan coba lagi.'
        }, { quoted: msg })
      }
    }
  })
  
  return sock
}

// Load config and start bot
console.log('═══════════════════════════')
console.log('🚀 Starting WhatsApp Bot...')
console.log('📂 Loading configuration...')
configManager.loadConfig()

const config = configManager.getConfig()
console.log(`🤖 Bot Name: ${config.BOT_NAME}`)
console.log(`🔑 Claim Code: ${config.CLAIM_CODE}`)
console.log(`👤 Owner: ${config.OWNER || 'Not claimed yet'}`)
console.log(`🕐 Start Time: ${formatJakartaTime()}`)
console.log('═══════════════════════════')

connectToWhatsApp().catch(err => {
  console.error('❌ Fatal error:', err)
  console.error('🕐 Time:', formatJakartaTime())
  process.exit(1)
})

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down bot...')
  console.log('🕐 Time:', formatJakartaTime())
  process.exit(0)
})

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err)
  console.error('🕐 Time:', formatJakartaTime())
})

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err)
  console.error('🕐 Time:', formatJakartaTime())
})
