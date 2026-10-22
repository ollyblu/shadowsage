const fetch = require('node-fetch')
const fs = require('fs')
const handler = {
    main: async function(dt,pesan){
        await pesan.reply('Mencari...')
        let res = await fetch(`https://katanime.vercel.app/api/getrandom`)
        if (!res.ok) throw 'error'
        let json = await res.json()
        if (!json.sukses) throw 'error'
        let quotes = pickRandom(json.result)
        let kataid = `"${quotes.indo}"

- ${quotes.character} dari ${quotes.anime}`
    let kataen = `"${quotes.english}"

- ${quotes.character} from ${quotes.anime}`
        await pesan.reply(kataid)
        await pesan.reply(kataen)
    },
    command: /^katanime$/i,
    help: 'katanime',
    tags: ['quotes']
}
module.exports = handler