const handler = {}
handler.main = async function(dt,pesan){
    let caption = `${pickRandom(['Ya', 'Mungkin iya', 'Mungkin', 'Mungkin tidak', 'Tidak', 'Tidak mungkin'])}
      `.trim()
    pesan.reply(caption)
}
handler.help = 'apakah _kalimat_?'
handler.command = /^apakah$/i
handler.tags = ['kerang']
//handler.disabled = true
module.exports = handler