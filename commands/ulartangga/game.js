const state = require('./state')
const board = require('./board')
const dice = require('./dice')
const themes = require('./themes')

async function help(sock, msg, from) {
  return sock.sendMessage(from, {
    text: `🎲 ULAR TANGGA

📋 Command:
• .ut join   → Gabung game
• .ut start  → Mulai game (min 2 pemain)
• .ut roll   → Lempar dadu
• .ut status → Cek posisi
• .ut leave  → Keluar game

🎮 Rules:
• Bounce rule: lewat 100 = mundur
• Max 4 pemain per game
• Multiple game per grup (antrian)`
  }, { quoted: msg })
}

async function join(sock, msg, from, sender, body) {
  const userName = msg.pushName || 'Player'
  
  // Cek apakah sudah di game aktif
  const existingGame = state.getGame(from, sender)
  if (existingGame) {
    return sock.sendMessage(from, {
      text: `❌ Kamu sudah di game!\n📊 Ketik .ut status untuk cek`
    }, { quoted: msg })
  }
  
  // Cari game yang available
  let game = state.getAvailableGame(from)
  
  // Jika tidak ada, buat baru
  if (!game) {
    game = state.createGame(from, sender)
  }
  
  // Cek max pemain
  if (game.players.length >= 4) {
    // Buat game baru jika penuh
    game = state.createGame(from, sender)
  }
  
  // Tambah pemain
  const playerColor = state.getPlayerColor(game.players.length)
  const playerShape = state.getPlayerShape(game.players.length)
  
  game.players.push({
    id: sender,
    name: userName,
    position: 1,
    color: playerColor,
    shape: playerShape,
    joinedAt: Date.now()
  })
  
  game.lastActivity = Date.now()
  
  const playerList = game.players.map((p, i) => 
    `${i + 1}. ${state.getPlayerColor(i).name} ${p.name}`
  ).join('\n')
  
  return sock.sendMessage(from, {
    text: `🎲 ULAR TANGGA

✅ @${sender.split('@')[0]} bergabung!
👥 Pemain: ${game.players.length}/4

${playerList}

${game.players.length >= 2 ? '📌 Ketik .ut start untuk mulai' : '⏳ Menunggu pemain lain...'}`,
    mentions: [sender]
  }, { quoted: msg })
}

async function start(sock, msg, from, sender, body) {
  const game = state.getGame(from, sender)
  
  if (!game) {
    return sock.sendMessage(from, {
      text: `❌ Kamu belum bergabung!\n📌 Ketik .ut join dulu`
    }, { quoted: msg })
  }
  
  if (game.status === 'playing') {
    return sock.sendMessage(from, {
      text: `❌ Game sudah dimulai!\n📊 Ketik .ut status`
    }, { quoted: msg })
  }
  
  if (game.players.length < 2) {
    return sock.sendMessage(from, {
      text: `❌ Minimal 2 pemain!\n👥 Saat ini: ${game.players.length}/4\n⏳ Tunggu pemain lain`
    }, { quoted: msg })
  }
  
  game.status = 'playing'
  game.lastActivity = Date.now()
  
  const playerList = game.players.map((p, i) => 
    `${i + 1}. ${state.getPlayerColor(i).name} ${p.name} (pos: 1)`
  ).join('\n')
  
  await sock.sendMessage(from, {
    text: `🎮 GAME DIMULAI!

🎲 Mode: ${game.boardSize}×${game.boardSize} (${game.boardSize * game.boardSize} kotak)
🎨 Tema: ${game.theme.name}
🐍 Ular: ${game.snakes.length} | 🪜 Tangga: ${game.ladders.length}

👥 Urutan main:
${playerList}

🎯 Giliran: @${game.players[0].id.split('@')[0]}
📌 Ketik .ut roll untuk lempar dadu`,
    mentions: [game.players[0].id]
  }, { quoted: msg })
  
  // Kirim papan awal
  const boardImage = await board.generateBoard(game)
  await sock.sendMessage(from, { image: boardImage })
}

async function roll(sock, msg, from, sender, body) {
  const game = state.getGame(from, sender)
  
  if (!game) {
    return sock.sendMessage(from, {
      text: `❌ Kamu tidak di game aktif!\n📌 Ketik .ut join`
    }, { quoted: msg })
  }
  
  if (game.status !== 'playing') {
    return sock.sendMessage(from, {
      text: `⏳ Game belum dimulai!\n📌 Tunggu .ut start`
    }, { quoted: msg })
  }
  
  const currentPlayer = game.players[game.turnIndex]
  if (currentPlayer.id !== sender) {
    return sock.sendMessage(from, {
      text: `⏳ Bukan giliranmu!\n🎯 Sekarang: @${currentPlayer.id.split('@')[0]}`,
      mentions: [currentPlayer.id]
    }, { quoted: msg })
  }
  
  // Roll dadu
  const diceResult = Math.floor(Math.random() * 6) + 1
  
  await sock.sendMessage(from, {
    text: `🎲 @${sender.split('@')[0]} melempar dadu...`,
    mentions: [sender]
  }, { quoted: msg })
  
  // Kirim sticker dadu
  await dice.sendDice(sock, from, diceResult)
  
  // Calculate move
  let newPosition = currentPlayer.position + diceResult
  let bounce = false
  
  // Bounce rule
  const maxPos = game.boardSize * game.boardSize
  if (newPosition > maxPos) {
    bounce = true
    newPosition = maxPos - (newPosition - maxPos)
  }
  
  const oldPosition = currentPlayer.position
  currentPlayer.position = newPosition
  
  // Check snakes
  const snake = game.snakes.find(s => s.from === newPosition)
  if (snake) {
    currentPlayer.position = snake.to
  }
  
  // Check ladders
  const ladder = game.ladders.find(l => l.from === newPosition)
  if (ladder) {
    currentPlayer.position = ladder.to
  }
  
  game.lastActivity = Date.now()
  
  // Build result message
  let resultText = `🎲 Hasil: ${diceResult}\n`
  resultText += `➡️ @${sender.split('@')[0]}: ${oldPosition} → ${newPosition}`
  
  if (bounce) {
    resultText += `\n⚡ Bounce! Mundur ke ${newPosition}`
  }
  
  if (snake) {
    resultText += `\n🐍 ULAR! Turun ke ${snake.to}`
  }
  
  if (ladder) {
    resultText += `\n🪜 TANGGA! Naik ke ${ladder.to}`
  }
  
  // Check win
  if (currentPlayer.position === maxPos) {
    game.status = 'finished'
    game.winner = currentPlayer.id
    
    const finalScores = game.players
      .sort((a, b) => b.position - a.position)
      .map((p, i) => {
        const medal = ['🥇', '🥈', '🥉', '4️⃣'][i]
        return `${medal} ${p.name}: ${p.position}`
      })
      .join('\n')
    
    resultText += `\n\n🏆 @${sender.split('@')[0]} MENANG!`
    
    await sock.sendMessage(from, {
      text: resultText,
      mentions: [sender]
    }, { quoted: msg })
    
    // Kirim papan final
    const boardImage = await board.generateBoard(game)
    await sock.sendMessage(from, { image: boardImage })
    
    return sock.sendMessage(from, {
      text: `📊 Final Score:\n${finalScores}\n\n🎮 Game selesai!\n📌 Ketik .ut join untuk main lagi`
    })
  }
  
  // Next turn
  game.turnIndex = (game.turnIndex + 1) % game.players.length
  const nextPlayer = game.players[game.turnIndex]
  
  resultText += `\n\n🎯 Giliran: @${nextPlayer.id.split('@')[0]}`
  
  await sock.sendMessage(from, {
    text: resultText,
    mentions: [sender, nextPlayer.id]
  }, { quoted: msg })
  
  // Kirim papan update
  const boardImage = await board.generateBoard(game)
  await sock.sendMessage(from, { image: boardImage })
}

async function status(sock, msg, from, sender, body) {
  const game = state.getGame(from, sender)
  
  if (!game) {
    // Show all games in group
    const groupGames = state.games.get(from)
    if (!groupGames || groupGames.games.length === 0) {
      return sock.sendMessage(from, {
        text: `📊 Tidak ada game aktif di grup ini\n📌 Ketik .ut join untuk mulai`
      }, { quoted: msg })
    }
    
    let text = `📊 GAME DI GRUP INI\n\n`
    groupGames.games.forEach((g, i) => {
      if (g.status !== 'finished') {
        text += `🎮 Game ${i + 1}: ${g.players.length}/4 (${g.status})\n`
        text += `   Tema: ${g.theme.name} | Size: ${g.boardSize}×${g.boardSize}\n`
        text += `   Pemain: ${g.players.map(p => p.name).join(', ')}\n\n`
      }
    })
    
    return sock.sendMessage(from, { text }, { quoted: msg })
  }
  
  const playerList = game.players.map((p, i) => {
    const color = state.getPlayerColor(i)
    const isTurn = i === game.turnIndex ? '🎯 ' : ''
    return `${isTurn}${color.name} ${p.name}: ${p.position}`
  }).join('\n')
  
  const currentPlayer = game.players[game.turnIndex]
  
  return sock.sendMessage(from, {
    text: `📊 STATUS GAME

🎲 Mode: ${game.boardSize}×${game.boardSize} | Tema: ${game.theme.name}
⏱️ Status: ${game.status}

👥 Posisi:
${playerList}

🐍 Ular: ${game.snakes.length} | 🪜 Tangga: ${game.ladders.length}
${game.status === 'playing' ? `🎯 Giliran: @${currentPlayer.id.split('@')[0]}` : ''}`,
    mentions: game.status === 'playing' ? [currentPlayer.id] : []
  }, { quoted: msg })
}

async function leave(sock, msg, from, sender, body) {
  const groupGames = state.games.get(from)
  if (!groupGames) {
    return sock.sendMessage(from, {
      text: `❌ Tidak ada game aktif`
    }, { quoted: msg })
  }
  
  const gameIndex = groupGames.games.findIndex(g => 
    g.players.some(p => p.id === sender) && g.status !== 'finished'
  )
  
  if (gameIndex === -1) {
    return sock.sendMessage(from, {
      text: `❌ Kamu tidak di game aktif`
    }, { quoted: msg })
  }
  
  const game = groupGames.games[gameIndex]
  const playerIndex = game.players.findIndex(p => p.id === sender)
  const playerName = game.players[playerIndex].name
  
  // Remove player
  game.players.splice(playerIndex, 1)
  
  // Adjust turn index
  if (game.turnIndex >= game.players.length) {
    game.turnIndex = 0
  }
  
  await sock.sendMessage(from, {
    text: `👋 ${playerName} keluar dari game\n👥 Sisa: ${game.players.length} pemain`
  }, { quoted: msg })
  
  // End game if less than 2 players
  if (game.players.length < 2 && game.status === 'playing') {
    game.status = 'finished'
    
    const finalScores = game.players
      .sort((a, b) => b.position - a.position)
      .map((p, i) => `${i + 1}. ${p.name}: ${p.position}`)
      .join('\n')
    
    await sock.sendMessage(from, {
      text: `⚠️ Game dihentikan! Pemain tidak cukup\n\n📊 Final:\n${finalScores}`
    })
    
    // Remove game
    groupGames.games.splice(gameIndex, 1)
    return
  }
  
  // If waiting and creator leaves, remove game
  if (game.status === 'waiting' && game.players.length === 0) {
    groupGames.games.splice(gameIndex, 1)
    return sock.sendMessage(from, {
      text: `🗑️ Game dibatalkan (tidak ada pemain)`
    }, { quoted: msg })
  }
  
  // Continue game
  if (game.status === 'playing') {
    const nextPlayer = game.players[game.turnIndex]
    await sock.sendMessage(from, {
      text: `🔄 Game lanjut!\n🎯 Giliran: @${nextPlayer.id.split('@')[0]}`,
      mentions: [nextPlayer.id]
    }, { quoted: msg })
    
    const boardImage = await board.generateBoard(game)
    await sock.sendMessage(from, { image: boardImage })
  }
}

module.exports = {
  help,
  join,
  start,
  roll,
  status,
  leave
}