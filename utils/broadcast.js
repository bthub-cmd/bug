const configManager = require('./config')
const { formatJakartaTime } = require('./helpers')

async function manualBroadcast(sock, version, changelog) {
  try {
    const groups = await sock.groupFetchAllParticipating()
    const groupIds = Object.keys(groups)
    
    let successCount = 0
    
    const message = `🔔 *BOT UPDATE NOTIFICATION*

📌 Version: ${version}

📝 Changelog:
${changelog || 'No changelog available'}

═══════════════════
Terima kasih telah menggunakan bot ini! 🙏`

    for (const groupId of groupIds) {
      try {
        await sock.sendMessage(groupId, { text: message })
        successCount++
        
        // Delay untuk menghindari spam
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`Failed to send to group ${groupId}:`, error.message)
      }
    }
    
    // Tandai versi sudah di-broadcast
    configManager.addBroadcastedVersion(version)
    
    return { count: successCount, total: groupIds.length }
  } catch (error) {
    console.error('Broadcast error:', error)
    throw error
  }
}

async function autoBroadcast(sock, version, changelog) {
  // Cek apakah versi ini sudah pernah di-broadcast
  if (configManager.isVersionBroadcasted(version)) {
    console.log(`Version ${version} already broadcasted, skipping...`)
    return { skipped: true, version }
  }
  
  return manualBroadcast(sock, version, changelog)
}

module.exports = {
  manualBroadcast,
  autoBroadcast
}
