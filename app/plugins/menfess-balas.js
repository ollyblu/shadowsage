const menfess = require('../api/menfess')
const handler = {}
handler.main = async function (dt, pesan) {
    if (dt.chat.isGroup) return pesan.reply('Membalas menfess hanya bisa lewat chat pribadi dengan bot')
    let me = [dt.sender, pesan.from]
    let text = dt.text.trim()
    let id = (text.match(/^#?([A-Za-z0-9]{5})(?=\s|$)/) || [])[1]
    let thread = id && menfess.getThread(id)
    let side
    if (thread) text = text.replace(/^#?[A-Za-z0-9]{5}\s*/, '')
    else if (pesan.hasQuotedMsg) {
        // !balas pesan  (sambil me-reply pesan menfess)
        let quoted = await pesan.getQuotedMessage()
        let found = quoted && quoted.id && menfess.threadFromQuoted(quoted.id.id, me)
        if (found) ({ thread, side } = found)
    }
    if (!thread) return pesan.reply('Contoh: !balas K7Q2M Halo juga\n\nLihat ID menfess kamu dengan *!menfess list*')
    let media = await menfess.getMedia(pesan)
    let { censored } = await menfess.reply({ sender: me, thread, side, text, media })
    await pesan.react('✅')
    if (censored) await pesan.reply('⚠️ Beberapa kata disensor')
}
handler.tags = ['top']
handler.help = 'balas <ID> <pesan>'
handler.command = /^(balas|mfr)$/i
module.exports = handler
