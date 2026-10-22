/**
 * Konversi media untuk adapter Baileys:
 * - gambar/GIF/video -> stiker WebP 512x512 (+ metadata nama pack & author)
 * - audio -> ogg/opus untuk voice note
 * Gambar memakai sharp; video & audio butuh ffmpeg (FFMPEG_PATH atau ffmpeg di PATH).
 */
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawn } = require('child_process')

const ffmpegPath = () => process.env.FFMPEG_PATH || 'ffmpeg'

function runFfmpeg(args) {
    return new Promise((resolve, reject) => {
        const proc = spawn(ffmpegPath(), ['-y', '-hide_banner', '-loglevel', 'error', ...args], { windowsHide: true })
        let stderr = ''
        proc.stderr.on('data', d => stderr += d)
        proc.on('error', e => reject(e.code == 'ENOENT'
            ? new Error('ffmpeg tidak ditemukan. Install ffmpeg atau set FFMPEG_PATH')
            : e))
        proc.on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg gagal (${code}): ${stderr.trim()}`)))
    })
}

async function withTempFiles(input, inExt, outExt, fn) {
    const base = path.join(os.tmpdir(), `shadowsage_${Date.now()}_${Math.random().toString(36).slice(2)}`)
    const inFile = `${base}.${inExt}`
    const outFile = `${base}.${outExt}`
    await fs.promises.writeFile(inFile, input)
    try {
        await fn(inFile, outFile)
        return await fs.promises.readFile(outFile)
    } finally {
        fs.promises.unlink(inFile).catch(() => { })
        fs.promises.unlink(outFile).catch(() => { })
    }
}

function stickerExif({ name = '', author = '', categories = [] } = {}) {
    const json = {
        'sticker-pack-id': 'shadowsage-' + Date.now(),
        'sticker-pack-name': name,
        'sticker-pack-publisher': author,
        emojis: categories,
    }
    const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
    const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8')
    const exif = Buffer.concat([exifAttr, jsonBuff])
    exif.writeUIntLE(jsonBuff.length, 14, 4)
    return exif
}

async function toSticker(buffer, mimetype, meta) {
    const sharp = require('sharp')
    const transparent = { r: 0, g: 0, b: 0, alpha: 0 }
    let webp
    if (/^image\/(gif|webp)$/.test(mimetype)) {
        // Bisa animasi (GIF / WebP animasi)
        webp = await sharp(buffer, { animated: true })
            .resize(512, 512, { fit: 'contain', background: transparent })
            .webp({ quality: 60, loop: 0 })
            .toBuffer()
    } else if (mimetype.startsWith('image/')) {
        webp = await sharp(buffer)
            .resize(512, 512, { fit: 'contain', background: transparent })
            .webp({ quality: 80 })
            .toBuffer()
    } else if (mimetype.startsWith('video/')) {
        webp = await withTempFiles(buffer, 'mp4', 'webp', (inFile, outFile) => runFfmpeg([
            '-i', inFile, '-t', '6', '-an', '-vsync', '0',
            '-vf', 'fps=15,scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
            '-vcodec', 'libwebp', '-lossless', '0', '-q:v', '50', '-loop', '0', '-preset', 'default', outFile,
        ]))
    } else throw new Error(`Format ${mimetype} tidak bisa dijadikan stiker`)

    const { Image } = require('node-webpmux')
    const img = new Image()
    await img.load(webp)
    img.exif = stickerExif(meta)
    return await img.save(null)
}

async function toVoiceNote(buffer, mimetype) {
    if (/ogg/.test(mimetype)) return { buffer, mimetype: 'audio/ogg; codecs=opus' }
    const out = await withTempFiles(buffer, 'audio', 'ogg', (inFile, outFile) => runFfmpeg([
        '-i', inFile, '-vn', '-c:a', 'libopus', '-b:a', '64k', '-ac', '1', '-ar', '48000', '-f', 'ogg', outFile,
    ]))
    return { buffer: out, mimetype: 'audio/ogg; codecs=opus' }
}

module.exports = { toSticker, toVoiceNote, stickerExif, runFfmpeg, withTempFiles }
