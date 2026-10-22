/**
 * MessageMedia yang kompatibel dengan whatsapp-web.js, dipakai oleh adapter Baileys.
 * API sama: new MessageMedia(mimetype, base64, filename), fromFilePath(), fromUrl()
 */
const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')

const extMime = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
    mp4: 'video/mp4', mkv: 'video/x-matroska', webm: 'video/webm', '3gp': 'video/3gpp',
    mp3: 'audio/mpeg', ogg: 'audio/ogg', opus: 'audio/ogg', m4a: 'audio/mp4', wav: 'audio/wav',
    pdf: 'application/pdf', txt: 'text/plain', json: 'application/json', zip: 'application/zip',
}
const mimeExt = Object.fromEntries(Object.entries(extMime).reverse().map(([e, m]) => [m, e]))

function sniffMime(buf) {
    if (!buf || buf.length < 12) return undefined
    const hex = buf.subarray(0, 12).toString('hex')
    const ascii = buf.subarray(0, 12).toString('latin1')
    if (hex.startsWith('89504e47')) return 'image/png'
    if (hex.startsWith('ffd8ff')) return 'image/jpeg'
    if (ascii.startsWith('GIF8')) return 'image/gif'
    if (ascii.startsWith('RIFF') && ascii.slice(8, 12) == 'WEBP') return 'image/webp'
    if (ascii.slice(4, 8) == 'ftyp') return ascii.slice(8, 11) == 'M4A' ? 'audio/mp4' : 'video/mp4'
    if (ascii.startsWith('OggS')) return 'audio/ogg'
    if (ascii.startsWith('ID3') || hex.startsWith('fffb') || hex.startsWith('fff3')) return 'audio/mpeg'
    if (ascii.startsWith('%PDF')) return 'application/pdf'
    if (hex.startsWith('1a45dfa3')) return 'video/webm'
    return undefined
}

class MessageMedia {
    constructor(mimetype, data, filename, filesize) {
        this.mimetype = mimetype
        this.data = data
        this.filename = filename
        this.filesize = filesize
    }
    static fromFilePath(filePath) {
        const buf = fs.readFileSync(filePath)
        const ext = path.extname(filePath).slice(1).toLowerCase()
        const mimetype = extMime[ext] || sniffMime(buf) || 'application/octet-stream'
        return new MessageMedia(mimetype, buf.toString('base64'), path.basename(filePath), buf.length)
    }
    static async fromUrl(url, options = {}) {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0 Safari/537.36' },
            timeout: 60000,
            ...(options.reqOptions || {}),
        })
        if (!res.ok) throw new Error(`Gagal mengunduh media (${res.status}) dari ${url}`)
        const buf = await res.buffer()
        let mimetype = (res.headers.get('content-type') || '').split(';')[0].trim()
        if (!mimetype || mimetype == 'application/octet-stream' || mimetype == 'binary/octet-stream') mimetype = sniffMime(buf) || mimetype
        if (!mimetype) {
            if (!options.unsafeMime) throw new Error('Unable to determine MIME type using URL. Set unsafeMime to true to download it anyway.')
            mimetype = 'application/octet-stream'
        }
        let filename = options.filename
        if (!filename) {
            try { filename = decodeURIComponent(path.basename(new URL(res.url || url).pathname)) } catch { }
            if (!filename || !filename.includes('.')) filename = `file.${mimeExt[mimetype] || 'bin'}`
        }
        return new MessageMedia(mimetype, buf.toString('base64'), filename, buf.length)
    }
}
MessageMedia.sniffMime = sniffMime
MessageMedia.mimeExt = mimeExt
module.exports = MessageMedia
