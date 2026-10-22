const handler = {}
handler.main = async function(dt,pesan){
    let te = pickRandom(['cantik', 'ganteng', 'pintar','cool','bijak','tampan','cerdas','genius'])
    let ra = Math.round(Math.random()*100)
    let caption = `${te} ${ra}%`
    await pesan.reply(caption)

}
handler.help = 'rate _kalimat_?'
handler.command = /^rate$/i
handler.tags = ['kerang']

module.exports = handler