const {Alkitab} = require('@anchovy_studios/alkitab')
const util = require('util')
const myAlkitab = new Alkitab()
const handler = {}
handler.main = async function(dt,pesan){
    myAlkitab.clearErrors(Date.now.toString())
    if(dt.args.length<2)return pesan.reply('Masukkan nama kitab\n('+Alkitab.getBookList().join(',')+')\n Contoh .alkitab 1 ')
    if(dt.args.length<3)return pesan.reply('Masukkan nomor pasal')
    if(dt.args[1]=='Kidung'){dt.args[1]+= " "+dt.args[2];dt.args.splice(2,1)}
    if(Number(dt.args[1])>0){dt.args[1]+= " "+dt.args[2];dt.args.splice(2,1)}
    try{
    //let text = myAlkitab.getVerse(dt.args[1],dt.args[2],dt.args[3]&&!dt.args[4]?dt.args[3]:undefined)
    let text = myAlkitab.getVerse(dt.args[1],dt.args[2])
    let baris =''
    if(!dt.args[3] || dt.args[4])
    for(let ayat=Number(dt.args[3])||0;ayat<dt.args[4]-1>0||ayat.length;ayat++){
        if(!text[ayat])break
        baris += `${Number(ayat)+1}. ${text[ayat]}`
    }
    else baris += text
    pesan.reply(baris)}
    catch(error){
        pesan.reply(error.name +'\n'+error.message)
        console.log(error)
        //pesan.reply(util.format(error))
    }
    // let err = myAlkitab.get
    // if(err)pesan.reply(err)
}
handler.command = /^alkitab$/i
handler.help = 'alkitab'
handler.tags = ['agama','buku']
handler.disabled = true
module.exports = handler