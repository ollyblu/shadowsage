const similarity = require('similarity')
const threshold = 0.72
const bersih = s => `${s}`.toLowerCase().replace(/[^\w\s-]+/g, '').trim()

const handler = {}
handler.all = async function (dt, pesan) {
    let id = dt.room_id
    let room = server.room[id].family100
    if (!room) {
        delete server.room[id].child
        return 0
    }
    if (server.identifier.includes(pesan.body.charAt(0))) {
        if (keluarroom.test(pesan.body.slice(1))) {
            await pesan.reply('Keluar dari room family100')
            clearTimeout(room.tout)
            delete server.room[id].family100
            delete server.room[id].child
            return 1
        }
        return 0
    }
    let text = bersih(pesan.body)
    if (!text) return 0
    let isSurrender = /nyerah|suren|males/i.test(text)
    if (!isSurrender) {
        let index = room.jawaban.findIndex(v => similarity(bersih(v), text) > 0.8)
        if (index < 0) {
            let sisa = room.jawaban.filter((_, index) => !room.terjawab[index]).map(jawaban => similarity(bersih(jawaban), text))
            if (sisa.length && Math.max(...sisa) >= threshold) {
                await pesan.react(game.dikitlagi)
                dt.usr.exp -= game.proses(room.winScore, game.dikit)
            } else {
                await pesan.react(game.salahlah)
                dt.usr.exp -= game.proses(room.winScore, game.salah)
            }
            return true
        }
        if (room.terjawab[index]) return await server.client.sendMessage(pesan.from, `Sudah dijawab oleh @${room.terjawab[index]}`, { mentions: [`${room.terjawab[index]}@c.us`] })
        room.terjawab[index] = dt.sender.split('@')[0]
        dt.usr.exp += room.winScore
    }
    let isWin = room.terjawab.every(v => v)
    let caption = `*Soal:* ${room.soal}\n\nTerdapat *${room.jawaban.length}* jawaban teratas${room.jawaban.find(v => v.includes(' ')) ? `
(beberapa jawaban terdapat spasi)
` : ''}
${isWin ? `*SEMUA JAWABAN TERJAWAB*\n` : isSurrender ? '*MENYERAH!*\n' : ''}
${Array.from(room.jawaban, (jawaban, index) => {
        return isSurrender || room.terjawab[index] ? `${index + 1}. ${jawaban} ${room.terjawab[index] ? '@' + room.terjawab[index] : ''}`.trim() : false
    }).filter(v => v).join('\n')}
${isSurrender ? '' : `\n+${room.winScore} XP tiap jawaban benar\n-${game.proses(room.winScore, game.dikit)} XP tiap jawaban hampir benar\n-${game.proses(room.winScore, game.salah)} XP tiap jawaban salah`}`.trim()
    let mention = [...new Set(room.terjawab.filter(v => v))].map(v => `${v}@c.us`)
    if (isWin || isSurrender) {
        clearTimeout(room.tout)
        delete server.room[id].family100
        delete server.room[id].child
    }
    await server.client.sendMessage(pesan.from, caption, { mentions: mention })
    return 1
}
handler.child = 'family100'
module.exports = handler
