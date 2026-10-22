const fetch = require('node-fetch')
const handler = {}
handler.main = async function(dt,pesan){
    let res = await fetch('https://masgi.herokuapp.com/api/cerpen')
    if (!res.ok) throw 'Server cerpen sedang error'
    let cerpen = await res.json()
    await pesan.reply(`${cerpen.data}`.trim())
}
handler.command = /^cerpen$/i
handler.help = 'cerpen'
handler.tags = ['quotes']
handler.disabled = true
module.exports = handler