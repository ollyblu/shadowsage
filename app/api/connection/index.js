/**
 * Pemilih API WhatsApp.
 * Urutan prioritas: argumen CLI (--api baileys) > env WA_API > app/settings/data.json ("api")
 *
 * Nilai yang didukung:
 *  - "wwebjs"  (alias: "whatsapp-web.js", "wweb", "web")
 *  - "baileys" (alias: "bail", "md")
 */
const aliases = {
    'wwebjs': 'wwebjs', 'whatsapp-web.js': 'wwebjs', 'whatsapp-web': 'wwebjs', 'wweb': 'wwebjs', 'web': 'wwebjs',
    'baileys': 'baileys', 'bail': 'baileys', 'md': 'baileys',
}

function resolveApi(...candidates) {
    for (let c of candidates) {
        if (!c) continue
        let name = aliases[`${c}`.trim().toLowerCase()]
        if (!name) throw new Error(`API WhatsApp tidak dikenal: "${c}". Pilih "wwebjs" atau "baileys"`)
        return name
    }
    return 'wwebjs'
}

function createConnection(api, settings = {}) {
    const name = resolveApi(api)
    if (name == 'baileys') {
        const { BaileysClient, MessageMedia } = require('./baileys')
        const cfg = settings.baileys || {}
        return {
            name,
            client: new BaileysClient({
                authFolder: cfg.authFolder,
                pairingNumber: process.env.PAIRING_NUMBER || cfg.pairingNumber,
            }),
            MessageMedia,
        }
    }
    const cfg = settings.wwebjs || {}
    const { client, MessageMedia } = require('./wwebjs')({
        chromePath: process.env.CHROME_PATH || cfg.chromePath,
        ffmpegPath: process.env.FFMPEG_PATH || cfg.ffmpegPath,
        headless: cfg.headless,
    })
    return { name, client, MessageMedia }
}

module.exports = { createConnection, resolveApi }
