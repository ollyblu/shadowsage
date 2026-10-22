const quiz = require('../api/quiz')

const handler = {}
handler.all = async function (dt, pesan) {
    let id = dt.room_id
    let state = server.room[id].tebakangka
    if (!state) return quiz.endGame(id, 'tebakangka')
    let body = pesan.body.trim()
    if (server.identifier.includes(body.charAt(0))) {
        if (keluarroom.test(body)) {
            quiz.endGame(id, 'tebakangka')
            await pesan.reply(`Menyerah 🏳️ Angkanya *${state.angka}*`)
        }
        return
    }
    if (!/^\d{1,4}$/.test(body)) return
    let n = Number(body)
    if (n < 1 || n > state.max) return pesan.reply(`Angkanya antara 1 - ${state.max}`)
    state.used++
    if (n == state.angka) {
        let bonus = 100 + (state.tries - state.used + 1) * (state.max == 1000 ? 120 : 70)
        dt.usr.exp += bonus
        dt.usr.money += Math.floor(bonus / 2)
        quiz.endGame(id, 'tebakangka')
        return pesan.reply(`🎉 *BENAR!* Angkanya *${state.angka}* (tebakan ke-${state.used})\n+✨ ${bonus} XP  +💰 ${Math.floor(bonus / 2)}`)
    }
    if (n < state.angka) state.min = Math.max(state.min, n + 1)
    else state.top = Math.min(state.top, n - 1)
    let left = state.tries - state.used
    if (left <= 0) {
        quiz.endGame(id, 'tebakangka')
        return pesan.reply(`💀 Kesempatan habis! Angkanya *${state.angka}*`)
    }
    await pesan.reply(`${n < state.angka ? '⬆️ Lebih *BESAR*' : '⬇️ Lebih *KECIL*'} dari ${n}\nRentang: ${state.min} - ${state.top} • Sisa ${left}x`)
}
handler.child = 'tebakangka'
module.exports = handler
