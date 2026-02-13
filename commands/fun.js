const axios = require('axios')

// Truth or Dare
async function truthOrDare(sock, msg, from) {
  const choices = ['truth', 'dare']
  const choice = choices[Math.floor(Math.random() * choices.length)]
  
  const truths = [
    'Siapa crush terakhir kamu?',
    'Apa rahasia yang belum pernah kamu ceritakan ke siapapun?',
    'Kapan terakhir kali kamu berbohong?',
    'Apa hal paling memalukan yang pernah kamu lakukan?',
    'Siapa orang yang paling kamu benci?',
    'Apa mimpi teraneh yang pernah kamu alami?',
    'Berapa kali kamu jatuh cinta?',
    'Apa kebohongan terbesar yang pernah kamu lakukan?'
  ]
  
  const dares = [
    'Posting status embarrassing di media sosial selama 1 jam',
    'Kirim voice note nyanyi lagu anak-anak',
    'Update foto profil dengan muka lucu selama 24 jam',
    'Chat mantan dengan "Halo, apa kabar?"',
    'Minta maaf ke orang yang pernah kamu sakiti',
    'Screenshot chat ini dan post di status',
    'Telepon crush kamu dan bilang kamu suka sama dia',
    'Dance TikTok dan kirim ke grup ini'
  ]
  
  const result = choice === 'truth' 
    ? truths[Math.floor(Math.random() * truths.length)]
    : dares[Math.floor(Math.random() * dares.length)]
  
  await sock.sendMessage(from, {
    text: `🎲 *TRUTH OR DARE*\n\n${choice === 'truth' ? '🤔 TRUTH:' : '⚡ DARE:'}\n${result}`
  }, { quoted: msg })
}

// Cek Jodoh
async function cekJodoh(sock, msg, from, body) {
  const text = body.replace('.cekjodoh ', '').trim()
  const names = text.split('&').map(n => n.trim())
  
  if (names.length !== 2 || !names[0] || !names[1]) {
    return sock.sendMessage(from, {
      text: '❌ Format salah!\n\nContoh: .cekjodoh Budi & Ani'
    }, { quoted: msg })
  }
  
  // Generate percentage based on names
  const seed = names[0].toLowerCase() + names[1].toLowerCase()
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const percentage = (hash % 100) + 1
  
  let status = ''
  let emoji = ''
  
  if (percentage >= 80) {
    status = 'Pasangan Sempurna! 💯'
    emoji = '❤️❤️❤️'
  } else if (percentage >= 60) {
    status = 'Cocok Banget! 😍'
    emoji = '❤️❤️'
  } else if (percentage >= 40) {
    status = 'Lumayan Cocok 😊'
    emoji = '❤️'
  } else if (percentage >= 20) {
    status = 'Kurang Cocok 😐'
    emoji = '💔'
  } else {
    status = 'Tidak Cocok 😢'
    emoji = '💔💔'
  }
  
  await sock.sendMessage(from, {
    text: `💕 *CEK JODOH* 💕\n\n👫 ${names[0]} & ${names[1]}\n\n📊 Kecocokan: ${percentage}%\n${emoji}\n\n${status}`
  }, { quoted: msg })
}

// Random Meme (Indonesia)
async function meme(sock, msg, from) {
  try {
    await sock.sendMessage(from, {
      text: '🎭 Mencari meme...'
    }, { quoted: msg })
    
    const response = await axios.get('https://meme-api.com/gimme/indowibu')
    const data = response.data
    
    await sock.sendMessage(from, {
      image: { url: data.url },
      caption: `🎭 *${data.title}*\n\n👍 ${data.ups} upvotes`
    }, { quoted: msg })
  } catch (err) {
    await sock.sendMessage(from, {
      text: '❌ Gagal mendapatkan meme. Coba lagi!'
    }, { quoted: msg })
  }
}

// Quotes Random
async function quotes(sock, msg, from) {
  const quotesList = [
    { text: 'Kesuksesan adalah kemampuan untuk melewati kegagalan demi kegagalan tanpa kehilangan semangat.', author: 'Winston Churchill' },
    { text: 'Jangan tunda sampai besok apa yang bisa kamu lakukan hari ini.', author: 'Benjamin Franklin' },
    { text: 'Hidup adalah 10% apa yang terjadi padamu dan 90% bagaimana kamu meresponnya.', author: 'Charles R. Swindoll' },
    { text: 'Kesempatan tidak datang dua kali, maka rebut dan manfaatkan sebaik-baiknya.', author: 'Mario Teguh' },
    { text: 'Bermimpilah tentang apa yang ingin kamu impikan, pergilah ke tempat-tempat kamu inginkan.', author: 'Unknown' },
    { text: 'Kegagalan adalah kesempatan untuk memulai lagi dengan lebih cerdik.', author: 'Henry Ford' },
    { text: 'Jangan biarkan apa yang tidak bisa kamu lakukan menghalangi apa yang bisa kamu lakukan.', author: 'John Wooden' },
    { text: 'Sukses bukanlah kunci kebahagiaan. Kebahagiaan adalah kunci sukses.', author: 'Albert Schweitzer' }
  ]
  
  const quote = quotesList[Math.floor(Math.random() * quotesList.length)]
  
  await sock.sendMessage(from, {
    text: `💬 *QUOTE OF THE DAY*\n\n"${quote.text}"\n\n— ${quote.author}`
  }, { quoted: msg })
}

// Tebak Angka
const gameState = new Map()

async function tebakAngka(sock, msg, from, sender, body) {
  const args = body.split(' ')
  
  if (args[1] === 'start') {
    const answer = Math.floor(Math.random() * 100) + 1
    gameState.set(from, { answer, attempts: 0, maxAttempts: 10 })
    
    return sock.sendMessage(from, {
      text: `🎮 *TEBAK ANGKA*\n\n🎲 Aku sudah memikirkan angka antara 1-100\n🎯 Kamu punya 10 kesempatan!\n\n📝 Cara main: .tebak [angka]\nContoh: .tebak 50`
    }, { quoted: msg })
  }
  
  const game = gameState.get(from)
  if (!game) {
    return sock.sendMessage(from, {
      text: '❌ Belum ada game aktif!\n\n📌 Ketik .tebak start untuk mulai'
    }, { quoted: msg })
  }
  
  const guess = parseInt(args[1])
  if (isNaN(guess) || guess < 1 || guess > 100) {
    return sock.sendMessage(from, {
      text: '❌ Angka tidak valid! Masukkan angka 1-100'
    }, { quoted: msg })
  }
  
  game.attempts++
  
  if (guess === game.answer) {
    gameState.delete(from)
    return sock.sendMessage(from, {
      text: `🎉 *SELAMAT!*\n\n✅ Benar! Angkanya adalah ${game.answer}\n🎯 Percobaan: ${game.attempts}/${game.maxAttempts}\n\n🏆 Kamu hebat!`
    }, { quoted: msg })
  }
  
  if (game.attempts >= game.maxAttempts) {
    const answer = game.answer
    gameState.delete(from)
    return sock.sendMessage(from, {
      text: `😢 *GAME OVER!*\n\n❌ Kesempatan habis!\n🎲 Jawabannya: ${answer}\n\n🔄 Ketik .tebak start untuk main lagi`
    }, { quoted: msg })
  }
  
  const hint = guess < game.answer ? 'Terlalu kecil! 📉' : 'Terlalu besar! 📈'
  const remaining = game.maxAttempts - game.attempts
  
  await sock.sendMessage(from, {
    text: `${hint}\n\n🎯 Percobaan: ${game.attempts}/${game.maxAttempts}\n⏳ Sisa: ${remaining} kali`
  }, { quoted: msg })
}

// Kalkulator Cinta
async function kalkulatorCinta(sock, msg, from, body) {
  const text = body.replace('.love ', '').trim()
  const names = text.split('&').map(n => n.trim())
  
  if (names.length !== 2 || !names[0] || !names[1]) {
    return sock.sendMessage(from, {
      text: '❌ Format salah!\n\nContoh: .love Budi & Ani'
    }, { quoted: msg })
  }
  
  const seed = names[0].toLowerCase() + names[1].toLowerCase()
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const percentage = (hash % 100) + 1
  
  const hearts = '❤️'.repeat(Math.floor(percentage / 20))
  const empty = '🤍'.repeat(5 - Math.floor(percentage / 20))
  
  let message = ''
  if (percentage >= 80) message = 'Kalian ditakdirkan bersama! 💑'
  else if (percentage >= 60) message = 'Hubungan yang manis! 🥰'
  else if (percentage >= 40) message = 'Ada peluang! 😊'
  else if (percentage >= 20) message = 'Butuh usaha lebih! 🤔'
  else message = 'Sepertinya tidak cocok... 😔'
  
  await sock.sendMessage(from, {
    text: `💕 *KALKULATOR CINTA* 💕\n\n👤 ${names[0]}\n💗\n👤 ${names[1]}\n\n${hearts}${empty} ${percentage}%\n\n${message}`
  }, { quoted: msg })
}

module.exports = {
  truthOrDare,
  cekJodoh,
  meme,
  quotes,
  tebakAngka,
  kalkulatorCinta
}
