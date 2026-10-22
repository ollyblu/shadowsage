/**
 * Utilitas ekonomi: format uang, parsing jumlah, dan katalog item toko.
 */
const fmt = n => Math.floor(Number(n) || 0).toLocaleString('id-ID')
const money = n => `💰 ${fmt(n)}`

// "5000", "5k", "1.5jt", "all"/"semua" -> angka bulat (null bila tidak valid)
function parseAmount(text, max) {
    let t = `${text || ''}`.trim().toLowerCase().replace(/,/g, '.')
    if (/^(all|semua|max)$/.test(t)) return Math.floor(max || 0)
    let m = t.match(/^(\d+(?:\.\d+)?)\s*(k|rb|ribu|jt|juta|m)?$/)
    if (!m) return null
    let n = parseFloat(m[1]) * ({ k: 1e3, rb: 1e3, ribu: 1e3, jt: 1e6, juta: 1e6, m: 1e6 }[m[2]] || 1)
    return Math.floor(n)
}

function formatDuration(ms) {
    let s = Math.ceil(ms / 1000)
    let d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60)
    return [d && `${d} hari`, h && `${h} jam`, m && `${m} menit`, !d && !h && !m && `${s} detik`].filter(Boolean).join(' ')
}

// Katalog toko. use(dt, pesan, user) mengembalikan teks hasil atau melempar string bila gagal
const items = {
    petunjuk: {
        name: '🔎 Kartu Petunjuk', price: 400,
        desc: 'Lihat clue game tebak-tebakan tanpa memotong limit',
    },
    shield: {
        name: '🛡️ Perisai', price: 2500,
        desc: 'Otomatis menangkis 1x percobaan !rob',
    },
    lootbox: {
        name: '🎁 Kotak Misteri', price: 1500,
        desc: 'Isi acak: money, limit, kartu petunjuk, atau perisai',
    },
    premium: {
        name: '💎 Tiket Premium 1 Hari', price: 25000,
        desc: 'Premium 24 jam: limit tak terbatas & fitur premium',
    },
}

module.exports = { fmt, money, parseAmount, formatDuration, items }
