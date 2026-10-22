const { kbbi } = require('../api/kbbi')
const handler = {}
handler.main = async function (dt, pesan) {
    let text = dt.text.trim()
    if (!text) return pesan.reply('Contoh :\n!kbbi aku')
    try {
        let res = await kbbi(text)
        await pesan.reply(`${res.lema}\n\n${res.arti.join(', ')}`.trim())
    } catch (reason) {
        console.log('err', reason)
        await pesan.reply(`${reason}`)
    }
}
handler.command = /^kbbi$/i
handler.help = 'kbbi <kata>'
handler.tags = ['internet']
handler.limit = 1
handler.cooldown = 5000

module.exports = handler
