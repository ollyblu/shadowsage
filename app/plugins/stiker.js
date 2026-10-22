const { createCanvas, loadImage, registerFont } = require('canvas')
const path = require('path')
const fs = require('fs')
// Utamakan font Impact bawaan sistem (Windows); file di library dipakai sebagai cadangan
const fontPath = [
    process.env.WINDIR && path.join(process.env.WINDIR, 'Fonts', 'impact.ttf'),
    '/usr/share/fonts/truetype/msttcorefonts/Impact.ttf',
    path.join(__dirname, '..', 'library', 'impact.ttf'),
].find(p => p && fs.existsSync(p))
registerFont(fontPath, { family: 'Impact' })

const handler = {}
handler.main = async function (dt, pesan) {
    let media
    if (pesan.hasMedia) {
        media = await pesan.downloadMedia()
    } else if (pesan.hasQuotedMsg) {
        let qoutedM = await pesan.getQuotedMessage()
        if (qoutedM.hasMedia) {
            media = await qoutedM.downloadMedia()
        } else {
            return pesan.reply(`Silahkan kirim gambar dengan caption *!stiker* atau reply gambar dengan perintah *!stiker*`)
        }
    } else {
        return pesan.reply(`Silahkan kirim gambar dengan caption *!stiker* atau reply gambar dengan perintah *!stiker*`)
    }
    if (!media) return pesan.reply('Terdapat kesalahan, media tidak bisa diunduh')
    let pos = pesan.body.indexOf('|')
    let text = pos > 0 ? pesan.body.slice(pos + 1).trim() : ''
    if (text && /^image\/(jpe?g|png|webp)$/.test(media.mimetype)) {
        let buffer = await addTexttoImage(Buffer.from(media.data, 'base64'), text)
        media = new server.MessageMedia('image/jpeg', buffer.toString('base64'), 'stiker.jpg')
    }
    let options = {
        sendMediaAsSticker: true,
        stickerAuthor: bot.creator,
        stickerName: bot.name,
        stickerCategories: ['👍🏻']
    }
    await server.client.sendMessage(pesan.from, media, options)
}
handler.help = 'stiker <|text>'
handler.tags = ['stiker', 'top']
handler.command = /^(stiker|sticker)$/i
async function addTexttoImage(imageBuffer, teks) {
    const image = await loadImage(imageBuffer)
    const width = image.width
    const height = image.height
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0, width, height)
    let fontSize = Math.max(16, Math.floor(Math.min(width, height) * 0.12))
    ctx.font = `${fontSize}px Impact`
    // Kecilkan font bila teks terlalu lebar
    while (ctx.measureText(teks).width > width * 0.95 && fontSize > 12) {
        fontSize -= 2
        ctx.font = `${fontSize}px Impact`
    }
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.strokeStyle = 'black'
    ctx.lineWidth = Math.max(2, Math.floor(fontSize / 8))
    const x = width / 2
    const y = height / 2
    ctx.strokeText(teks, x, y)
    ctx.fillText(teks, x, y)
    return canvas.toBuffer('image/jpeg')
}
module.exports = handler
