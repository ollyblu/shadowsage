/*
    Made by https://github.com/syahrularranger
    Jangan di hapus credit nya :)
*/
const timeout = 60000
const poin = 500
const poin_lose = 100
const poin_bot = 200
const handler = {}
handler.main = async (dt, pesan) => {
  server.room.big = server.room.big || {}
  if (!dt.chat.isGroup) return pesan.reply('Suit hanya bisa dilakukan di group')
  if (Object.values(server.room.big).find(room => room.id.startsWith('suit') && room.peserta.includes(dt.sender))) return pesan.reply('Selesaikan suit mu yang sebelumnya')
  if (Object.values(server.room.big).find(room => room.peserta.includes(dt.sender))) return pesan.reply('Kamukan sedang sibuk\nTidak bisa main main :]')
  let lawan
  if (pesan.mentionedIds && pesan.mentionedIds.length) lawan = pesan.mentionedIds[0]
  else if (pesan.hasQuotedMsg) {
    let quoted = await pesan.getQuotedMessage()
    lawan = quoted.author || quoted.from
  }
  if (!lawan) return await server.client.sendMessage(pesan.from, `_Siapa yang ingin kamu tantang?_\nTag orangnya.. Contoh\n\n !suit @${bot.number} `, { mentions: [bot.number + '@c.us'] })
  lawan = await server.toPn(typeof lawan == 'string' ? lawan : lawan._serialized)

  let aku = dt.room_id
  if (server.isBot(lawan)) return pesan.reply('Tidak bisa menantang bot 😏😋')
  if (lawan == dt.sender) return pesan.reply('Tidak bisa menantang diri sendiri')
  if (Object.values(server.room.big).find(room => room.id.startsWith('suit') && room.peserta.includes(lawan))) return pesan.reply(`Orang yang kamu tantang sedang bermain suit dengan orang lain :(`)
  if (Object.values(server.room.big).find(room => room.peserta.includes(lawan))) return pesan.reply('Orang yang kamu tantang sedang sibuk :[')
  let id = 'suit_' + Date.now()
  let caption = `
_*SUIT PvP*_

@${dt.sender.split`@`[0]} menantang @${lawan.split`@`[0]} untuk bermain suit

Silahkan @${lawan.split`@`[0]}
`.trim()
  let footer = `\nKetik "terima/ok/gas" untuk memulai suit\nKetik "tolak/gabisa/nanti" untuk menolak`
  server.room.big[id] = {
    id: id,
    aku: aku,
    asal: pesan.from,
    peserta: [dt.sender, lawan],
    status: 'wait',
    waktu: setTimeout(() => {
      if (server.room.big[id]) pesan.reply(`_Waktu suit habis_`).catch(console.error)
      delete server.room.big[id]
    }, timeout), poin, poin_lose, poin_bot, timeout
  }
  server.room.big[id].chat = await server.client.sendMessage(pesan.from, `${caption} ${footer}`, { mentions: [dt.sender, lawan] })
}
handler.tags = ['game', 'top']
handler.help = 'suit @tag'
handler.command = /^suit(pvp)?$/i

handler.group = true
handler.game = true

module.exports = handler
