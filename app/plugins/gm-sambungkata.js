const quiz = require('../api/quiz')

const TURN_TIMEOUT = 60000
const starters = ['rumah', 'makan', 'sekolah', 'kucing', 'pelangi', 'bunga', 'kereta', 'gunung', 'sepeda', 'jendela', 'mangga', 'payung', 'kopi', 'lemari', 'bintang']

// Dipanggil dari plugin _ans juga, untuk memperpanjang waktu tiap giliran
function arm(id, pesan, state) {
    clearTimeout(state.timer)
    state.timer = setTimeout(() => {
        if (server.room[id].sambungkata !== state) return
        quiz.endGame(id, 'sambungkata')
        server.client.sendMessage(pesan.from, `⌛ Waktu habis! Tidak ada yang bisa menyambung *${state.word.toUpperCase()}*\n\n${scoreboard(state)}`, { mentions: Object.keys(state.score) }).catch(console.error)
        reward(state)
    }, TURN_TIMEOUT)
}

function scoreboard(state) {
    let rows = Object.entries(state.score).sort((a, b) => b[1] - a[1])
    if (!rows.length) return '_Belum ada yang menjawab_'
    return '🏆 *SKOR*\n' + rows.map(([id, n], i) => `${i + 1}. @${id.split('@')[0]} — ${n} kata`).join('\n')
}

function reward(state) {
    for (let [id, n] of Object.entries(state.score)) {
        let user = getUser(id)
        user.exp += n * 60
        user.money += n * 30
    }
}

const handler = {}
handler.main = async function (dt, pesan) {
    let room = server.room[dt.room_id]
    if (room.child) return pesan.reply(`Masih ada game *${room.child}* di chat ini\nKetik !exit untuk keluar`)
    let word = pickRandom(starters)
    room.name = 'game'
    room.child = 'sambungkata'
    let state = room.sambungkata = { word, used: [word], score: {}, last: null }
    arm(dt.room_id, pesan, state)
    await pesan.reply(`🔗 *SAMBUNG KATA*\n\nKirim kata yang diawali *2 huruf terakhir* kata sebelumnya.\nKata harus ada di KBBI dan belum dipakai. Di grup, tidak boleh menjawab 2x berturut-turut.\nTiap giliran ${TURN_TIMEOUT / 1000} detik.\n\nKata pertama: *${word.toUpperCase()}*\nSambung dengan: *${word.slice(-2).toUpperCase()}...*\n\nKetik !exit untuk berhenti`)
}
handler.arm = arm
handler.scoreboard = scoreboard
handler.reward = reward
handler.help = 'sambungkata'
handler.tags = ['game']
handler.command = /^(sambungkata|sk)$/i
module.exports = handler
