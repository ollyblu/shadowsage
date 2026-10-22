const handler = {}
handler.main = async function(dt,pesan){
    let caption = `${pickRandom(['Iya', 'Sudah pasti', 'Sudah pasti benar', 'Tidak', 'Tentu tidak', 'Sudah pasti tidak'])}
    `.trim()
    pesan.reply(caption)
}
handler.help = 'benarkah _kalimat_?'
handler.command = /^benarkah$/i
handler.tags = ['kerang']

module.exports = handler