// Pengingat: dikirim oleh job 'reminders' di api/cron.js
const moment = require('moment-timezone')
const { formatDuration } = require('../api/rpg')

const MAX_PER_USER = 10
const DAY = 86400000
const units = { s: 1000, detik: 1000, dtk: 1000, m: 60000, menit: 60000, mnt: 60000, j: 3600000, jam: 3600000, h: 3600000, d: 86400000, hr: 86400000, hari: 86400000 }

// Mengembalikan { at, repeat, text } atau null
function parse(input) {
    let text = input.trim()
    let repeat = 0
    let m = text.match(/^(tiap|setiap)\s+hari\s+|^daily\s+/i)
    if (m) {
        repeat = DAY
        text = text.slice(m[0].length)
    }
    // Jam tertentu (WIB): "07:30", "besok 07.30"
    m = text.match(/^(besok\s+)?(\d{1,2})[:.](\d{2})\s+([\s\S]+)$/i)
    if (m && +m[2] < 24 && +m[3] < 60) {
        let t = moment.tz('Asia/Jakarta').set({ hour: +m[2], minute: +m[3], second: 0, millisecond: 0 })
        if (m[1]) t.add(1, 'day')
        else if (t.valueOf() <= Date.now()) t.add(1, 'day')
        return { at: t.valueOf(), repeat, text: m[4] }
    }
    if (repeat) return null
    // Durasi relatif: "30m", "1j30m", "2 hari"
    m = text.match(/^((?:\d+\s*(?:detik|dtk|menit|mnt|jam|hari|hr|s|m|j|h|d)\s*)+)\s+([\s\S]+)$/i)
    if (!m) return null
    let ms = 0
    for (let [, n, u] of m[1].matchAll(/(\d+)\s*(detik|dtk|menit|mnt|jam|hari|hr|s|m|j|h|d)/gi)) ms += +n * units[u.toLowerCase()]
    return { at: Date.now() + ms, repeat: 0, text: m[2] }
}

const handler = {}
handler.main = async function (dt, pesan) {
    let settings = server.settings()
    let cmd = dt.command.toLowerCase()
    let mine = settings.reminders.filter(r => r.user == dt.sender)

    if (/^(pengingat|reminders|listingat)$/.test(cmd)) {
        if (!mine.length) return pesan.reply('Kamu belum punya pengingat\nBuat dengan !ingatkan 30m minum obat')
        let list = mine.sort((a, b) => a.at - b.at).map((r, i) => `${i + 1}. ${moment(r.at).tz('Asia/Jakarta').format('DD/MM HH:mm')}${r.repeat ? ' 🔁' : ''} — ${r.text}`)
        return pesan.reply(`⏰ *PENGINGAT KAMU*\n\n${list.join('\n')}\n\nHapus: !hapusingat <nomor>`)
    }
    if (/^(hapusingat|delingat)$/.test(cmd)) {
        let sorted = mine.sort((a, b) => a.at - b.at)
        let target = sorted[parseInt(dt.text) - 1]
        if (!target) return pesan.reply('Nomor tidak ditemukan. Lihat daftar di !pengingat')
        settings.reminders = settings.reminders.filter(r => r !== target)
        return pesan.reply(`🗑️ Pengingat "${target.text}" dihapus`)
    }

    let r = parse(dt.text)
    if (!r) return pesan.reply(`⏰ *Cara pakai*\n!ingatkan 30m minum obat\n!ingatkan 1j30m angkat jemuran\n!ingatkan 07:00 sholat dhuha\n!ingatkan besok 05:00 bangun\n!ingatkan tiap hari 21:00 belajar\n\nSatuan: detik/s, menit/m, jam/j, hari/d`)
    let delay = r.at - Date.now()
    if (delay < 10000) return pesan.reply('Minimal 10 detik dari sekarang')
    if (delay > 365 * DAY) return pesan.reply('Maksimal 1 tahun ke depan')
    if (mine.length >= MAX_PER_USER && !dt.isPremium) return pesan.reply(`Maksimal ${MAX_PER_USER} pengingat. Hapus yang lama dengan !hapusingat`)
    settings.reminders.push({ id: Date.now() + Math.random(), chat: pesan.from, user: dt.sender, text: r.text.slice(0, 500), at: r.at, repeat: r.repeat })
    await pesan.reply(`✅ Oke, aku ingatkan ${r.repeat ? '*setiap hari* ' : ''}pada *${moment(r.at).tz('Asia/Jakarta').format('dddd, DD MMM YYYY HH:mm')} WIB*\n(${formatDuration(delay)} lagi)\n\n📝 ${r.text}`)
}
handler.parse = parse
handler.help = ['ingatkan <waktu> <pesan>', 'pengingat', 'hapusingat <no>']
handler.tags = ['tools']
handler.command = /^(ingatkan|remind(me)?|pengingat|reminders|listingat|hapusingat|delingat)$/i
module.exports = handler
