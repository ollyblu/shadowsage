const quiz = require('../api/quiz')

const TIMEOUT = 180000
const handler = {}
handler.main = async function (dt, pesan) {
    let room = server.room[dt.room_id]
    if (room.child) return pesan.reply(`Masih ada game *${room.child}* di chat ini\nKetik !exit untuk keluar`)
    let max = /^(sulit|1000)$/i.test(dt.text.trim()) ? 1000 : 100
    let tries = max == 1000 ? 10 : 7
    room.name = 'game'
    room.child = 'tebakangka'
    let state = room.tebakangka = { angka: 1 + Math.floor(Math.random() * max), max, tries, used: 0, min: 1, top: max }
    state.timer = setTimeout(() => {
        if (server.room[dt.room_id].tebakangka !== state) return
        quiz.endGame(dt.room_id, 'tebakangka')
        pesan.reply(`⌛ Waktu habis! Angkanya *${state.angka}*`).catch(console.error)
    }, TIMEOUT)
    await pesan.reply(`🔢 *TEBAK ANGKA*\n\nAku memikirkan angka *1 - ${max}*\nKamu punya *${tries}* kesempatan\nKetik angkanya langsung!\n\n_Mode sulit: !tebakangka sulit (1-1000)_`)
}
handler.help = 'tebakangka [sulit]'
handler.tags = ['game']
handler.command = /^(tebakangka|angka)$/i
module.exports = handler
