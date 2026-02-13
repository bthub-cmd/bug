const games = new Map() // groupId -> { games: [] }

function getGame(groupId, userId) {
  const groupGames = games.get(groupId)
  if (!groupGames) return null
  
  return groupGames.games.find(g => 
    g.players.some(p => p.id === userId) && g.status !== 'finished'
  )
}

function getAvailableGame(groupId) {
  const groupGames = games.get(groupId)
  if (!groupGames) return null
  
  return groupGames.games.find(g => 
    g.status === 'waiting' && g.players.length < 4
  )
}

function createGame(groupId, creator) {
  if (!games.has(groupId)) {
    games.set(groupId, { games: [] })
  }
  
  const themes = require('./themes')
  const sizes = [8, 10, 12]
  
  const newGame = {
    id: Date.now().toString(),
    groupId,
    status: 'waiting',
    theme: themes.getRandomTheme(),
    boardSize: sizes[Math.floor(Math.random() * sizes.length)],
    snakes: [],
    ladders: [],
    players: [],
    turnIndex: 0,
    winner: null,
    createdAt: Date.now(),
    lastActivity: Date.now()
  }
  
  // Generate snakes and ladders
  const { snakes, ladders } = generateSnakesAndLadders(newGame.boardSize)
  newGame.snakes = snakes
  newGame.ladders = ladders
  
  games.get(groupId).games.push(newGame)
  return newGame
}

function generateSnakesAndLadders(size) {
  const totalCells = size * size
  const count = Math.floor(totalCells / 12)
  const snakes = []
  const ladders = []
  const used = new Set([1, totalCells])
  
  // Generate ladders (naik)
  for (let i = 0; i < count; i++) {
    let from, to
    do {
      from = Math.floor(Math.random() * (totalCells - 20)) + 2
      to = from + Math.floor(Math.random() * 15) + 5
    } while (used.has(from) || used.has(to) || to > totalCells)
    
    used.add(from)
    used.add(to)
    ladders.push({ from, to })
  }
  
  // Generate snakes (turun)
  for (let i = 0; i < count; i++) {
    let from, to
    do {
      from = Math.floor(Math.random() * (totalCells - 20)) + 20
      to = from - Math.floor(Math.random() * 15) - 5
    } while (used.has(from) || used.has(to) || to < 1)
    
    used.add(from)
    used.add(to)
    snakes.push({ from, to })
  }
  
  return { snakes, ladders }
}

function getPlayerColor(index) {
  const colors = [
    { name: '🔴', hex: '#FF5733', bg: '#FFCCCB' },
    { name: '🟢', hex: '#33FF57', bg: '#CCFFCC' },
    { name: '🔵', hex: '#3357FF', bg: '#CCCCFF' },
    { name: '🟡', hex: '#FFFF33', bg: '#FFFFCC' }
  ]
  return colors[index % colors.length]
}

function getPlayerShape(index) {
  const shapes = ['circle', 'square', 'star', 'triangle']
  return shapes[index % shapes.length]
}

module.exports = {
  getGame,
  getAvailableGame,
  createGame,
  getPlayerColor,
  getPlayerShape,
  games
}