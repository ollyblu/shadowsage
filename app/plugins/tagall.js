const handler = {}
handler.main = async function (dt, pesan) {
    await dt.getAdmin()
    let participants = dt.participants.filter(p => !server.isBot(p.id))
    let mentions = participants.map(p => p.id)
    let msg = dt.text.trim()
    if (/^hidetag$|^h$/i.test(dt.command)) {
        // Mention semua anggota tanpa menampilkan daftar tag
        let quoted = pesan.hasQuotedMsg ? await pesan.getQuotedMessage() : null
        let text = msg || (quoted && quoted.body) || '📢'
        return server.client.sendMessage(pesan.from, text, { mentions })
    }
    let text = `📢 *TAG ALL*${msg ? `\n${msg}` : ''}\n\n` + participants.map(p => `${p.isAdmin ? '👑' : '•'} @${p.user}`).join('\n')
    await server.client.sendMessage(pesan.from, text, { mentions })
}
handler.help = ['tagall <pesan>', 'hidetag <pesan>']
handler.tags = ['group']
handler.command = /^(tagall|hidetag|h)$/i
handler.admin = true
handler.cooldown = 30000
module.exports = handler
