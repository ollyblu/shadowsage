/**
 * Penjadwal sederhana: menjalankan semua job setiap 30 detik.
 * Plugin bisa mendaftarkan job sendiri lewat register(nama, fn); nama yang sama
 * menimpa job lama sehingga aman saat plugin di-hot-reload.
 */
const chalk = require('chalk')
const moment = require('moment-timezone')

const INTERVAL = 30 * 1000
const jobs = new Map()

function register(name, fn) {
    jobs.set(name, fn)
}

const ready = () => server.isReady && server.client

// Reset limit harian tiap 00:00 WIB. Limit yang dibeli melebihi default tidak dipotong.
register('resetLimit', async () => {
    let settings = server.settings()
    let today = moment.tz('Asia/Jakarta').format('YYYY-MM-DD')
    if (settings.lastReset == today) return
    let def = global.config.defaultLimit || 70
    for (let user of Object.values(global.db.users.data || {})) {
        if (user && typeof user == 'object' && !(user.limit >= def)) user.limit = def
    }
    settings.lastReset = today
    console.log(chalk.greenBright(`Limit harian direset (${today})`))
})

// Premium yang sudah lewat masa berlakunya dinonaktifkan
register('premiumExpire', async () => {
    let now = Date.now()
    for (let [id, user] of Object.entries(global.db.users.data || {})) {
        if (!user || !user.premium || !(user.premiumTime > 0) || user.premiumTime > now) continue
        user.premium = false
        user.premiumTime = 0
        if (ready()) await server.client.sendMessage(id, '💎 Masa premium kamu sudah *habis*.\nTerima kasih sudah mendukung bot ini!').catch(() => { })
    }
})

// Pengingat dari plugin !ingatkan
register('reminders', async () => {
    if (!ready()) return
    let settings = server.settings()
    let now = Date.now()
    let due = settings.reminders.filter(r => r.at <= now)
    if (!due.length) return
    settings.reminders = settings.reminders.filter(r => r.at > now)
    for (let r of due) {
        let text = `⏰ *PENGINGAT*\n@${r.user.split('@')[0]}: ${r.text}`
        await server.client.sendMessage(r.chat, text, { mentions: [r.user] }).catch(e => console.error('Gagal kirim pengingat', e.message))
        if (r.repeat) settings.reminders.push({ ...r, at: r.at + r.repeat * Math.ceil((now - r.at + 1) / r.repeat) })
    }
})

let running = false
async function tick() {
    if (running || !global.db.settings.data) return
    running = true
    try {
        for (let [name, fn] of jobs) {
            try { await fn() } catch (e) { console.error(chalk.redBright(`[cron:${name}]`), e) }
        }
    } finally { running = false }
}

function start() {
    if (global.cronTimer) clearInterval(global.cronTimer)
    global.cronTimer = setInterval(tick, INTERVAL)
    tick()
}

module.exports = { start, register, jobs }
