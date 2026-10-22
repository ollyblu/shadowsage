const handler = {}
const fs = require('fs')
handler.all = async function(dt,pesan){
    let gid = dt.room_id
    if(pesan.hasMedia && pesan._data && pesan._data.isViewOnce){
        try{
            console.log('mulai mengunduh')
            try{
                fs.readdirSync(`./app/saved/viewonce/${gid}`)
            }catch{
                fs.mkdirSync(`./app/saved/viewonce/${gid}`)
            }
            let media = await pesan.downloadMedia()
            fs.writeFileSync(`./app/saved/viewonce/${gid}/${pesan.timestamp}.jpg`,media.data,{encoding:'base64'})
            console.log('clear')
        }catch(e){console.log(e)}
    }
}
module.exports = handler