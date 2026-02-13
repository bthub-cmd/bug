const game = require('./game')

const commands = {
  'join': game.join,
  'start': game.start,
  'roll': game.roll,
  'status': game.status,
  'leave': game.leave,
  'help': game.help
}

async function handler(sock, msg, from, sender, body) {
  const parts = body.split(' ')
  const subCmd = parts[1] || 'help'
  
  const cmdFunc = commands[subCmd]
  if (cmdFunc) {
    return cmdFunc(sock, msg, from, sender, body)
  }
  
  return game.help(sock, msg, from)
}

module.exports = { handler }