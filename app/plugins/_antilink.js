// Antilink & antitoxic grup (diaktifkan per grup lewat !setting antilink on / antitoxic on)
const { addWarn } = require('../api/warn')
const linkGrup = /chat\.whatsapp\.com\/([0-9A-Za-z]{18,24})/i

const handler = {}
handler.all = async function (dt, pesan) {
    if (!dt.chat.isGroup || pesan.fromMe || dt.isOwner) return
    let room = dt.roomdb
    let body = pesan.body || ''
    let link = room.antilink && linkGrup.exec(body)
    let toxic = room.antitoxic && listkatakotor.test(body.toLowerCase())
    if (!link && !toxic) return
    await dt.getAdmin()
    if (dt.isAdmin) return
    if (link && dt.isBotAdmin) {
        // Link grup ini sendiri boleh dibagikan
        let own = await dt.chat.getInviteCode().catch(() => null)
        if (own && own == link[1]) return
    }
    if (dt.isBotAdmin) await pesan.delete(true).catch(e => console.error('Gagal menghapus pesan', e.message))
    await addWarn(dt, pesan, dt.sender, link ? 'mengirim link grup lain' : 'berkata kasar')
    // Hentikan plugin lain (autoreply, game, dll) untuk pesan ini
    dt.stop = true
}
module.exports = handler
