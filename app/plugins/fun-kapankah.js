const handler = {}
handler.main = async function(dt,pesan){
    let caption = `${Math.floor(Math.random() * 100)} ${pickRandom(['detik', 'menit', 'jam', 'hari', 'minggu', 'bulan', 'tahun', 'dekade', 'abad'])} lagi ...
    `.trim()
    await pesan.reply(caption)
}
handler.help = 'kapankah _kalimat_?'
handler.command = /^kapankah$/i
handler.tags = ['kerang']

module.exports = handler