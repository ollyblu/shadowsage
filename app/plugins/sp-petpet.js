const handler = {}
handler.main = async function (dt, pesan) {
    let media
    if (pesan.hasMedia) media = await pesan.downloadMedia()
    else if (pesan.hasQuotedMsg) {
        let quoted = await pesan.getQuotedMessage()
        if (quoted.hasMedia) media = await quoted.downloadMedia()
    }
    if (!media) return pesan.reply(`Silahkan kirim gambar dengan caption *!petpet* atau reply gambar dengan perintah *!petpet*`)
    if (!/^image\/(png|jpe?g|webp)$/.test(media.mimetype)) {
        return await pesan.reply(`Hanya format gambar yang didukung untuk petpet. Media ini adalah: ${media.mimetype}`)
    }
    const gifBuffer = await createPetpet(Buffer.from(media.data, 'base64'))
    const petpetMedia = new server.MessageMedia('image/gif', gifBuffer.toString('base64'), 'petpet.gif')
    await server.client.sendMessage(pesan.from, petpetMedia, {
        sendMediaAsSticker: true,
        stickerAuthor: bot.creator,
        stickerName: bot.name,
        stickerCategories: ['👍🏻'],
    })
}
async function createPetpet(mediaBuffer) {
    const petPetGif = (await import('@someaspy/pet-pet-gif')).default
    // Konversi gambar dari format WebP/lainnya ke PNG menggunakan sharp
    const sharp = require('sharp')
    const supportedImageBuffer = await sharp(mediaBuffer).png().toBuffer()
    return await petPetGif(supportedImageBuffer, {
        resolution: 128,
        delay: 20,
    })
}
handler.help = 'petpet'
handler.tags = ['stiker', 'top']
handler.command = /^petpet$/i
handler.disabled = true
module.exports = handler
