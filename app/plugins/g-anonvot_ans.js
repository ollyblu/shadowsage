const similarity = require('similarity')
const handler = {}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const defaulVote = {
  before: `
┌─〔 ANON-VOT 〕
├ Grup : %grupname
│
├ Dibuat : %time
├ Inisiator : %user_init
├ Responden : %peserta Orang
├ Pilihan : %choices
├ Timeout : %timeout Menit
├ ID Responden: %kode%
└────
  `,
  header: '┌─〔 Pilihan 〕',
  body: '├ %choice',
  footer: '└────\n',
  after: `
${'```Terimakasih```'}
`
}

function generateCode() {
  const character = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 5; i++) code += character.charAt(Math.floor(Math.random() * character.length))
  return code
}

function selesai(room) {
  clearTimeout(room.waktu)
  clearTimeout(room.waktu_milih)
  if (!server.room.big[room.id]) return
  delete server.room.big[room.id]
  server.client.sendMessage(room.asal, hasilVot(room)).catch(console.error)
}

handler.all = async function (dt, pesan) {
  server.room.big = server.room.big || {}
  let room = Object.values(server.room.big).find(room => room.id && room.id.startsWith('voting') && room.status && room.peserta.includes(dt.sender))
  if (!room) return !0
  if (room.status == 'wait') {
    if (!dt.chat.isGroup || !/^(acc(ept)?|terima|gas|oke?|tolak|gamau|nanti|ga(k.)?bisa)/i.test(pesan.body)) return !0
    if (/^(tolak|gamau|nanti|ga(k.)?bisa)/i.test(pesan.body)) {
      clearTimeout(room.waktu)
      delete server.room.big[room.id]
      await server.client.sendMessage(pesan.from, `@${dt.sender.split`@`[0]} menolak voting, voting dibatalkan`, { mentions: [dt.sender] })
      return !0
    }
    room.status = 'play'
    room.asal = pesan.from
    clearTimeout(room.waktu)
    await server.client.sendMessage(pesan.from, `voting telah dikirmkan ke masing masing anggota
Silahkan pilih di chat masing"
klik wa.me/${bot.number}`)
    let _text = [
      defaulVote.before,
      defaulVote.header,
      room.pilihan.map((choc) => defaulVote.body.replace(/%choice/g, choc) + '\n').join('') + defaulVote.footer,
      defaulVote.after
    ].join('\n')
    let created = room.created
    let replace = {
      '%': '%',
      grupname: room.grupname,
      time: '*' + created.week + '*, ' + created.date + '(' + created.time + ')',
      user_init: `@${room.user_init}`,
      peserta: room.peserta.length,
      choices: room.pilihan.length,
      timeout: room.timeout / 60
    }
    let text = _text.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join`|`})`, 'g'), (_, name) => '' + replace[name])
    room.waktu_milih = setTimeout(() => selesai(room), room.timeout * 1000)
    for (let peserta of room.data_peserta) {
      if (peserta.pilih) continue
      peserta.kode = generateCode()
      server.client.sendMessage(peserta.id, text.replace('%kode%', peserta.kode), { mentions: [room.user_init + '@c.us'] }).catch(console.error)
      await delay(Math.floor(Math.random() * 500) + 300)
    }
    return !0
  }
  // status 'play': pilihan diterima lewat chat pribadi
  if (dt.chat.isGroup) return !0
  let peserta = room.data_peserta.find(p => p.id == dt.sender)
  if (peserta && !peserta.pilih) {
    let pilih = room.pilihan.findIndex((pilihan) => similarity(pilihan.toLowerCase(), pesan.body.toLowerCase().trim()) > 0.8)
    if (pilih >= 0) {
      peserta.pilih = room.pilihan[pilih]
      await pesan.reply(`Kamu telah memilih ${peserta.pilih}`)
    }
  }
  if (room.data_peserta.every(p => p.pilih)) selesai(room)
  return !0
}

function hasilVot(room) {
  let caption = `
┌─〔 HASIL ANON-VOT 〕
├ Grup : ${room.grupname}
│
├ Dibuat : ${'*' + room.created.week + '*, ' + room.created.date + '(' + room.created.time + ')'}
├ Responden : ${room.peserta.length} Orang
├ Pilihan : ${room.pilihan.length}
├ Timeout : ${room.timeout / 60} Menit
└────
  `
  let hasil = {}
  let rincian = ``
  for (let pilihan of room.pilihan) {
    hasil[pilihan] = 0
    rincian += `\n┌─〔 ${pilihan} 〕`
    for (let peserta of room.data_peserta) {
      if (peserta.pilih == pilihan) {
        hasil[pilihan] += 1
        rincian += `\n├ ${peserta.kode}`
      }
    }
    rincian += '\n└────\n'
  }
  let golput = 0
  rincian += `\n┌─〔 GOLPUT 〕`
  for (let peserta of room.data_peserta) {
    if (!peserta.pilih) {
      rincian += `\n├ ${peserta.kode || '-'}`
      golput += 1
    }
  }
  rincian += '\n└────\n'
  let hasilpilihan = `\n┌─〔 RINCIAN 〕`
  for (let pilihan of room.pilihan) hasilpilihan += `\n├ ${pilihan} = *${hasil[pilihan]}*`
  hasilpilihan += `\n├ Golput = *${golput}*`
  hasilpilihan += `\n├ Total = *${room.peserta.length}*\n` + '└────\n'
  return caption + hasilpilihan + rincian
}
module.exports = handler
