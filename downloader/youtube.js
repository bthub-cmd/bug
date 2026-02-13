const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

async function downloadYouTube(url) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, 'python', 'yt_download.py')
    const cacheDir = path.resolve(__dirname, '..', 'cache')
    
    // Ensure cache dir
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true })
    }
    
    const python = spawn('python3', [scriptPath, url])
    
    let output = ''
    let errorOutput = ''
    
    python.stdout.on('data', (data) => {
      output += data.toString().trim()
    })
    
    python.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })
    
    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(errorOutput || 'Download failed'))
        return
      }
      
      const filePath = output.trim()
      
      // Verify file exists
      if (fs.existsSync(filePath)) {
        resolve(filePath)
      } else {
        // Last resort: find latest yt_ file in cache
        try {
          const files = fs.readdirSync(cacheDir)
          const ytFiles = files
            .filter(f => f.startsWith('yt_') && (f.endsWith('.mp3') || f.endsWith('.m4a')))
            .map(f => ({
              name: f,
              path: path.join(cacheDir, f),
              time: fs.statSync(path.join(cacheDir, f)).mtime
            }))
            .sort((a, b) => b.time - a.time)
          
          if (ytFiles.length > 0) {
            resolve(ytFiles[0].path)
            return
          }
        } catch (e) {}
        
        reject(new Error(`File not found: ${filePath}`))
      }
    })
    
    python.on('error', (err) => {
      reject(new Error(`Python error: ${err.message}`))
    })
    
    // Timeout 3 menit
    setTimeout(() => {
      python.kill()
      reject(new Error('Download timeout (3 minutes)'))
    }, 180000)
  })
}

async function downloadYouTubeVideo(url) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, 'python', 'yt_download_video.py')
    const cacheDir = path.resolve(__dirname, '..', 'cache')
    
    // Ensure cache dir
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true })
    }
    
    const python = spawn('python3', [scriptPath, url])
    
    let output = ''
    let errorOutput = ''
    
    python.stdout.on('data', (data) => {
      output += data.toString().trim()
    })
    
    python.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })
    
    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(errorOutput || 'Download failed'))
        return
      }
      
      const result = output.trim()
      
      // Parse: DOCUMENT:filepath:title
      if (result.startsWith('DOCUMENT:')) {
        const parts = result.split(':')
        const filePath = parts[1]
        const title = parts.slice(2).join(':') || 'video'
        
        if (fs.existsSync(filePath)) {
          resolve({ path: filePath, asDocument: true, title })
        } else {
          reject(new Error('File not found'))
        }
      } else if (fs.existsSync(result)) {
        // Fallback old format
        resolve({ path: result, asDocument: true, title: 'video' })
      } else {
        // Find latest ytvid_ file
        try {
          const files = fs.readdirSync(cacheDir)
          const ytFiles = files
            .filter(f => f.startsWith('ytvid_') && (f.endsWith('.mp4') || f.endsWith('.webm')))
            .map(f => ({ path: path.join(cacheDir, f), time: fs.statSync(path.join(cacheDir, f)).mtime }))
            .sort((a, b) => b.time - a.time)
          
          if (ytFiles.length > 0) {
            resolve({ path: ytFiles[0].path, asDocument: true, title: 'video' })
            return
          }
        } catch (e) {}
        reject(new Error('File not found'))
      }
    })
    
    python.on('error', (err) => reject(new Error(err.message)))
    setTimeout(() => { python.kill(); reject(new Error('Timeout')) }, 180000)
  })
}

module.exports = { downloadYouTube, downloadYouTubeVideo }
