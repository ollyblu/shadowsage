const {instagramdl} = require('@bochilteam/scraper')
const delay = time => new Promise(res => setTimeout(res,time))
const handler = {}
handler.main = async function(dt,pesan){
    let text = dt.text.trim()
    if(!text)return pesan.reply(`*Perintah ini untuk mengunduh postingan ig/reel/tv, bukan untuk highlight/story!*\n\ncontoh:\n!ig https://www.instagram.com/p/CeV80M7vaUs/`)
    //if(!text.match(/https:\/\/?www.instagram.com\/(p|reel|tv)/gi))return pesan.reply(`*Link salah! Perintah ini untuk mengunduh postingan ig/reel/tv, bukan untuk highlight/story!*\n\ncontoh:\n!ig https://www.instagram.com/p/CeV80M7vaUs/`)
    let json = await instagramdl(text)
    await pesan.reply('Silahkan tunggu...')
    for(let i=0;i<json.length;i++){
        let type = json[i].type
        let url = json[i].url
        let media = await server.MessageMedia.fromUrl(url,{unsafeMime:true,filename:(type=='image'?`${Date.now()}.jpg`:`${Date.now()}.mp4`)})
        await server.client.sendMessage(pesan.from,media)
        await delay(1500)
    }
}
handler.help = 'ig <url>'
handler.tag = ['downloader','internet']
handler.command = /^(ig|igdl|instagram)$/i
handler.disabled = true
module.exports = handler
