/**
 * Helper media: mengambil media dari pesan/reply, olah gambar (sharp/canvas), dan teks stiker.
 */
const path = require('path')
const fs = require('fs')
const { createCanvas, loadImage, registerFont } = require('canvas')

const impact = [
    process.env.WINDIR && path.join(process.env.WINDIR, 'Fonts', 'impact.ttf'),
    '/usr/share/fonts/truetype/msttcorefonts/Impact.ttf',
    path.join(__dirname, '..', 'library', 'impact.ttf'),
].find(p => p && fs.existsSync(p))
if (impact) try { registerFont(impact, { family: 'Impact' }) } catch { }

// Media dari pesan itu sendiri atau dari pesan yang di-reply. filter: regex mimetype
async function getMedia(pesan, filter) {
    let media
    if (pesan.hasMedia) media = await pesan.downloadMedia()
    else if (pesan.hasQuotedMsg) {
        let quoted = await pesan.getQuotedMessage()
        if (quoted && quoted.hasMedia) media = await quoted.downloadMedia()
    }
    if (!media) return null
    if (filter && !filter.test(media.mimetype)) return null
    media.buffer = Buffer.from(media.data, 'base64')
    return media
}

const toMedia = (buffer, mimetype, filename) => new server.MessageMedia(mimetype, buffer.toString('base64'), filename)

const stickerOptions = (name, author) => ({
    sendMediaAsSticker: true,
    stickerName: name || bot.name,
    stickerAuthor: author || bot.creator,
    stickerCategories: ['🤖'],
})

// Teks meme atas & bawah dengan font Impact
async function memeText(buffer, top, bottom) {
    const sharp = require('sharp')
    const img = await loadImage(await sharp(buffer).png().toBuffer())
    const canvas = createCanvas(img.width, img.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
    ctx.fillStyle = 'white'
    ctx.strokeStyle = 'black'
    ctx.textAlign = 'center'
    const draw = (text, y, baseline) => {
        if (!text) return
        text = text.toUpperCase()
        let size = Math.floor(img.height / 7)
        do {
            ctx.font = `${size}px Impact`
            size -= 2
        } while (ctx.measureText(text).width > img.width * 0.94 && size > 10)
        ctx.lineWidth = Math.max(2, size / 12)
        ctx.lineJoin = 'round'
        ctx.textBaseline = baseline
        ctx.strokeText(text, img.width / 2, y)
        ctx.fillText(text, img.width / 2, y)
    }
    draw(top, img.height * 0.03, 'top')
    draw(bottom, img.height * 0.97, 'bottom')
    return canvas.toBuffer('image/png')
}

// Stiker teks gaya "brat": latar putih, teks hitam rata kiri, sedikit blur
async function bratImage(text) {
    const size = 512, pad = 36
    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = '#000000'
    ctx.textBaseline = 'top'
    const words = text.toLowerCase().split(/\s+/)
    let fontSize = 140, lines
    for (; fontSize > 18; fontSize -= 4) {
        ctx.font = `${fontSize}px Arial`
        lines = []
        let line = ''
        for (let w of words) {
            let test = line ? `${line} ${w}` : w
            if (ctx.measureText(test).width > size - pad * 2 && line) { lines.push(line); line = w }
            else line = test
        }
        lines.push(line)
        let widest = Math.max(...lines.map(l => ctx.measureText(l).width))
        if (lines.length * fontSize * 1.1 <= size - pad * 2 && widest <= size - pad * 2) break
    }
    let y = (size - lines.length * fontSize * 1.1) / 2
    for (let l of lines) {
        ctx.fillText(l, pad, y)
        y += fontSize * 1.1
    }
    return require('sharp')(canvas.toBuffer('image/png')).blur(1.2).png().toBuffer()
}

module.exports = { getMedia, toMedia, stickerOptions, memeText, bratImage }
