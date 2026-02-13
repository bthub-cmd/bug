const fs = require('fs')
const path = require('path')

async function sendDice(sock, from, number) {
  const dicePath = path.join(__dirname, '../../assets/dice', `dice${number}.webp`)
  
  if (!fs.existsSync(dicePath)) {
    // Fallback: kirim angka teks jika file tidak ada
    return sock.sendMessage(from, {
      text: `🎲 Dadu: ${number}`
    })
  }
  
  const diceBuffer = fs.readFileSync(dicePath)
  return sock.sendMessage(from, {
    sticker: diceBuffer
  })
}

module.exports = { sendDice }