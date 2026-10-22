/**
 * Downloader memakai yt-dlp (YouTube, TikTok, Instagram, Facebook, X, Pinterest, dll).
 * Butuh yt-dlp di PATH (atau env YTDLP_PATH) dan ffmpeg untuk audio/merge.
 * Situs sering berubah, jadi update berkala: pip install -U yt-dlp
 */
const fs = require('fs')
const path = require('path')
const { execFile } = require('child_process')

const MAX_SIZE = '60M'
const tempDir = path.join(__dirname, '..', 'temp', 'dl')

function run(args, timeout = 240000) {
    return new Promise((resolve, reject) => {
        execFile(process.env.YTDLP_PATH || 'yt-dlp', args, { timeout, windowsHide: true, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) {
                if (err.code == 'ENOENT') return reject('yt-dlp belum terpasang di server. Install: pip install -U yt-dlp')
                let msg = `${stderr || err.message}`.split('\n').filter(l => l.includes('ERROR')).pop() || err.message
                return reject(msg.replace(/^ERROR:\s*/, '').slice(0, 300))
            }
            resolve(stdout)
        })
    })
}

// Mengembalikan { title, file, duration } ; file harus dihapus pemanggil setelah dikirim
async function download(url, { audio = false } = {}) {
    fs.mkdirSync(tempDir, { recursive: true })
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const args = [
        '--no-playlist', '--no-warnings', '-q', '--no-simulate',
        '--max-filesize', MAX_SIZE,
        '-o', path.join(tempDir, `${id}.%(ext)s`),
        '--print', 'after_move:%(title)s\t%(duration)s\t%(filepath)s',
    ]
    if (process.env.FFMPEG_PATH) args.push('--ffmpeg-location', process.env.FFMPEG_PATH)
    if (audio) args.push('-f', 'bestaudio/best', '-x', '--audio-format', 'mp3', '--audio-quality', '5')
    else args.push('-f', 'b[ext=mp4][height<=720]/bv*[ext=mp4][height<=720]+ba[ext=m4a]/b[height<=720]/b', '--merge-output-format', 'mp4')
    args.push(url)
    const out = await run(args)
    const line = out.trim().split('\n').filter(Boolean).pop() || ''
    let [title, duration, file] = line.split('\t')
    if (!file || !fs.existsSync(file)) {
        file = fs.readdirSync(tempDir).filter(f => f.startsWith(id)).map(f => path.join(tempDir, f))[0]
    }
    if (!file) throw `Gagal mengunduh. File mungkin lebih dari ${MAX_SIZE}B atau link tidak didukung`
    return { title: title || 'media', duration: Number(duration) || 0, file }
}

module.exports = { download, run }
