// Jadwal sholat (api.myquran.com) + pengingat waktu sholat otomatis per chat
const fetch = require('node-fetch')
const moment = require('moment-timezone')
const cron = require('../api/cron')

const API = 'https://api.myquran.com/v2/sholat'
const waktu = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya']
const cache = new Map()

async function cariKota(nama) {
    let res = await fetch(`${API}/kota/cari/${encodeURIComponent(nama)}`, { timeout: 15000 })
    let json = await res.json()
    let list = (json && json.status && json.data) || []
    if (!list.length) return null
    let q = nama.trim().toUpperCase()
    return list.find(k => k.lokasi == `KOTA ${q}`) || list.find(k => k.lokasi.endsWith(q)) || list[0]
}

async function jadwal(id, date = moment.tz('Asia/Jakarta')) {
    let key = `${id}:${date.format('YYYY-MM-DD')}`
    if (cache.has(key)) return cache.get(key)
    let res = await fetch(`${API}/jadwal/${id}/${date.format('YYYY/MM/DD')}`, { timeout: 15000 })
    let json = await res.json()
    if (!json || !json.status) throw 'Jadwal sholat tidak tersedia'
    if (cache.size > 200) cache.clear()
    cache.set(key, json.data)
    return json.data
}

// Kirim pengingat saat masuk waktu sholat, untuk chat yang mengaktifkan
cron.register('sholat', async () => {
    if (!server.isReady) return
    let subs = server.settings().sholat
    let now = moment.tz('Asia/Jakarta')
    let hhmm = now.format('HH:mm')
    for (let [chat, sub] of Object.entries(subs)) {
        let data
        try { data = await jadwal(sub.id, now) } catch { continue }
        let name = waktu.find(w => data.jadwal[w] == hhmm)
        let mark = `${now.format('YYYY-MM-DD')}:${name}`
        if (!name || sub.sent == mark) continue
        sub.sent = mark
        await server.client.sendMessage(chat, `🕌 *WAKTU SHOLAT ${name.toUpperCase()}*\nTelah masuk waktu sholat ${name} untuk wilayah *${data.lokasi}* dan sekitarnya (${hhmm} WIB)\n\n_"Sesungguhnya sholat itu adalah kewajiban yang ditentukan waktunya atas orang-orang yang beriman." (QS. An-Nisa: 103)_`).catch(e => console.error('Gagal kirim pengingat sholat', e.message))
    }
})

const handler = {}
handler.main = async function (dt, pesan) {
    let text = dt.text.trim()
    let subs = server.settings().sholat
    let [sub, ...rest] = text.split(/\s+/)
    if (/^(on|aktif|off|mati)$/i.test(sub || '')) {
        if (dt.chat.isGroup) {
            await dt.getAdmin()
            if (!dt.isAdmin && !dt.isOwner) return pesan.reply(global.config.dfail.admin)
        }
        if (/^(off|mati)$/i.test(sub)) {
            delete subs[pesan.from]
            return pesan.reply('🔕 Pengingat waktu sholat dimatikan')
        }
        let kota = await cariKota(rest.join(' ') || 'jakarta')
        if (!kota) return pesan.reply('Kota tidak ditemukan')
        subs[pesan.from] = { id: kota.id, lokasi: kota.lokasi, sent: '' }
        return pesan.reply(`🔔 Pengingat waktu sholat aktif untuk *${kota.lokasi}*\nMatikan dengan !sholat off`)
    }
    if (!text) {
        if (subs[pesan.from]) text = subs[pesan.from].lokasi.replace(/^(KOTA|KAB\.)\s+/, '')
        else return pesan.reply('Contoh:\n!sholat bandung\n!sholat on bandung — pengingat otomatis tiap masuk waktu sholat\n!sholat off')
    }
    let kota = await cariKota(text)
    if (!kota) return pesan.reply(`Kota "${text}" tidak ditemukan`)
    let data = await jadwal(kota.id)
    let j = data.jadwal
    let now = moment.tz('Asia/Jakarta').format('HH:mm')
    let next = waktu.find(w => j[w] > now)
    let rows = ['imsak', 'subuh', 'terbit', 'dhuha', 'dzuhur', 'ashar', 'maghrib', 'isya']
        .map(w => `${w == next ? '👉' : '▫️'} ${w[0].toUpperCase() + w.slice(1)}: *${j[w]}*`)
    await pesan.reply(`🕌 *JADWAL SHOLAT*\n📍 ${data.lokasi}, ${data.daerah}\n📅 ${j.tanggal}\n\n${rows.join('\n')}${next ? `\n\nBerikutnya: *${next}* pukul ${j[next]}` : ''}`)
}
handler.help = ['sholat <kota>', 'sholat on <kota>', 'sholat off']
handler.tags = ['agama', 'info']
handler.command = /^(sholat|shalat|jadwalsholat|solat)$/i
handler.cooldown = 5000
module.exports = handler
