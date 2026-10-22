// Terjemahan lewat endpoint publik Google Translate (tanpa API key)
const fetch = require('node-fetch')

const langs = ['id', 'en', 'ja', 'ko', 'zh', 'zh-cn', 'zh-tw', 'ar', 'es', 'fr', 'de', 'ru', 'pt', 'it', 'th', 'vi', 'ms', 'jw', 'su', 'nl', 'tr', 'hi', 'tl', 'fa', 'ur', 'bn', 'pl', 'uk', 'sv', 'el', 'he', 'la']

async function translate(text, to = 'id') {
    let url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${to}&dt=t&q=${encodeURIComponent(text)}`
    let json = await (await fetch(url, { timeout: 15000 })).json()
    return { text: json[0].map(s => s[0]).join(''), from: json[2] }
}

const handler = {}
handler.main = async function (dt, pesan) {
    let text = dt.text.trim()
    let lang = null
    let m = text.match(/^([a-z]{2}(?:-[a-z]{2})?)(?:\s+([\s\S]*))?$/i)
    // Hanya kode bahasa yang dikenal, supaya kata 2 huruf seperti "di" tidak dianggap kode bahasa
    if (m && langs.includes(m[1].toLowerCase()) && (m[2] || pesan.hasQuotedMsg)) {
        lang = m[1].toLowerCase()
        text = m[2] || ''
    }
    if (!text && pesan.hasQuotedMsg) text = (await pesan.getQuotedMessage()).body || ''
    if (!text) return pesan.reply('Contoh:\n!tr en apa kabar\n!tr ja selamat pagi\nAtau reply pesan dengan !tr <bahasa>\n\nTanpa kode bahasa: diterjemahkan ke Indonesia (atau ke Inggris bila teksnya sudah bahasa Indonesia)')
    let res = await translate(text.slice(0, 4000), lang || 'id')
    if (!lang && res.from == 'id') res = await translate(text.slice(0, 4000), lang = 'en')
    await pesan.reply(`🌐 *${res.from}* ➜ *${lang || 'id'}*\n\n${res.text}`)
}
handler.translate = translate
handler.help = 'tr <bahasa> <teks>'
handler.tags = ['translate', 'tools']
handler.command = /^(tr|translate|terjemah(kan)?)$/i
handler.cooldown = 3000
module.exports = handler
