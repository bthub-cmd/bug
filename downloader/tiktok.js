const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

async function downloadTikTok(url) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, 'python', 'tt_download.py')
    const cacheDir = path.resolve(__dirname, '..', 'cache')
    
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
        const err = errorOutput.toLowerCase()
        if (err.includes('private')) reject(new Error('private'))
        else if (err.includes('not found')) reject(new Error('not found'))
        else reject(new Error(errorOutput || 'Download failed'))
        return
      }
      
      const result = output.trim()
      
      if (result.startsWith('TOOBIG:')) {
        const filePath = result.replace('TOOBIG:', '')
        if (fs.existsSync(filePath)) {
          resolve({ path: filePath, asDocument: true })
        } else {
          reject(new Error('File not found'))
        }
      } else if (fs.existsSync(result)) {
        resolve({ path: result, asDocument: false })
      } else {
        // Find latest tt_ file
        try {
          const files = fs.readdirSync(cacheDir)
          const ttFiles = files
            .filter(f => f.startsWith('tt_') && (f.endsWith('.mp4') || f.endsWith('.webm')))
            .map(f => ({ path: path.join(cacheDir, f), time: fs.statSync(path.join(cacheDir, f)).mtime }))
            .sort((a, b) => b.time - a.time)
          
          if (ttFiles.length > 0) {
            resolve({ path: ttFiles[0].path, asDocument: false })
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

module.exports = { downloadTikTok }
