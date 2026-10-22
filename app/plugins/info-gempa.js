const fetch = require('node-fetch')
// API resmi BMKG (scraping halaman HTML lama sudah tidak berfungsi)
const API = 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json'
const SHAKEMAP = 'https://data.bmkg.go.id/DataMKG/TEWS/'

const handler = {}
handler.main = async function (dt, pesan) {
    let res = await fetch(API, { timeout: 20000 })
    if (!res.ok) throw `Gagal mengambil data dari BMKG (status ${res.status})`
    let json = await res.json()
    let g = json && json.Infogempa && json.Infogempa.gempa
    if (!g) throw 'Data gempa tidak ditemukan'
    let jam = (g.Jam || '').split(' ')[0] || '00:00:00'
    const teks = `*[ INFORMASI GEMPA INDONESIA ]*\n
${clockEmot(jam.replace(/:/g, '-'))} Waktu: *${g.Tanggal} (${g.Jam})*
🧭 Bujur: *${g.Bujur}*
🧭 Lintang: *${g.Lintang}*
📡 Magnitudo: *${g.Magnitude}*
🌋 Kedalaman: *${g.Kedalaman}*
📍 Lokasi: *${g.Wilayah}*
🌊 Potensi: *${g.Potensi || 'Tidak Diketahui'}*${g.Dirasakan ? `\n🙌 Dirasakan: *${g.Dirasakan}*` : ''}`.trim()
    if (g.Shakemap) {
        try {
            let media = await server.MessageMedia.fromUrl(SHAKEMAP + g.Shakemap, { unsafeMime: true })
            return await server.client.sendMessage(pesan.from, media, { caption: teks })
        } catch (e) {
            console.error('Gagal mengambil shakemap', e.message)
        }
    }
    await pesan.reply(teks)
}
handler.command = /^(infogempa|gempa|bmkg)$/i
handler.help = 'infogempa'
handler.tags = ['info']
module.exports = handler
