const { toDataURL } = require('qrcode')
const handler = {}

handler.main = async function (dt, pesan) {
    let data = dt.text.trim()
    if (!data) return pesan.reply('Contoh:\n.qr ABC')
    let url = await toDataURL(data.slice(0, 2048), { scale: 8 })
    let media = new server.MessageMedia('image/png', url.split(';base64,')[1], 'qrcode.png')
    await server.client.sendMessage(pesan.from, media, { caption: 'Sudah jadi kk' })
}
handler.command = /^(qrcode|qr)$/i
handler.tags = ['tools']
handler.help = 'qrcode'
handler.disabled = false
module.exports = handler
