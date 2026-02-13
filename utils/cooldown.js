const cooldowns = new Map()
const COOLDOWN_TIME = 10000

function checkCooldown(userId, command) {
  const key = `${userId}_${command}`
  const now = Date.now()
  
  if (cooldowns.has(key)) {
    const expirationTime = cooldowns.get(key) + COOLDOWN_TIME
    if (now < expirationTime) {
      const timeLeft = Math.ceil((expirationTime - now) / 1000)
      return { onCooldown: true, timeLeft }
    }
  }
  
  cooldowns.set(key, now)
  return { onCooldown: false }
}

module.exports = { checkCooldown }