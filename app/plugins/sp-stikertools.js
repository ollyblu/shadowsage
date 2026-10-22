const fetch = require('node-fetch')
const { getMedia, toMedia, stickerOptions, memeText, bratImage } = require('../api/media-tools')

const emojiRe = /\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*/gu

const actions = {
    async smeme(dt, pesan) {
        let media = await getMedia(pesan, /^image\//)
        let [top, bottom] = dt.text.split('|').map(s => (s || '').trim())
        if (!media || (!top && !bottom)) return pesan.reply('Kirim/reply gambar dengan caption\n!smeme teks atas|teks bawah')
        let png = await memeText(media.buffer, top, bottom)
        await server.client.sendMessage(pesan.from, toMedia(png, 'image/png', 'smeme.png'), stickerOptions())
    },
    async swm(dt, pesan) {
        let media = await getMedia(pesan, /^(image|video)\//)
        if (!media) return pesan.reply('Reply stiker/gambar dengan !swm nama pack|author')
        let [name, author] = dt.text.split('|').map(s => (s || '').trim())
        await server.client.sendMessage(pesan.from, media, stickerOptions(name || dt.usr.name || `@${dt.sender.split('@')[0]}`, author || ' '))
    },
    async brat(dt, pesan) {
        let text = dt.text.trim()
        if (!text && pesan.hasQuotedMsg) text = (await pesan.getQuotedMessage()).body || ''
        if (!text) return pesan.reply('Contoh: !brat aku ga marah cuma kecewa')
        let png = await bratImage(text.slice(0, 200))
        await server.client.sendMessage(pesan.from, toMedia(png, 'image/png', 'brat.png'), stickerOptions())
    },
    async emojimix(dt, pesan) {
        let emojis = dt.text.match(emojiRe) || []
        if (emojis.length < 2) return pesan.reply('Contoh: !emojimix 😀+🔥')
        let res = await fetch(`https://emojik.vercel.app/s/${encodeURIComponent(emojis[0])}_${encodeURIComponent(emojis[1])}?size=256`, { timeout: 15000 })
        if (!res.ok || !/image/.test(res.headers.get('content-type') || '')) return pesan.reply('Kombinasi emoji itu belum tersedia 😢')
        await server.client.sendMessage(pesan.from, toMedia(await res.buffer(), 'image/png', 'emojimix.png'), stickerOptions())
    },
    async toimg(dt, pesan) {
        let media = await getMedia(pesan, /^image\/webp$/)
        if (!media) return pesan.reply('Reply stiker dengan !toimg')
        let png = await require('sharp')(media.buffer).png().toBuffer()
        await server.client.sendMessage(pesan.from, toMedia(png, 'image/png', 'stiker.png'), { caption: '✅ Stiker jadi gambar' })
    },
}
const alias = { stikermeme: 'smeme', wm: 'swm', take: 'swm', mix: 'emojimix', toimage: 'toimg' }

const handler = {}
handler.main = async function (dt, pesan) {
    let name = dt.command.toLowerCase()
    await actions[alias[name] || name](dt, pesan)
}
handler.help = ['smeme atas|bawah', 'swm pack|author', 'brat <teks>', 'emojimix 😀+🔥', 'toimg']
handler.tags = ['stiker']
handler.command = /^(smeme|stikermeme|swm|wm|take|brat|emojimix|mix|toimg|toimage)$/i
handler.limit = true
handler.cooldown = 5000
module.exports = handler
