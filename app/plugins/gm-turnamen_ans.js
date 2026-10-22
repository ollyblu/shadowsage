const handler = {}
handler.all = async function (dt, pesan) {
    const game = require('./gm-turnamen')
    let id = dt.room_id
    let state = server.room[id].turnamen
    if (!state) return require('../api/quiz').endGame(id, 'turnamen')
    let body = pesan.body.trim()
    if (server.identifier.includes(body.charAt(0))) {
        if ((keluarroom.test(body) || /stop/i.test(body)) && (dt.sender == state.host || dt.isOwner)) {
            clearTimeout(state.timer)
            state.total = state.round
            await pesan.reply('⏹️ Turnamen dihentikan')
            await game.finish(id, pesan.from, state)
        }
        return
    }
    if (!state.current || game.clean(body) !== game.clean(state.current.answer)) return
    state.current = null
    state.score[dt.sender] = (state.score[dt.sender] || 0) + 1
    clearTimeout(state.timer)
    await server.client.sendMessage(pesan.from, `✅ @${dt.sender.split('@')[0]} benar! (+1 poin, total ${state.score[dt.sender]})`, { mentions: [dt.sender] })
    state.timer = setTimeout(() => game.nextRound(id, pesan.from, state), 3000)
}
handler.child = 'turnamen'
module.exports = handler
