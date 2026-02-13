const fs = require('fs')
const path = require('path')
const os = require('os')

function getJakartaTime(timestamp = null) {
  const date = timestamp ? new Date(timestamp) : new Date()
  
  // Convert to WIB (GMT+7)
  const jakartaOffset = 7 * 60 * 60 * 1000 // 7 hours in milliseconds
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000)
  const jakartaTime = new Date(utc + jakartaOffset)
  
  return jakartaTime
}

function formatJakartaTime(timestamp = null, format = 'full') {
  const jakartaTime = getJakartaTime(timestamp)
  
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  
  const dayName = days[jakartaTime.getDay()]
  const date = jakartaTime.getDate().toString().padStart(2, '0')
  const month = months[jakartaTime.getMonth()]
  const year = jakartaTime.getFullYear()
  const hours = jakartaTime.getHours().toString().padStart(2, '0')
  const minutes = jakartaTime.getMinutes().toString().padStart(2, '0')
  const seconds = jakartaTime.getSeconds().toString().padStart(2, '0')
  
  if (format === 'full') {
    return `${dayName}, ${date} ${month} ${year} ${hours}:${minutes}:${seconds} WIB`
  } else if (format === 'date') {
    return `${dayName}, ${date} ${month} ${year}`
  } else if (format === 'time') {
    return `${hours}:${minutes}:${seconds} WIB`
  } else if (format === 'short') {
    return `${date}/${jakartaTime.getMonth() + 1}/${year} ${hours}:${minutes} WIB`
  }
  
  return `${dayName}, ${date} ${month} ${year} ${hours}:${minutes}:${seconds} WIB`
}

function getSystemInfo() {
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem
  
  const cpus = os.cpus()
  const cpuModel = cpus[0].model
  const cpuSpeed = cpus[0].speed
  const cpuCores = cpus.length
  
  // Calculate CPU usage
  let totalIdle = 0
  let totalTick = 0
  
  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type]
    }
    totalIdle += cpu.times.idle
  })
  
  const idle = totalIdle / cpus.length
  const total = totalTick / cpus.length
  const usage = 100 - ~~(100 * idle / total)
  
  return {
    cpu: {
      model: cpuModel,
      cores: cpuCores,
      speed: cpuSpeed,
      usage: usage
    },
    memory: {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      percentage: ((usedMem / totalMem) * 100).toFixed(2)
    },
    platform: os.platform(),
    uptime: os.uptime()
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getDiskUsage() {
  try {
    const { execSync } = require('child_process')
    const diskInfo = execSync('df -h /').toString().split('\n')[1].split(/\s+/)
    
    return {
      total: diskInfo[1],
      used: diskInfo[2],
      available: diskInfo[3],
      percentage: diskInfo[4]
    }
  } catch (err) {
    return {
      total: 'N/A',
      used: 'N/A',
      available: 'N/A',
      percentage: 'N/A'
    }
  }
}

function ensureCacheDir() {
  const cacheDir = './cache'
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true })
  }
}

function cleanCache(sock) {
  try {
    const cacheDir = './cache'
    if (!fs.existsSync(cacheDir)) {
      return { cleaned: 0, size: 0 }
    }

    const files = fs.readdirSync(cacheDir)
    let totalSize = 0
    let cleanedFiles = 0

    files.forEach(file => {
      const filePath = path.join(cacheDir, file)
      const stats = fs.statSync(filePath)
      
      totalSize += stats.size
      fs.unlinkSync(filePath)
      cleanedFiles++
    })

    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2)
    const config = require('./config').getConfig()

    if (config.OWNER && cleanedFiles > 0) {
      sock.sendMessage(config.OWNER, {
        text: `🧹 *CACHE CLEANUP REPORT*\n\n✅ Berhasil membersihkan cache\n📁 File dihapus: ${cleanedFiles}\n💾 Ruang dibebaskan: ${sizeMB} MB\n🕐 Waktu: ${formatJakartaTime()}`
      })
    }

    console.log(`[CLEANUP] Cleaned ${cleanedFiles} files, freed ${sizeMB} MB`)
    return { cleaned: cleanedFiles, size: sizeMB }
  } catch (error) {
    console.error('Error cleaning cache:', error)
    return { cleaned: 0, size: 0, error: true }
  }
}

function formatTime(timestamp) {
  if (!timestamp) return 'Tidak pernah'
  
  const now = getJakartaTime()
  const past = getJakartaTime(timestamp)
  const diff = now - past
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days} hari lalu`
  if (hours > 0) return `${hours} jam lalu`
  if (minutes > 0) return `${minutes} menit lalu`
  return `${seconds} detik lalu`
}

function getUptime(startTime) {
  const uptime = Date.now() - startTime
  
  const seconds = Math.floor(uptime / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  const h = hours % 24
  const m = minutes % 60
  const s = seconds % 60
  
  if (days > 0) return `${days}d ${h}h ${m}m ${s}s`
  if (hours > 0) return `${h}h ${m}m ${s}s`
  if (minutes > 0) return `${m}m ${s}s`
  return `${s}s`
}

function parseGassCommand(body) {
  const gassPattern = /^\.gass(\s|$)/i
  return gassPattern.test(body)
}

module.exports = {
  ensureCacheDir,
  cleanCache,
  formatTime,
  getUptime,
  parseGassCommand,
  getJakartaTime,
  formatJakartaTime,
  getSystemInfo,
  formatBytes,
  getDiskUsage
}
