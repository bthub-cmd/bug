const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

async function downloadInstagram(url) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, 'python', 'ig_download.py')
    const cacheDir = path.resolve(__dirname, '..', 'cache')
    
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true })
    }
    
    console.log('[IG] Downloading:', url)
    
    const python = spawn('python3', [scriptPath, url], {
      cwd: process.cwd(),
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    })
    
    let output = ''
    let errorOutput = ''
    
    python.stdout.on('data', (data) => {
      const text = data.toString()
      output += text
      console.log('[IG] stdout:', text.trim())
    })
    
    python.stderr.on('data', (data) => {
      const text = data.toString()
      errorOutput += text
      console.log('[IG] stderr:', text.trim())
    })
    
    python.on('close', (code) => {
      console.log('[IG] Exit code:', code)
      
      if (code !== 0) {
        const errorMsg = errorOutput.toLowerCase()
        
        if (errorMsg.includes('private') || errorMsg.includes('login') || errorMsg.includes('403')) {
          reject(new Error('private'))
        } else if (errorMsg.includes('not found') || errorMsg.includes('404')) {
          reject(new Error('not found'))
        } else if (errorMsg.includes('story') || errorMsg.includes('highlight')) {
          reject(new Error('story'))
        } else if (errorMsg.includes('unavailable')) {
          reject(new Error('unavailable'))
        } else {
          reject(new Error(errorOutput || 'Download failed'))
        }
        return
      }
      
      const result = output.trim()
      console.log('[IG] Result:', result)
      
      if (result.startsWith('TOOBIG:')) {
        const filePath = result.replace('TOOBIG:', '')
        if (!fs.existsSync(filePath)) {
          reject(new Error('File not found after TOOBIG'))
          return
        }
        resolve({ path: filePath, asDocument: true })
      } else if (result && fs.existsSync(result)) {
        resolve({ path: result, asDocument: false })
      } else {
        // Find latest ig_ file
        try {
          const files = fs.readdirSync(cacheDir)
          const igFiles = files
            .filter(f => f.startsWith('ig_'))
            .map(f => ({
              name: f,
              path: path.join(cacheDir, f),
              time: fs.statSync(path.join(cacheDir, f)).mtime
            }))
            .sort((a, b) => b.time - a.time)
          
          if (igFiles.length > 0) {
            console.log('[IG] Using latest file:', igFiles[0].name)
            resolve({ path: igFiles[0].path, asDocument: false })
            return
          }
        } catch (e) {
          console.error('[IG] Error finding file:', e)
        }
        reject(new Error('File not found: ' + result))
      }
    })
    
    python.on('error', (err) => {
      console.error('[IG] Python error:', err)
      reject(new Error(`Failed to start Python: ${err.message}`))
    })
    
    // Timeout 2 minutes
    setTimeout(() => {
      python.kill()
      reject(new Error('Download timeout (2 minutes)'))
    }, 120000)
  })
}

module.exports = { downloadInstagram }
