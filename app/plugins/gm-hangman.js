const quiz = require('../api/quiz')

const LIVES = 6
const TIMEOUT = 300000
let words
// Kata diambil dari jawaban bank soal yang terdiri dari satu kata
function getWords() {
    if (!words) {
        let set = new Set()
        for (let file of ['tebakkata.json', 'asahotak.json', 'siapakahaku.json', 'tekateki.json', 'susunkata.json']) {
            for (let s of quiz.loadSoal(file)) {
                let w = `${s.jawaban || ''}`.trim().toUpperCase()
                if (/^[A-Z]{4,12}$/.test(w)) set.add(w)
            }
        }
        words = [...set]
    }
    return words
}

const handler = {}
handler.main = async function (dt, pesan) {
    let room = server.room[dt.room_id]
    if (room.child) return pesan.reply(`Masih ada game *${room.child}* di chat ini\nKetik !exit untuk keluar`)
    let word = pickRandom(getWords())
    room.name = 'game'
    room.child = 'hangman'
    let state = room.hangman = { word, guessed: [], wrong: [], lives: LIVES }
    state.timer = setTimeout(() => {
        if (server.room[dt.room_id].hangman !== state) return
        quiz.endGame(dt.room_id, 'hangman')
        pesan.reply(`⌛ Waktu habis! Katanya adalah *${word}*`).catch(console.error)
    }, TIMEOUT)
    await pesan.reply(`🪢 *HANGMAN*\n\n${handler.render(state)}\n\nTebak satu huruf, atau langsung seluruh katanya\nKetik !exit untuk menyerah`)
}
const gallows = [
    '  +---+\n      |\n      |\n      |\n     ===',
    '  +---+\n  O   |\n      |\n      |\n     ===',
    '  +---+\n  O   |\n  |   |\n      |\n     ===',
    '  +---+\n  O   |\n /|   |\n      |\n     ===',
    '  +---+\n  O   |\n /|\\  |\n      |\n     ===',
    '  +---+\n  O   |\n /|\\  |\n /    |\n     ===',
    '  +---+\n  O   |\n /|\\  |\n / \\  |\n     ===',
]
handler.render = state => {
    let masked = state.word.split('').map(c => state.guessed.includes(c) ? c : '_').join(' ')
    return '```' + gallows[LIVES - state.lives] + '```\n\n```' + masked + '```\n'
        + `❤️ Nyawa: ${'❤️'.repeat(state.lives)}${'🖤'.repeat(LIVES - state.lives)}`
        + (state.wrong.length ? `\n❌ Salah: ${state.wrong.join(', ')}` : '')
}
handler.help = 'hangman'
handler.tags = ['game']
handler.command = /^(hangman|gantung)$/i
module.exports = handler
