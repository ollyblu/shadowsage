const handler = {}
const reg = /^(gunting|batu|kertas)/i
const menang = { batu: 'gunting', gunting: 'kertas', kertas: 'batu' }

function selesai(room) {
  clearTimeout(room.waktu)
  clearTimeout(room.waktu_milih)
  delete server.room.big[room.id]
  for (let peserta of room.peserta)
    if (server.room[peserta] && server.room[peserta].child == 'suit') delete server.room[peserta].child
}

handler.all = async function (dt, pesan) {
  server.room.big = server.room.big || {}
  let room = Object.values(server.room.big).find(room => room.id && room.id.startsWith('suit') && room.status && room.peserta.includes(dt.sender))
  if (!room) return !0
  if (room.status == 'wait') {
    if (dt.sender !== room.peserta[1] || !dt.chat.isGroup) return !0
    if (!/^(acc(ept)?|terima|gas|oke?|tolak|gamau|nanti|ga(k.)?bisa)/i.test(pesan.body)) return !0
    if (/^(tolak|gamau|nanti|ga(k.)?bisa)/i.test(pesan.body)) {
      selesai(room)
      await server.client.sendMessage(pesan.from, `@${room.peserta[1].split`@`[0]} menolak suit, suit dibatalkan`, { mentions: [room.peserta[1]] })
      return !0
    }
    room.status = 'play'
    room.asal = pesan.from
    clearTimeout(room.waktu)
    for (let peserta of room.peserta) {
      server.room[peserta] = server.room[peserta] || { name: 'home', process: [] }
      server.room[peserta].child = 'suit'
    }
    await server.client.sendMessage(pesan.from, `Suit telah dikirimkan ke chat
@${room.peserta[0].split`@`[0]} dan
@${room.peserta[1].split`@`[0]}

Silahkan pilih suit di chat masing"
klik wa.me/${bot.number}`, { mentions: room.peserta })

    let ajakan = `Silahkan ketik\n *Batu* / *Kertas* / *Gunting* \nMenang +${room.poin}XP\nKalah -${room.poin_lose}XP\nBonus +${room.poin_bot}`
    for (let peserta of room.peserta) await server.client.sendMessage(peserta, ajakan)
    room.waktu_milih = setTimeout(() => {
      if (!server.room.big[room.id]) return
      if (!room.pilih && !room.pilih2) server.client.sendMessage(room.asal, `Kedua pemain tidak niat main,\nSuit dibatalkan`).catch(console.error)
      else if (!room.pilih || !room.pilih2) {
        let afk = room.pilih ? room.peserta[1] : room.peserta[0]
        server.client.sendMessage(room.asal, `@${afk.split`@`[0]} tidak memilih suit, game berakhir`, { mentions: [afk] }).catch(console.error)
      }
      selesai(room)
    }, room.timeout)
    return !0
  }

  // status 'play': pilihan hanya diterima lewat chat pribadi
  if (dt.chat.isGroup || !reg.test(pesan.body)) return !0
  let pilihan = reg.exec(pesan.body.toLowerCase())[0]
  if (dt.sender == room.peserta[0] && !room.pilih) {
    room.pilih = pilihan
    room.text = pesan.body
    await pesan.reply(`Kamu telah memilih ${pesan.body} ${!room.pilih2 ? `\n\nMenunggu lawan memilih` : ''}`)
    if (!room.pilih2) await server.client.sendMessage(room.peserta[1], '_Lawan sudah memilih_\nSekarang giliran kamu')
  } else if (dt.sender == room.peserta[1] && !room.pilih2) {
    room.pilih2 = pilihan
    room.text2 = pesan.body
    await pesan.reply(`Kamu telah memilih ${pesan.body} ${!room.pilih ? `\n\nMenunggu lawan memilih` : ''}`)
    if (!room.pilih) await server.client.sendMessage(room.peserta[0], '_Lawan sudah memilih_\nSekarang giliran kamu')
  }
  if (room.pilih && room.pilih2) {
    selesai(room)
    let tie = room.pilih == room.pilih2
    let win = tie ? '' : menang[room.pilih] == room.pilih2 ? room.peserta[0] : room.peserta[1]
    if (!tie) {
      let lose = win == room.peserta[0] ? room.peserta[1] : room.peserta[0]
      getUser(win).exp += room.poin + room.poin_bot
      getUser(lose).exp -= room.poin_lose
    }
    let hasil = p => tie ? '' : p == win ? ` Menang \n+${room.poin}XP\nBonus +${room.poin_bot}` : ` Kalah \n-${room.poin_lose}XP`
    await server.client.sendMessage(room.asal, `
_*Hasil Suit*_${tie ? '\nSERI' : ''}

@${room.peserta[0].split`@`[0]} (${room.text})${hasil(room.peserta[0])}
@${room.peserta[1].split`@`[0]} (${room.text2})${hasil(room.peserta[1])}
`.trim(), { mentions: room.peserta })
  }
  return !0
}
handler.exp = 0
handler.adaptif = true
module.exports = handler
