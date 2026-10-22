let fs = require('fs')
let moment = require('moment-timezone')
const util = require('util')
//let { webp2png } = require('../lib/webp2mp4')
//const detection = require('../lib/detect')
//let handler = m => m
const handler = {}
handler.all = async function (dt,m) {
    if(server.room[dt.room_id].child)return false
    // Grup yang dibisukan (!mute) tidak mendapat balasan otomatis
    if(dt.roomdb.mute)return false
    let reg = /^(ass?alamu?|hai+|hi+|selamat|halo+|tes)$/i
    let isSalam = reg.exec(m.body.trim().split(/s+/)[0].replace(/[^a-z]/gi, ''))
    if (isSalam && !m.fromMe) {
        //Sending messages with mentions
        //server.client.sendMessage(m.from, `Halo @${m.from.split('@')[0]} ${ucapan()}`, {mentions: [m.from]})
        // console.log('Ini untuk',m.from, 'Dan', m.author?m.author:m.from)
        await server.client.sendMessage(m.from,`Halo @${dt.sender.split('@')[0]} ${ucapan()}`, {mentions: [dt.sender]})
        //console.log(server.room[dt.room_id])
    }
    //Reply kata kata kotor
    let textfilter = m.body.toLowerCase()
    let isBadword = listkatakotor.exec(textfilter)
    if (isBadword && !m.fromMe) {
        let gabolekasar = `Jangan kasar dong kakak`        
        await m.reply(gabolekasar)
    }

    //Reply Horny
    let rrrrrrrrr = m.body.toLowerCase()
    let antihorn = /(se(g?k)s|sex|sange|hentai|bugil)/i
    let isHorn = antihorn.exec(rrrrrrrrr)
    if (isHorn && !m.fromMe) {
        await m.reply(`gabole sange ke BOT kk`.trim())
    }

    //Reply LGBT
    let antilgbt = /(gay|lesbi|lesbian|homo|homosexual|lgbt)/i
    let islgbt = antilgbt.exec(m.body)
//     if (islgbt && !m.fromMe) {
//         m.reply(`Saya anti LGBT ya kk\n\nAllah Ta’ala berfirman :\n وَلُوطًا إِذْ قَالَ لِقَوْمِهِ أَتَأْتُونَ الْفَاحِشَةَ مَا سَبَقَكُمْ بِهَا مِنْ أَحَدٍ مِنَ الْعَالَمِينَ \nDan (Kami juga telah mengutus Nabi) Luth (kepada kaumnya). (Ingatlah) tatkala dia berkata kepada mereka: “Mengapa kalian mengerjakan perbuatan yang sangat hina itu, yang belum pernah dilakukan oleh seorangpun (di dunia ini) sebelum kalian?” [Al-A’raaf: 80].\n\nAllah Ta’ala berfirman :\nإِنَّكُمْ لَتَأْتُونَ الرِّجَالَ شَهْوَةً مِنْ دُونِ النِّسَاءِ ۚ بَلْ أَنْتُمْ قَوْمٌ مُسْرِفُونَ
// \nSesungguhnya kalian mendatangi lelaki untuk melepaskan nafsu kalian (kepada mereka), bukan kepada wanita, malah kalian ini adalah kaum yang melampaui batas. [Al-A’raaf: 81].
// \nSumber: https://muslim.or.id/27432-kaum-gay-inilah-wahyu-allah-taala-tentang-anda.html`)
//         m.reply(`Tobat dong kk`)
//     }
    
    if(/sok asik/i.exec(m.body)){
        await m.react('😡')
        return 0
    }
    if(/bot/i.exec(m.body)){
        // m.reply('Hah?')
        await m.react('😴')
        return 0
    }
    if(m.mentionedIds && (await server.toPnAll(m.mentionedIds.map(id => typeof id == 'string' ? id : id._serialized))).some(server.isBot)){
        // m.reply('Kenapa?')
        await m.react('☺️')
        return 0
    }
    if(m.hasQuotedMsg){
        // // m.reply(util.format(qouted))
        // if(qouted.fromMe){
        //     // m.reply('Ada apa?')
        //     m.react('😨')
        //     return 0
        // }
    }
    return !0
}
//handler.tags = ['game']
module.exports = handler
function ucapan() {
    const time = Number(moment.tz('Asia/Jakarta').format('HH'))
    let res = "Selamat dinihari"
    if (time >= 4) {
        res = "Selamat pagi"
    }
    if (time > 10) {
        res = "Selamat siang"
    }
    if (time >= 15) {
        res = "Selamat sore"
    }
    if (time >= 18) {
        res = "Selamat malam"
    }
    return res
}

function clockString(ms) {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)]
}
