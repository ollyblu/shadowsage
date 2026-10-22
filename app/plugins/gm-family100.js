const fs = require('fs')
const winScore = 200
const timeout = 300000
const src = JSON.parse(fs.readFileSync('./app/library/family.json'))
const handler = {}
handler.main = async function (dt, pesan) {
    if (!dt.chat.isGroup) return pesan.reply('Game ini hanya tersedia di group')
    let id = dt.room_id
    if (typeof server.room[id].child !== 'undefined') {
        if (server.room[id].child == 'family100') return pesan.reply('Masih ada kuis yang belum terjawab di chat ini')
        return pesan.reply(`Chat ini masih diruang game ${server.room[id].child}`)
    }
    let soal = pickRandom(src)
    let json = { soal: soal.soal, jawaban: soal.jawaban.filter(v => v && v.trim()) }
    let caption = `*Soal:* ${json.soal}\n\nTerdapat *${json.jawaban.length}* jawaban teratas\n${json.jawaban.find(v => v.includes(' ')) ? '(Beberapa jawaban mengandung spasi)' : ''}\n\n+${winScore} XP tiap jawaban benar\n-${game.proses(winScore, game.dikit)} XP tiap jawaban hampir benar\n-${game.proses(winScore, game.salah)} XP tiap jawaban salah\nTimeout: ${timeout / 1000} detik`.trim()
    server.room[id].child = 'family100'
    server.room[id].name = 'game'
    let state = server.room[id].family100 = {
        id,
        ...json,
        terjawab: Array.from(json.jawaban, () => false),
        winScore,
        tout: setTimeout(() => {
            if (server.room[id].family100 !== state) return
            pesan.reply(`Waktu Habis\nTidak menerima jawaban lagi\n*${json.soal}*\n->${json.jawaban.join('\n->')}`).catch(console.error)
            delete server.room[id].family100
            delete server.room[id].child
        }, timeout)
    }
    state.msg = await pesan.reply(caption)
}
handler.help = 'family100'
handler.tags = ['game', 'top']
handler.command = /^family(100)?$/i
module.exports = handler
