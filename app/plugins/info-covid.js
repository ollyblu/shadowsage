const fetch = require('node-fetch')
const handler = {}
handler.main = async function(dt,pesan){
    let text = dt.text.trim()
    if (!text) return pesan.reply('Contoh: !covid indonesia')
    let res = await fetch(global.API('https://covid19.mathdro.id', '/api/countries/'+ (text)))
    if (!res.ok) throw await res.text()
    let json = await res.json()
    if (!json.confirmed) throw 'Negara?'
    if (json.confirmed) await pesan.reply(`
Countries : ${text}
Confirmed : ${json.confirmed.value}
Recovered : ${json.recovered.value}
Deaths : ${json.deaths.value}
Last Update : ${json.lastUpdate}`.trim())
    else throw json
}
handler.help = 'covid|negara'
handler.tags = ['internet','info']
handler.disabled = true
handler.command = /^(corona|covid|covid19)$/i
module.exports = handler