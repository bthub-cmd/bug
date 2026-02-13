const { GoogleGenerativeAI } = require('@google/generative-ai')

const GEMINI_KEY = 'AIzaSyCem3mP2NBUqzB2f94D8Z217dSFTFguJA0'

async function handle(sock, msg, from, body) {
  const prompt = body.replace('.ai ', '').trim()

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_KEY)

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash'
    })

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]
    })

    const aiText = result.response.candidates[0].content.parts[0].text

    await sock.sendMessage(
      from,
      { text: `${aiText}\n\n〄 Powered by Gemini 2.5 Flash` },
      { quoted: msg }
    )

  } catch (err) {
    console.log(err)
    await sock.sendMessage(
      from,
      {
        text: `[ ERROR 400 ]
Neural engine tidak merespons

〄 Powered by Gemini 2.5 Flash`
      },
      { quoted: msg }
    )
  }
}

module.exports = { handle }