// Cuaca dari open-meteo.com (gratis, tanpa API key)
const fetch = require('node-fetch')

const wmo = {
    0: '☀️ Cerah', 1: '🌤️ Cerah berawan', 2: '⛅ Berawan sebagian', 3: '☁️ Mendung',
    45: '🌫️ Berkabut', 48: '🌫️ Kabut beku',
    51: '🌦️ Gerimis ringan', 53: '🌦️ Gerimis', 55: '🌧️ Gerimis lebat',
    61: '🌧️ Hujan ringan', 63: '🌧️ Hujan sedang', 65: '🌧️ Hujan lebat',
    80: '🌦️ Hujan lokal ringan', 81: '🌧️ Hujan lokal', 82: '⛈️ Hujan lokal lebat',
    95: '⛈️ Badai petir', 96: '⛈️ Badai petir + es', 99: '⛈️ Badai petir hebat',
}
const desc = code => wmo[code] || `Kode cuaca ${code}`

const handler = {}
handler.main = async function (dt, pesan) {
    let kota = dt.text.trim()
    if (!kota) return pesan.reply('Contoh: !cuaca bandung')
    let geo = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(kota)}&count=1&language=id`, { timeout: 15000 })).json()
    let loc = geo.results && geo.results[0]
    if (!loc) return pesan.reply(`Lokasi "${kota}" tidak ditemukan`)
    let url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=3`
    let w = await (await fetch(url, { timeout: 15000 })).json()
    let c = w.current
    let hari = ['Hari ini', 'Besok', 'Lusa']
    let daily = w.daily.time.map((t, i) => `${hari[i]}: ${desc(w.daily.weather_code[i])}, ${Math.round(w.daily.temperature_2m_min[i])}–${Math.round(w.daily.temperature_2m_max[i])}°C, hujan ${w.daily.precipitation_probability_max[i] ?? '-'}%`)
    await pesan.reply(`🌍 *CUACA ${loc.name.toUpperCase()}*\n📍 ${[loc.admin1, loc.country].filter(Boolean).join(', ')}\n\n${desc(c.weather_code)}\n🌡️ Suhu: *${c.temperature_2m}°C* (terasa ${c.apparent_temperature}°C)\n💧 Kelembapan: *${c.relative_humidity_2m}%*\n💨 Angin: *${c.wind_speed_10m} km/j*\n\n📅 *Prakiraan*\n${daily.join('\n')}`)
}
handler.help = 'cuaca <kota>'
handler.tags = ['info']
handler.command = /^(cuaca|weather)$/i
handler.cooldown = 5000
module.exports = handler
