/**
 * Meneruskan balasan menfess: cukup reply pesan menfess dari bot di chat pribadi.
 * Nama file diawali "__" agar dijalankan sebelum plugin .all lain (mis. _autoreply).
 */
const menfess = require('../api/menfess')
const handler = {}
handler.all = async function (dt, pesan) {
    if (dt.chat.isGroup || pesan.fromMe || !pesan.hasQuotedMsg) return
    if (server.identifier.includes(pesan.body.trim().charAt(0))) return
    let quoted = await pesan.getQuotedMessage()
    let quotedId = quoted && quoted.id && quoted.id.id
    if (!quotedId) {
        console.warn('[menfess] pesan yang di-reply tidak bisa dibaca (mungkin sudah tidak ada di cache)')
        return
    }
    // Tidak memeriksa quoted.fromMe: pada akun LID nilainya bisa salah, cukup cocokkan ID pesannya
    let found = menfess.threadFromQuoted(quotedId, [dt.sender, pesan.from, pesan.author])
    if (!found) return
    dt.stop = true
    try {
        let media = await menfess.getMedia(pesan)
        let { censored } = await menfess.reply({ sender: [dt.sender, pesan.from], thread: found.thread, side: found.side, text: pesan.body.trim(), media })
        await pesan.react('✅')
        if (censored) await pesan.reply('⚠️ Beberapa kata disensor')
    } catch (e) {
        console.error(`[menfess] gagal meneruskan balasan #${found.thread.id}:`, e)
        if (typeof e == 'string') return pesan.reply(e)
        await pesan.reply('❌ Balasan gagal dikirim, coba lagi sebentar lagi')
    }
}
module.exports = handler
