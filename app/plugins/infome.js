const handler = {}
handler.main = async function(dt,pesan){
    //let text = await explainObject(global.db.users.data[pesan.author || pesan.from])
    let text = explainObject(dt.usr)
    await pesan.reply(text)
}
handler.command = /^infome$/i
handler.help = 'infome'
handler.tags = ['info']
handler.disabled = true // digantikan rpg-profile.js (!profile)
module.exports = handler