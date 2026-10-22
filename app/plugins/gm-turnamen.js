// Turnamen kuis: beberapa ronde soal campuran, siapa cepat dia dapat poin
const quiz = require('../api/quiz')

const ROUND_TIME = 40000
const sources = [
    ['asahotak.json', 'Asah Otak', s => s.soal],
    ['caklontong.json', 'Cak Lontong', s => s.soal],
    ['siapakahaku.json', 'Siapakah Aku', s => s.soal],
    ['tebakkata.json', 'Tebak Kata', s => s.soal],
    ['tekateki.json', 'Teka-teki', s => s.soal],
    ['susunkata.json', 'Susun Kata', s => `${s.soal} (${s.tipe})`],
    ['tebakemoji.json', 'Tebak Emoji', s => `${s.soal} (${s.tipe})`],
]
const prizes = [[2000, 1000], [1000, 500], [500, 250]]
const clean = t => `${t}`.toLowerCase().replace(/[^a-z0-9]/g, '')

function nextRound(id, chatId, state) {
    clearTimeout(state.timer)
    if (state.round >= state.total) return finish(id, chatId, state)
    state.round++
    let [file, label, soal] = pickRandom(sources)
    let item = pickRandom(quiz.loadSoal(file))
    state.current = { answer: `${item.jawaban}`.trim(), label }
    server.client.sendMessage(chatId, `🏁 *RONDE ${state.round}/${state.total}* — ${label}\n\n*${soal(item)}*\n\n⏱️ ${ROUND_TIME / 1000} detik`).catch(console.error)
    state.timer = setTimeout(() => {
        if (server.room[id].turnamen !== state) return
        server.client.sendMessage(chatId, `⌛ Waktu habis! Jawabannya *${state.current.answer}*`).catch(console.error)
        state.current = null
        state.timer = setTimeout(() => nextRound(id, chatId, state), 3000)
    }, ROUND_TIME)
}

async function finish(id, chatId, state) {
    quiz.endGame(id, 'turnamen')
    let rows = Object.entries(state.score).sort((a, b) => b[1] - a[1])
    if (!rows.length) return server.client.sendMessage(chatId, '🏁 Turnamen selesai, tapi tidak ada yang menjawab benar 😅')
    let medal = ['🥇', '🥈', '🥉']
    let lines = rows.map(([uid, n], i) => {
        let user = getUser(uid)
        let [money, exp] = prizes[i] || [0, 0]
        user.money += money
        user.exp += exp + n * 100
        return `${medal[i] || `${i + 1}.`} @${uid.split('@')[0]} — *${n} poin*${money ? ` (+💰 ${money})` : ''}`
    })
    await server.client.sendMessage(chatId, `🏆 *HASIL TURNAMEN*\n\n${lines.join('\n')}\n\n_Semua peserta mendapat +100 XP per poin_`, { mentions: rows.map(([uid]) => uid) })
}

const handler = {}
handler.main = async function (dt, pesan) {
    let room = server.room[dt.room_id]
    if (room.child) return pesan.reply(`Masih ada game *${room.child}* di chat ini\nKetik !exit untuk keluar`)
    let total = Math.min(20, Math.max(3, parseInt(dt.text) || 10))
    room.name = 'game'
    room.child = 'turnamen'
    let state = room.turnamen = { total, round: 0, score: {}, host: dt.sender, current: null }
    await pesan.reply(`🏆 *TURNAMEN KUIS* dimulai!\n${total} ronde soal campuran. Jawab paling cepat untuk dapat poin.\n\nHadiah: 🥇 💰2000 • 🥈 💰1000 • 🥉 💰500\nPembuat turnamen bisa ketik !stop untuk menghentikan`)
    state.timer = setTimeout(() => nextRound(dt.room_id, pesan.from, state), 2000)
}
handler.nextRound = nextRound
handler.finish = finish
handler.clean = clean
handler.help = 'turnamen [jumlah ronde]'
handler.tags = ['game', 'top']
handler.command = /^(turnamen|tournament|kuis)$/i
handler.group = true
handler.cooldown = 60000
module.exports = handler
