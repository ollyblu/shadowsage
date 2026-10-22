const quiz = require('../api/quiz')

const handler = {}
handler.all = async function (dt, pesan) {
    let id = dt.room_id
    let state = server.room[id].hangman
    if (!state) return quiz.endGame(id, 'hangman')
    let body = pesan.body.trim().toUpperCase()
    if (server.identifier.includes(body.charAt(0))) {
        if (keluarroom.test(body)) {
            quiz.endGame(id, 'hangman')
            await pesan.reply(`Menyerah 🏳️ Katanya adalah *${state.word}*`)
        }
        return
    }
    const { render } = require('./gm-hangman')
    let menang = false
    if (/^[A-Z]$/.test(body)) {
        if (state.guessed.includes(body) || state.wrong.includes(body)) return pesan.reply(`Huruf *${body}* sudah ditebak`)
        if (state.word.includes(body)) {
            state.guessed.push(body)
            menang = state.word.split('').every(c => state.guessed.includes(c))
        } else {
            state.wrong.push(body)
            state.lives--
        }
    } else if (/^[A-Z]{4,12}$/.test(body) && body.length == state.word.length) {
        if (body == state.word) {
            state.guessed = [...new Set(state.word)]
            menang = true
        } else {
            state.lives--
            state.wrong.push(body)
        }
    } else return
    if (menang) {
        let bonus = 100 + state.lives * 80
        dt.usr.exp += bonus
        dt.usr.money += Math.floor(bonus / 2)
        quiz.endGame(id, 'hangman')
        return pesan.reply(`${render(state)}\n\n🎉 *BENAR!* Katanya *${state.word}*\n+✨ ${bonus} XP  +💰 ${Math.floor(bonus / 2)}`)
    }
    if (state.lives <= 0) {
        quiz.endGame(id, 'hangman')
        return pesan.reply(`${render(state)}\n\n💀 *KALAH!* Katanya adalah *${state.word}*`)
    }
    await pesan.reply(render(state))
}
handler.child = 'hangman'
module.exports = handler
