const handler = {}
handler.main = async function(dt,pesan){
    let caption = `${pickRandom(['Iya', 'Bisa', 'Tentu saja bisa', 'Tentu bisa', 'Sudah pasti', 'Sudah pasti bisa', 'Tidak', 'Tidak bisa', 'Tentu tidak', 'tentu tidak bisa', 'Sudah pasti tidak'])}
    `.trim()
    await pesan.reply(caption)
}
handler.help = 'bisakah _kalimat_?'
handler.command = /^bisakah$/i
handler.tags = ['kerang']

module.exports = handler