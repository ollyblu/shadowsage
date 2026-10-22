/**
 * Logika bersama untuk game tebak-tebakan (asahotak, caklontong, tebakkata, dst).
 * Setiap game cukup didaftarkan di `games` di bawah, lalu plugin memakai
 * quiz('nama').start / .answer / .hint
 */
const fs = require('fs')
const path = require('path')
const similarity = require('similarity')

const libraryDir = path.join(__dirname, '..', 'library')
const hintChars = ['…', '‾', '⁘', '_']
const vokal = /[AIUEOaiueo]/g
const cache = {}
function loadSoal(file) {
    if (!cache[file]) cache[file] = JSON.parse(fs.readFileSync(path.join(libraryDir, file)))
    return cache[file]
}
const footer = (poin, extra = '') => `-${Math.floor(poin * game.salah)} XP tiap jawaban salah\nBonus: ${poin} XP${extra}`

const games = {
    asahotak: {
        timeout: 120000, poin: 500,
        caption: (json, c) => `*${json.soal}*\nTimeout *${(c.timeout / 1000).toFixed(2)} detik*\n${footer(c.poin)}\nKetik *!clue* untuk bantuan`,
        hint: (json, state) => {
            state.poin *= game.clue
            return `Clue: *${json.jawaban.replace(vokal, pickRandom(hintChars))}*\nPoin berkurang ${Math.round(100 - game.clue * 100)}%`
        },
        correct: (json, bonus) => `*Benar*\nBonus ${bonus} XP`,
    },
    caklontong: {
        timeout: 120000, poin: 500,
        caption: (json, c) => `*${json.soal}*\nWaktu: ${c.timeout / 1000}detik\n${footer(c.poin)}\nKetik *!clue* untuk bantuan`,
        hint: (json, state) => {
            state.poin = Math.floor(state.poin * 0.3)
            return `Clue: *${json.jawaban.replace(vokal, pickRandom(hintChars))}*\nPoin menjadi ${state.poin}`
        },
        correct: (json, bonus) => `Wih benar\nBonus ${bonus} XP\n${json.deskripsi || ''}`.trim(),
        reveal: json => `*${json.jawaban}*\n_${json.deskripsi || ''}_`,
        busy: state => `Masih ada soal yang belum terjawab\n${state.json.soal}`,
    },
    siapakahaku: {
        timeout: 120000, poin: 500,
        caption: (json, c) => `${json.soal}\nTimeout *${(c.timeout / 1000).toFixed(2)} detik*\n${footer(c.poin)}\nKetik *!clue* untuk bantuan`,
        hint: (json, state) => {
            state.poin = Math.floor(state.poin * game.clue)
            return 'Clue: ```' + json.jawaban.replace(vokal, '_') + '```\nPoin menjadi ' + state.poin
        },
    },
    tebakkata: {
        timeout: 60000, poin: 500,
        caption: (json, c) => `${json.soal}\nTimeout *${(c.timeout / 1000).toFixed(2)} detik*\nKetik *!clue* untuk bantuan\n${footer(c.poin)}`,
        hint: (json, state) => {
            state.poin = Math.floor(state.poin * game.clue)
            return 'Clue: ```' + json.jawaban.replace(vokal, '_') + '```\nPoin menjadi ' + state.poin
        },
    },
    susunkata: {
        timeout: 120000, poin: 500,
        caption: (json, c) => `Soal: ${json.soal}\nBerkaitan dengan ${json.tipe}\nTimeout: *${c.timeout / 1000}* detik\n${footer(c.poin)}\nKetik *!clue* untuk bantuan`,
        clueInAll: true,
        hint: json => 'Clue\n```' + json.jawaban.replace(vokal, '_') + '```',
    },
    tebakbendera: {
        timeout: 120000, poin: 500, groupOnly: true,
        answer: json => json.name,
        media: json => json.img,
        caption: (json, c) => `Timeout *${(c.timeout / 1000).toFixed(2)} detik*\nKetik *!clue* untuk bantuan\n${footer(c.poin)}`,
        clueInAll: true,
        hint: json => 'Clue\n```' + json.name.replace(vokal, '_') + '```',
    },
    tebakgambar: {
        timeout: 180000, poin: 500, groupOnly: true,
        media: json => json.img,
        caption: (json, c) => `Timeout *${(c.timeout / 1000).toFixed(2)} detik*\nKetik *!clue* untuk bantuan\n${footer(c.poin)}`,
        clueInAll: true,
        hint: json => 'Clue\n```' + json.jawaban.replace(vokal, '_') + '```',
        reveal: json => `*${json.jawaban}*${json.deskripsi ? `\n_${json.deskripsi}_` : ''}`,
    },
    tebakgame: {
        timeout: 180000, poin: 500, groupOnly: true,
        media: json => json.img,
        caption: (json, c) => `Timeout *${(c.timeout / 1000).toFixed(2)} detik*\nKetik *!clue* untuk bantuan\n${footer(c.poin)}`,
        clueInAll: true,
        hint: json => 'Clue\n```' + json.jawaban.replace(vokal, '_') + '```',
    },
    tebaklagu: {
        timeout: 180000, poin: 500, groupOnly: true,
        answer: json => json.judul,
        media: json => json.lagu,
        mediaFirst: true,
        caption: (json, c) => `TEBAK JUDUL LAGU\nArtis : ${json.artis}\nJudul : _____\nTimeout *${(c.timeout / 1000).toFixed(2)} detik*\nKetik *.clue* untuk bantuan\n${footer(c.poin)}`,
        clueInAll: true,
        hint: json => 'Clue\n```' + json.judul.replace(vokal, '_') + '```',
    },
    tebakkalimat: {
        timeout: 120000, poin: 200, startCost: true,
        caption: (json, c) => `*${json.soal}*\nWaktu: ${c.timeout / 1000}detik\n\n${footer(c.poin)}\nKetik *!clue* untuk bantuan`,
        clueInAll: true,
        hint: (json, state) => {
            state.poin = Math.floor(state.poin * game.clue)
            return `${json.deskripsi ? json.deskripsi + '\n' : ''}Clue\n` + '```' + json.jawaban.trim().replace(vokal, '_') + '```\nPoin menjadi ' + state.poin
        },
        isCorrect: (text, jawaban) => text == jawaban || similarity(text, jawaban) > 0.7,
        threshold: 0.52,
    },
    tebakkimia: {
        timeout: 20000, poin: 300, startCost: true,
        answer: json => json.unsur,
        caption: (json, c) => `Apa Nama unsur dari lambang *${json.lambang}*\nWaktu: ${c.timeout / 1000}detik\n${footer(c.poin)}\nKetik *!clue* untuk bantuan`,
        clueInAll: true,
        hint: (json, state) => {
            state.poin = Math.floor(state.poin * game.clue)
            return 'Clue\n```' + json.unsur.replace(vokal, '_') + '```\nPoin berkurang ' + `${Math.round(100 - game.clue * 100)}%`
        },
    },
    tebaklirik: {
        timeout: 120000, poin: 500, startCost: true,
        caption: (json, c) => `*${json.soal}*\nWaktu: ${c.timeout / 1000}detik\n${footer(c.poin)}\nKetik *!clue* untuk bantuan`,
        clueInAll: true,
        hint: (json, state) => {
            state.poin = Math.floor(state.poin * 0.4)
            return 'Clue\n```' + json.jawaban.replace(vokal, '_') + '```\nPoin berkurang 60%'
        },
    },
    matematika: {
        timeout: 60000, poin: 300,
        generate: dt => mathSoal(dt.text.trim().toLowerCase()),
        caption: (json, c) => `🧮 *MATEMATIKA* (${json.mode})

*${json.soal} = ?*

Timeout *${c.timeout / 1000} detik*
${footer(c.poin)}
_Mode: mudah, sedang, sulit, gila_`,
        hint: json => `Clue: jawabannya ${json.jawaban.length} digit, diawali *${json.jawaban[0]}*`,
        clueInAll: true,
        threshold: 2,
    },
    tebakemoji: {
        timeout: 90000, poin: 400,
        caption: (json, c) => `🤔 *TEBAK EMOJI*

${json.soal}

Kategori: *${json.tipe}*
Timeout *${c.timeout / 1000} detik*
${footer(c.poin)}
Ketik *!clue* untuk bantuan`,
        clueInAll: true,
        hint: json => 'Clue\n```' + json.jawaban.replace(vokal, '_') + '```',
    },
    tekateki: {
        timeout: 120000, poin: 200, startCost: true,
        caption: (json, c) => `*${json.soal}*\nWaktu: ${c.timeout / 1000}detik\n${footer(c.poin)}\nKetik *!clue* untuk bantuan`,
        clueInAll: true,
        hint: (json, state) => {
            state.poin = Math.floor(state.poin * game.clue)
            return 'Clue\n```' + json.jawaban.replace(vokal, '_') + '```\nPoin berkurang ' + `${Math.round(100 - game.clue * 100)}%`
        },
    },
}

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1))
// Soal hitungan acak. Pembagian selalu menghasilkan bilangan bulat
function mathSoal(mode) {
    const modes = {
        mudah: { poin: 150, make: () => { let a = rnd(1, 50), b = rnd(1, 50); return pickRandom([[`${a} + ${b}`, a + b], [`${a + b} - ${b}`, a]]) } },
        sedang: { poin: 300, make: () => { let a = rnd(2, 20), b = rnd(2, 20); return pickRandom([[`${a} × ${b}`, a * b], [`${a * b} ÷ ${b}`, a], [`${a * 13} + ${b * 17}`, a * 13 + b * 17]]) } },
        sulit: { poin: 600, make: () => { let a = rnd(10, 60), b = rnd(3, 15), c = rnd(10, 99); return pickRandom([[`${a} × ${b} - ${c}`, a * b - c], [`(${a} + ${c}) × ${b}`, (a + c) * b], [`${a * b} ÷ ${b} + ${c}`, a + c]]) } },
        gila: { poin: 1200, make: () => { let a = rnd(100, 999), b = rnd(11, 99), c = rnd(2, 12); return pickRandom([[`${a} × ${b}`, a * b], [`${c}² × ${b} - ${a}`, c * c * b - a], [`(${a} - ${b}) × ${c} + ${b}²`, (a - b) * c + b * b]]) } },
    }
    let key = modes[mode] ? mode : 'sedang'
    let [soal, jawaban] = modes[key].make()
    return { soal, jawaban: `${jawaban}`, poin: modes[key].poin, mode: key }
}

function endGame(id, name) {
    let room = server.room[id]
    if (!room) return
    if (room[name]) clearTimeout(room[name].timer)
    delete room[name]
    if (room.child == name) delete room.child
    room.name = 'home'
}

function quiz(name) {
    const cfg = games[name]
    if (!cfg) throw new Error(`Game '${name}' tidak terdaftar di api/quiz.js`)
    const file = cfg.file || `${name}.json`
    const getAnswer = json => `${(cfg.answer ? cfg.answer(json) : json.jawaban) || ''}`.trim()
    const reveal = json => cfg.reveal ? cfg.reveal(json) : `*${getAnswer(json)}*`
    const threshold = cfg.threshold || 0.72

    async function start(dt, pesan) {
        let id = dt.room_id
        let room = server.room[id]
        if (cfg.groupOnly && !dt.chat.isGroup) return pesan.reply('Hanya bisa digunakan di grup')
        if (room.child) {
            if (room.child == name) return pesan.reply(cfg.busy && room[name] ? cfg.busy(room[name]) : 'Masih ada soal yang belum terjawab di chat ini')
            return pesan.reply(`Kamu sedang berada di room ${room.child}\nKetik !exit untuk keluar dari room ${room.child}`)
        }
        // Soal bisa dibuat otomatis (generate) atau diambil acak dari file JSON di library/
        let json = cfg.generate ? cfg.generate(dt) : pickRandom(loadSoal(file))
        let poin = json.poin || cfg.poin
        let caption = cfg.caption(json, { timeout: cfg.timeout, poin }).trim()
        // Kunci room lebih dulu agar perintah ganda tidak memulai 2 soal sekaligus
        room.name = 'game'
        room.child = name
        let state = room[name] = { json, poin, start: Date.now(), timer: null }
        try {
            if (cfg.media) {
                let media = await server.MessageMedia.fromUrl(cfg.media(json), { unsafeMime: true })
                if (cfg.mediaFirst) {
                    let msg = await server.client.sendMessage(pesan.from, media)
                    state.msg = await msg.reply(caption)
                } else state.msg = await server.client.sendMessage(pesan.from, media, { caption })
            } else state.msg = await pesan.reply(caption)
        } catch (e) {
            endGame(id, name)
            console.error(`[${name}] gagal mengirim soal`, e)
            return pesan.reply('Gagal mengambil soal, coba lagi nanti')
        }
        if (cfg.startCost) dt.usr.exp -= Math.floor(cfg.poin * game.mulai)
        state.timer = setTimeout(() => {
            if (server.room[id] && server.room[id][name] === state) {
                pesan.reply(`Waktu habis!\nJawabannya adalah ${reveal(json)}`).catch(console.error)
                endGame(id, name)
            }
        }, cfg.timeout)
    }

    async function hint(dt, pesan) {
        let state = server.room[dt.room_id][name]
        if (!state) return
        await pesan.reply(cfg.hint(state.json, state))
    }

    async function answer(dt, pesan) {
        let id = dt.room_id
        let state = server.room[id][name]
        if (!state) {
            endGame(id, name)
            return 0
        }
        let body = pesan.body.trim()
        if (server.identifier.includes(body.charAt(0))) {
            if (keluarroom.test(body)) {
                endGame(id, name)
                await pesan.reply(`Keluar dari room game ${name}`)
            } else if (cfg.clueInAll && /clue/i.test(body)) await hint(dt, pesan)
            return 0
        }
        if (!body) return 0
        let text = body.toLowerCase()
        let jawaban = getAnswer(state.json).toLowerCase()
        let benar = cfg.isCorrect ? cfg.isCorrect(text, jawaban) : text == jawaban
        if (benar) {
            let bonus = Math.floor(state.poin)
            let money = Math.floor(bonus / 2)
            dt.usr.exp += bonus
            dt.usr.money += money
            dt.usr.poinG += 1
            endGame(id, name)
            await pesan.reply((cfg.correct ? cfg.correct(state.json, bonus) : `Wih benar\nBonus: ${bonus} XP`) + `\n+💰 ${money} money`)
        } else if (similarity(text, jawaban) >= threshold) {
            dt.usr.exp -= game.proses(state.poin, game.dikit)
            await pesan.react(game.dikitlagi)
        } else {
            dt.usr.exp -= game.proses(state.poin, game.salah)
            await pesan.react(game.salahlah)
        }
        return !0
    }

    return { start, answer, hint, end: id => endGame(id, name), config: cfg }
}
quiz.games = games
quiz.endGame = endGame
quiz.loadSoal = loadSoal
module.exports = quiz
