const googleTTS = require('google-tts-api')

const defaultLang = 'id'
const handler = {}
handler.main = async function (dt, pesan) {
  let lang = defaultLang
  let text = dt.text.trim()
  // Kode bahasa 2 huruf opsional di depan, mis. "!tts en hello"
  let langMatch = text.match(/^([a-z]{2})\s+([\s\S]+)$/i)
  if (langMatch) {
    lang = langMatch[1].toLowerCase()
    text = langMatch[2]
  }
  if (!text && pesan.hasQuotedMsg) {
    let quoted = await pesan.getQuotedMessage()
    text = quoted.body || ''
  }
  if (!text) return pesan.reply('Mana teksnya\nContoh\n !tts aku jawa\n !tts en hello world')
  text = text.toLowerCase().replace(listkatakotor, 'Gaboleh Kata Kata Kotor KK')

  let res
  try {
    res = googleTTS.getAllAudioUrls(text, {
      lang,
      slow: false,
      host: 'https://translate.google.com',
      splitPunct: ',.?',
    })
  } catch (e) {
    return pesan.reply(e + '')
  }
  for (let { url } of res) {
    let media = await server.MessageMedia.fromUrl(url, { unsafeMime: true, filename: 'tts.mp3' })
    if (!media.mimetype || media.mimetype == 'application/octet-stream') media.mimetype = 'audio/mpeg'
    await server.client.sendMessage(pesan.from, media, { sendAudioAsVoice: true })
  }
}
handler.help = ['tts <lang> <teks>']
handler.tags = ['tools']
handler.command = /^g?tts$/i
module.exports = handler
