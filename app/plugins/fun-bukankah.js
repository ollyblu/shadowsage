const handler = {}
handler.main = async function(dt,pesan){
    let caption = `${pickRandom(['Bukan', 'Tentu Bukan', 'Yaa... Bukan', 'Bukan lagi', 'Bukan dong', 'Sudah dipastikan'])}
    `.trim()
    pesan.reply(caption)
}
handler.help = 'bukankah _kalimat_?'
handler.command = /^bukankah$/i
handler.tags = ['kerang']

module.exports = handler