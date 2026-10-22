const sharp = require('sharp')
const { getMedia, toMedia } = require('../api/media-tools')
const { runFfmpeg, withTempFiles, toVoiceNote } = require('../api/connection/convert')

const imageOps = {
    async hd(buf) {
        let { width, height } = await sharp(buf).metadata()
        let scale = Math.min(2, 4096 / Math.max(width, height))
        return sharp(buf).resize(Math.round(width * scale), Math.round(height * scale), { kernel: 'lanczos3' })
            .sharpen({ sigma: 1.2 }).modulate({ saturation: 1.08 }).jpeg({ quality: 95 }).toBuffer()
    },
    blur: (buf, n) => sharp(buf).blur(Math.min(50, Math.max(1, Number(n) || 8))).jpeg({ quality: 90 }).toBuffer(),
    gray: buf => sharp(buf).grayscale().jpeg({ quality: 90 }).toBuffer(),
    invert: buf => sharp(buf).negate({ alpha: false }).jpeg({ quality: 90 }).toBuffer(),
}

const handler = {}
handler.main = async function (dt, pesan) {
    let cmd = dt.command.toLowerCase()
    cmd = { remini: 'hd', upscale: 'hd', grayscale: 'gray', negatif: 'invert', mp3: 'tomp3', toaudio: 'tomp3', tovn: 'vn' }[cmd] || cmd
    if (imageOps[cmd]) {
        let media = await getMedia(pesan, /^image\/(jpe?g|png|webp)$/)
        if (!media) return pesan.reply(`Kirim/reply gambar dengan !${dt.command}`)
        let out = await imageOps[cmd](media.buffer, dt.text.trim())
        return server.client.sendMessage(pesan.from, toMedia(out, 'image/jpeg', `${cmd}.jpg`), { caption: `✅ ${cmd.toUpperCase()}` })
    }
    let media = await getMedia(pesan, /^(video|audio)\//)
    if (!media) return pesan.reply(`Kirim/reply video atau audio dengan !${dt.command}`)
    if (cmd == 'tomp3') {
        let mp3 = await withTempFiles(media.buffer, 'media', 'mp3', (inFile, outFile) => runFfmpeg(['-i', inFile, '-vn', '-c:a', 'libmp3lame', '-b:a', '128k', outFile]))
        return server.client.sendMessage(pesan.from, toMedia(mp3, 'audio/mpeg', 'audio.mp3'))
    }
    if (cmd == 'vn') {
        let voice = await toVoiceNote(media.buffer, media.mimetype.startsWith('video/') ? 'video/mp4' : media.mimetype)
        return server.client.sendMessage(pesan.from, toMedia(voice.buffer, 'audio/ogg; codecs=opus', 'vn.ogg'), { sendAudioAsVoice: true })
    }
    if (cmd == 'togif') {
        if (!media.mimetype.startsWith('video/')) return pesan.reply('Reply video dengan !togif')
        return server.client.sendMessage(pesan.from, media, { sendVideoAsGif: true })
    }
}
handler.help = ['hd', 'blur [1-50]', 'gray', 'invert', 'tomp3', 'vn', 'togif']
handler.tags = ['media']
handler.command = /^(hd|remini|upscale|blur|gray|grayscale|invert|negatif|tomp3|mp3|toaudio|vn|tovn|togif)$/i
handler.limit = true
handler.cooldown = 8000
module.exports = handler
