const handler = {}
handler.main = async function(dt,pesan){
    if(!server.isOwner(dt.sender))return pesan.reply('Hanya owner yang bisa ngecit 😏😋')
    if(dt.args.length<2){
        return pesan.reply('Variabel apa yang ingin diubah?')
    }else if(dt.args.length<3){
        return pesan.reply('Berapa nilainya?')
    }
    let nilai = dt.args[2]
    dt.usr[dt.args[1]] = nilai.trim() !== '' && !isNaN(Number(nilai)) ? Number(nilai) : nilai
    return pesan.reply(explainObject(dt.usr))
}
handler.command = /^cheat$/i
handler.help = 'cheat'
module.exports = handler