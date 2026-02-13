#!/bin/bash

echo "🚀 Setup Gabut Bot Structure..."

# Root files
touch index.js
touch package.json

# Directories
mkdir -p session cache assets/dice commands/ulartangga utils scripts

# Command files
touch commands/index.js
touch commands/owner.js
touch commands/menu.js
touch commands/ai.js
touch commands/sticker.js
touch commands/toimg.js
touch commands/brat.js
touch commands/ping.js

# Ular Tangga module
touch commands/ulartangga/index.js
touch commands/ulartangga/game.js
touch commands/ulartangga/board.js
touch commands/ulartangga/dice.js
touch commands/ulartangga/themes.js
touch commands/ulartangga/state.js

# Utils
touch utils/canvas.js
touch utils/config.js
touch utils/cooldown.js
touch utils/helpers.js

# Placeholder dice files (Anda ganti dengan WEBP asli)
touch assets/dice/dice1.webp
touch assets/dice/dice2.webp
touch assets/dice/dice3.webp
touch assets/dice/dice4.webp
touch assets/dice/dice5.webp
touch assets/dice/dice6.webp

echo "✅ Structure created!"
echo ""
echo "📋 Next steps:"
echo "1. npm install @whiskeysockets/baileys @google/generative-ai pino qrcode-terminal sharp canvas fluent-ffmpeg"
echo "2. Isi assets/dice/dice1.webp - dice6.webp dengan file WEBP animasi"
echo "3. node index.js"