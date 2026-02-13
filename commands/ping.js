const { formatTime, getUptime, formatJakartaTime, getSystemInfo, formatBytes, getDiskUsage } = require('../utils/helpers')
const configManager = require('../utils/config')

async function handle(sock, msg, from, startTime) {
  const start = Date.now()
  
  const uptime = getUptime(startTime)
  const config = configManager.getConfig()
  const lastDisconnect = formatTime(config.LAST_DISCONNECT)
  
  // Get system info
  const sysInfo = getSystemInfo()
  const diskInfo = getDiskUsage()
  
  // Calculate response delay
  const delay = Date.now() - start
  
  let responseText = `🏓 *PONG!*\n\n`
  responseText += `🟢 Status: Online\n`
  responseText += `⏱️ Response: ${delay}ms\n`
  responseText += `🔌 Uptime: ${uptime}\n`
  responseText += `📅 Last Disconnect: ${lastDisconnect}\n\n`
  
  responseText += `━━━━━━━━━━━━━━━━\n`
  responseText += `💻 *SYSTEM INFO*\n\n`
  
  // CPU Info
  responseText += `🔧 CPU:\n`
  responseText += `   • Cores: ${sysInfo.cpu.cores}\n`
  responseText += `   • Usage: ${sysInfo.cpu.usage}%\n`
  responseText += `   • Speed: ${(sysInfo.cpu.speed / 1000).toFixed(2)} GHz\n\n`
  
  // RAM Info
  responseText += `🎯 RAM:\n`
  responseText += `   • Used: ${formatBytes(sysInfo.memory.used)}\n`
  responseText += `   • Total: ${formatBytes(sysInfo.memory.total)}\n`
  responseText += `   • Usage: ${sysInfo.memory.percentage}%\n\n`
  
  // Disk Info
  responseText += `💾 Storage:\n`
  responseText += `   • Used: ${diskInfo.used} / ${diskInfo.total}\n`
  responseText += `   • Available: ${diskInfo.available}\n`
  responseText += `   • Usage: ${diskInfo.percentage}\n\n`
  
  responseText += `━━━━━━━━━━━━━━━━\n`
  responseText += `🕐 ${formatJakartaTime()}`

  return sock.sendMessage(from, {
    text: responseText
  }, { quoted: msg })
}

module.exports = { handle }
