const aksara = require('@sajenid/aksara.js')
const handler = {}
handler.main = async function(dt,pesan){
    // let pos = pesan.body.indexOf('|')
    // if(pos<5)return pesan.reply('Apa yang ingin di translate?\nContoh\n!aksara sekolah')
    let target = dt.text.trim()
    if(!target) return pesan.reply('Apa yang ingin di translate?\nContoh\n!aksara sekolah')
    let hasil = aksara.LatinKeAksara(target)
    await pesan.reply(hasil)
}
handler.help = 'aksara Pesan...'
handler.command = /^(aksara|tr-aksara)$/i
handler.tags = ['translate']
module.exports = handler