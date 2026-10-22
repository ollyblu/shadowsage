const fs = require('fs')
const { download } = require('../api/ytdlp')

const isUrl = t => /^https?:\/\/\S+$/i.test(t)
const sites = {
    tiktok: /tiktok\.com/i, ig: /instagram\.com/i, fb: /(facebook\.com|fb\.watch)/i,
    twitter: /(twitter\.com|x\.com)/i, pin: /(pinterest\.|pin\.it)/i,
}
const alias = { tt: 'tiktok', igdl: 'ig', instagram: 'ig', facebook: 'fb', x: 'twitter', pinterest: 'pin', video: 'ytmp4', yt: 'ytmp4', play: 'ytmp3', lagu: 'ytmp3', song: 'ytmp3' }

const handler = {}
handler.main = async function (dt, pesan) {
    let cmd = dt.command.toLowerCase()
    cmd = alias[cmd] || cmd
    let text = dt.text.trim()
    let audio = cmd == 'ytmp3'
    if (!text) {
        dt.noLimit = true
        return pesan.reply(audio ? `Contoh:\n!play jamrud pelangi di matamu\n!ytmp3 https://youtu.be/...` : `Contoh: !${dt.command} <link>`)
    }
    if (!isUrl(text)) {
        // Selain YouTube, wajib link
        if (!cmd.startsWith('yt')) {
            dt.noLimit = true
            return pesan.reply('Masukkan link yang valid')
        }
        text = `ytsearch1:${text}`
    } else if (sites[cmd] && !sites[cmd].test(text)) {
        dt.noLimit = true
        return pesan.reply(`Itu bukan link ${cmd}`)
    }
    await pesan.reply(`⏳ Mengunduh ${audio ? 'audio' : 'video'}...`)
    let res
    try {
        res = await download(text, { audio })
    } catch (e) {
        dt.noLimit = true
        throw `❌ Gagal mengunduh: ${e}\n\n_Kalau terus gagal, minta owner meng-update yt-dlp_`
    }
    try {
        let media = server.MessageMedia.fromFilePath(res.file)
        if (audio) media.mimetype = 'audio/mpeg'
        let dur = res.duration ? ` (${Math.floor(res.duration / 60)}:${String(Math.floor(res.duration % 60)).padStart(2, '0')})` : ''
        if (audio) {
            await pesan.reply(`🎵 *${res.title}*${dur}`)
            await server.client.sendMessage(pesan.from, media)
        } else await server.client.sendMessage(pesan.from, media, { caption: `🎬 *${res.title}*${dur}` })
    } finally {
        fs.promises.unlink(res.file).catch(() => { })
    }
}
handler.help = ['play <judul>', 'ytmp3 <link>', 'ytmp4 <link|judul>', 'tiktok <link>', 'ig <link>', 'fb <link>', 'twitter <link>', 'pin <link>', 'dl <link>']
handler.tags = ['downloader']
handler.command = /^(play|lagu|song|ytmp3|ytmp4|yt|video|tiktok|tt|ig|igdl|instagram|fb|facebook|twitter|x|pin|pinterest|dl)$/i
handler.limit = 2
handler.cooldown = 20000
module.exports = handler
