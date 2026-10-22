/**
 * Koneksi memakai whatsapp-web.js (WhatsApp Web lewat Chrome/puppeteer)
 */
module.exports = function createWwebjs(options = {}) {
    const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js')
    const puppeteer = {
        headless: options.headless !== false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
    // Opsional: pakai Chrome yang terinstal di komputer
    if (options.chromePath) puppeteer.executablePath = options.chromePath
    const client = new Client({
        authStrategy: new LocalAuth(options.dataPath ? { dataPath: options.dataPath } : {}),
        puppeteer,
        // Dibutuhkan untuk stiker dari video/GIF
        ...(options.ffmpegPath ? { ffmpegPath: options.ffmpegPath } : {}),
    })
    return { client, MessageMedia }
}
