const quiz = require('../api/quiz')
const { lookup } = require('../api/kbbi')

const handler = {}
handler.all = async function (dt, pesan) {
    const game = require('./gm-sambungkata')
    let id = dt.room_id
    let state = server.room[id].sambungkata
    if (!state) return quiz.endGame(id, 'sambungkata')
    let body = pesan.body.trim().toLowerCase()
    if (server.identifier.includes(body.charAt(0))) {
        if (keluarroom.test(body)) {
            quiz.endGame(id, 'sambungkata')
            game.reward(state)
            await server.client.sendMessage(pesan.from, `🔗 Sambung kata selesai!\n\n${game.scoreboard(state)}`, { mentions: Object.keys(state.score) })
        }
        return
    }
    if (!/^[a-z]{3,20}$/.test(body)) return
    let prefix = state.word.slice(-2)
    if (!body.startsWith(prefix)) return pesan.react('❌')
    if (dt.chat.isGroup && state.last == dt.sender) return pesan.reply('Gantian dong, biar yang lain jawab dulu 😄')
    if (state.used.includes(body)) return pesan.reply(`Kata *${body}* sudah dipakai`)
    let valid
    try { valid = !!(await lookup(body)) } catch { valid = true } // KBBI tidak bisa diakses: kata diterima
    // Jawaban lain bisa masuk selama menunggu KBBI
    if (server.room[id].sambungkata !== state || state.word.slice(-2) !== prefix || state.used.includes(body)) return
    if (!valid) return pesan.reply(`*${body}* tidak ada di KBBI 📕`)
    state.used.push(body)
    state.word = body
    state.last = dt.sender
    state.score[dt.sender] = (state.score[dt.sender] || 0) + 1
    game.arm(id, pesan, state)
    await pesan.reply(`✅ *${body.toUpperCase()}* (+1 @${dt.sender.split('@')[0]})\nSambung dengan: *${body.slice(-2).toUpperCase()}...*`, undefined, { mentions: [dt.sender] })
}
handler.child = 'sambungkata'
module.exports = handler
