const { fmt, formatDuration } = require('../api/rpg')

const DAY = 86400000
const rewards = {
    daily: { every: DAY, key: 'lastDaily', money: [1000, 3000], exp: 500, limit: 10 },
    weekly: { every: 7 * DAY, key: 'lastWeekly', money: [10000, 20000], exp: 3000, limit: 50 },
    kerja: { every: 3600000, key: 'lastWork', money: [200, 800], exp: 50, limit: 0 },
}
const jobs = [
    ['👨‍🍳', 'jadi koki warteg'], ['🛵', 'narik ojol'], ['💻', 'ngoding website klien'], ['🎣', 'mancing di empang'],
    ['🧹', 'bersih-bersih masjid'], ['📦', 'jadi kurir paket'], ['🎨', 'gambar commission'], ['🌾', 'bantu panen padi'],
    ['🎤', 'nyanyi di kafe'], ['🧑‍🏫', 'ngajar les privat'], ['🔧', 'benerin motor tetangga'], ['📸', 'jadi fotografer nikahan'],
]
const rand = ([a, b]) => a + Math.floor(Math.random() * (b - a + 1))

const handler = {}
handler.main = async function (dt, pesan) {
    let cmd = dt.command.toLowerCase()
    let type = /^(work|kerja)$/.test(cmd) ? 'kerja' : cmd == 'weekly' || cmd == 'mingguan' ? 'weekly' : 'daily'
    let r = rewards[type]
    let user = dt.usr
    let left = user[r.key] + r.every - Date.now()
    if (left > 0) {
        dt.noLimit = true
        return pesan.reply(`⏳ Kamu sudah klaim *${type}*.\nCoba lagi dalam *${formatDuration(left)}*`)
    }
    let money = rand(r.money)
    let extra = ''
    if (type == 'daily') {
        // Streak: klaim lagi dalam 48 jam menambah bonus, maks 10 hari
        user.dailyStreak = Date.now() - user.lastDaily < 2 * DAY ? Math.min((user.dailyStreak || 0) + 1, 10) : 1
        let bonus = (user.dailyStreak - 1) * 300
        money += bonus
        extra = `\n🔥 Streak: *${user.dailyStreak} hari*${bonus ? ` (+${fmt(bonus)} bonus)` : ''}`
    }
    if (type == 'kerja') {
        let [emoji, job] = pickRandom(jobs)
        extra = `\n${emoji} Kamu ${job}`
    }
    user[r.key] = Date.now()
    user.money += money
    user.exp += r.exp
    user.limit += r.limit
    await pesan.reply(`🎁 *${type.toUpperCase()}*${extra}\n\n+💰 ${fmt(money)} money\n+✨ ${fmt(r.exp)} XP${r.limit ? `\n+⛽ ${r.limit} limit` : ''}`)
}
handler.help = ['daily', 'weekly', 'kerja']
handler.tags = ['rpg']
handler.command = /^(daily|harian|claim|weekly|mingguan|work|kerja)$/i
handler.exp = 0
module.exports = handler
