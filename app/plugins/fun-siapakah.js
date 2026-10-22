const handler = {}
handler.main = async function (dt, pesan) {
    if (!dt.chat.isGroup) return 0
    let participant = await server.getParticipants(dt.chat)
    if (!participant.length) return 0
    let question = dt.text.trim()
    let target = pickRandom(participant)
    await server.client.sendMessage(pesan.from, `${question} adalah @${target.user}`, { mentions: [target.id] })
}
handler.help = 'siapakah _kalimat_?'
handler.command = /^siapakah$/i
handler.tags = ['kerang']

module.exports = handler
