const fetch = require('node-fetch')
const fs = require('fs')
const handler = {
    main: async function(dt,pesan){
        await pesan.reply('Mencari...')
        let res = JSON.parse(fs.readFileSync('./app/library/renungan.json'))
        let json = pickRandom(res)
        let media = await server.MessageMedia.fromUrl(json, { unsafeMime: true })
        await server.client.sendMessage(pesan.from,media)
    },
    command: /^renungan$/i,
    help: 'renungan',
    tags: ['quotes']
}
module.exports = handler