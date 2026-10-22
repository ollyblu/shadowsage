const handler = {}
'.anonvot IKAN AYAM TUNA 4'

const defaulVote = {
  before: `
┌─〔 ANON-VOT 〕
├ Grup : %grupname
│
├ Dibuat : %time
├ Inisiator : %user_init
├ Responden : %peserta
├ Pilihan : %choices
├ Timeout : %timeout Menit
└────
  `,
  header: '┌─〔 Pilihan 〕',
  body: '├ %choice',
  footer: '└────\n',
  after: `
Ketik "terima/ok/gas" untuk mengkonfirmasi voting\nKetik "tolak/gabisa/nanti" untuk menolak
`
}

handler.main = async function (dt, pesan) {
  server.room.big = server.room.big || {}
  if (!dt.chat.isGroup) return pesan.reply('voting hanya bisa dilakukan di group')
  let participants = await server.getParticipants(dt.chat)
  const participant = participants.find(p => p.id === dt.sender)
  if (!participant || !participant.isAdmin) return pesan.reply('Hanya Admin yang bisa memulai voting')
  if (dt.args.length < 2) return pesan.reply(`Contoh:\n.anonvot Ikan Ayam Sayur 5`)
  if (dt.args.length < 4) return pesan.reply('Pilihan setidaknya 2, lalu diikuti waktu (menit)\nContoh:\n.anonvot Ikan Ayam Sayur 5')
  let pilihan = dt.args.slice(1, dt.args.length - 1)
  let timeout = Number(dt.args[dt.args.length - 1]) * 60
  if (!(timeout >= 60)) return pesan.reply('Waktu minimal 1 menit (angka di akhir perintah)')

  if (Object.values(server.room.big).find(room => room.id && room.id.startsWith('voting') && room.status && room.peserta.includes(dt.sender))) return pesan.reply('Voting sebelumnya belum diselesaikan')
  if (Object.values(server.room.big).find(room => room.peserta.includes(dt.sender))) await pesan.reply('Beberapa orang di grup ini sedang sibuk')
  let id = String('voting' + dt.room_id + '_' + Math.round(Math.random() * 1000))

  let _text = [
    defaulVote.before,
    defaulVote.header,
    pilihan.map((choc) => defaulVote.body.replace(/%choice/g, choc) + '\n').join('') + defaulVote.footer,
    defaulVote.after
  ].join('\n')
  let created = getDate()
  let grupname = dt.chat.name
  let user_init = dt.sender.split('@')[0]
  let replace = {
    '%': '%',
    grupname: grupname,
    time: '*' + created.week + '*, ' + created.date + '(' + created.time + ')',
    user_init: `@${user_init}`,
    peserta: participants.length,
    choices: pilihan.length,
    timeout: timeout / 60
  }
  let text = _text.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join`|`})`, 'g'), (_, name) => '' + replace[name])
  await server.client.sendMessage(pesan.from, `${text}`, { mentions: participants.map(obj => obj.id) })
  server.room.big[id] = {
    roomid: dt.room_id,
    id: id, grupname,
    peserta: participants.map(obj => obj.id),
    data_peserta: participants.map(obj => ({ id: obj.id })),
    status: 'wait',
    waktu: setTimeout(() => {
      if (server.room.big[id] && server.room.big[id].status == 'wait') {
        pesan.reply(`_Waktu voting Habis_`).catch(console.error)
        delete server.room.big[id]
      }
    }, timeout * 1000), pilihan, timeout, created, user_init
  }
}
handler.tags = ['tools', 'top']
handler.help = 'anonvot pilhan1 pilihan2 ... timeout'
handler.command = /^anonvot$/i

handler.group = true

module.exports = handler
