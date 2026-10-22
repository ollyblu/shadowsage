const crypto = require('crypto')
const handler = {}
handler.main = async function (dt, pesan) {
    // Format: !encryptaes <panjang karakter kunci> <kunci> <teks>
    let match = dt.text.match(/^(\d+)\s([\s\S]+)$/)
    if (!match) return pesan.reply('Untuk mengenkripsi pesan ketik\n!encryptaes <panjang karakter kunci> <kunci> <teks>\nContoh\n!encryptaes 10 shadowsage Apacoba dicoba\n!encryptaes 10 pake nanya Apacoba dicoba')
    let panjangkunci = Number(match[1])
    if (!(panjangkunci >= 1)) return pesan.reply('Panjang karakter kunci harus angka >= 1')
    let kunci = match[2].slice(0, panjangkunci)
    let teks = match[2].slice(panjangkunci).trim()
    if (kunci.length < panjangkunci || !teks) return pesan.reply('Kunci atau teks kurang lengkap')
    const salt = crypto.randomBytes(8)
    const key = crypto.scryptSync(kunci, salt, 32)
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    const encrypted = Buffer.concat([salt, iv, cipher.update(teks, 'utf8'), cipher.final()]).toString('base64')
    await pesan.reply(encrypted)
}
handler.command = /^encryptaes$/i
handler.help = 'encryptaes'
handler.tags = ['tools']
handler.disabled = true
module.exports = handler
