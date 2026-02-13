const themes = {
  classic: {
    name: 'Classic',
    bg: '#8FBC8F',
    grid: '#2E8B57',
    snake: '#8B4513',
    ladder: '#DEB887',
    text: '#000000',
    head: '#654321'
  },
  neon: {
    name: 'Neon Night',
    bg: '#0a0a0a',
    grid: '#333333',
    snake: '#ff00ff',
    ladder: '#00ffff',
    text: '#ffffff',
    head: '#ff66ff'
  },
  forest: {
    name: 'Forest',
    bg: '#228B22',
    grid: '#006400',
    snake: '#4B0082',
    ladder: '#8B4513',
    text: '#ffffff',
    head: '#2F004F'
  },
  ice: {
    name: 'Ice Kingdom',
    bg: '#E0FFFF',
    grid: '#4682B4',
    snake: '#191970',
    ladder: '#B0E0E6',
    text: '#000080',
    head: '#000080'
  },
  volcano: {
    name: 'Volcano',
    bg: '#2F4F4F',
    grid: '#696969',
    snake: '#FF4500',
    ladder: '#FFD700',
    text: '#ffffff',
    head: '#FF6347'
  },
  candy: {
    name: 'Candy Land',
    bg: '#FFB6C1',
    grid: '#FF69B4',
    snake: '#8B008B',
    ladder: '#FFD700',
    text: '#4B0082',
    head: '#9400D3'
  }
}

function getRandomTheme() {
  const keys = Object.keys(themes)
  const randomKey = keys[Math.floor(Math.random() * keys.length)]
  return { key: randomKey, ...themes[randomKey] }
}

function getTheme(key) {
  return themes[key] || themes.classic
}

module.exports = {
  themes,
  getRandomTheme,
  getTheme
}