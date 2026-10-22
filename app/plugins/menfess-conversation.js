const menfess = require('../api/menfess')

const help = () => `💌 *MENFESS — Pesan Anonim*

*Kirim menfess*
• !menfess 0812xxxx Pesan kamu
• !menfess (0812xxxx) Pesan kamu
• !menfess 0812xxxx|Pesan kamu|Nama samaran
  _Bisa juga dikirim sebagai caption gambar/video_

*Membalas*
• *Reply* pesan menfess dari bot, atau
• !balas <ID> Pesan kamu

*Kelola*
• !menfess list — daftar menfess aktif
• !menfess tutup <ID> — akhiri obrolan
• !menfess blokir <ID> — blokir lawan bicara
• !menfess bukablokir — hapus semua blokir
• !menfess off / on — tolak / terima semua menfess
• !menfess lapor <ID> [alasan] — laporkan ke owner

_Identitas pengirim dirahasiakan, kecuali dilaporkan karena penyalahgunaan._`

const ownerHelp = `\n\n*Owner*\n• !menfess ban <nomor>\n• !menfess unban <nomor>\n• !menfess stat`

// Ambil nomor tujuan di awal teks. Mengembalikan { number, rest } atau null
function parseTarget(text) {
    let m = text.match(/^\(\s*([^)]+?)\s*\)\s*([\s\S]*)$/)
    if (m) return { number: menfess.normalizeNumber(m[1]), rest: m[2] }
    if (text.includes('|') && /^[\s\d+()-]+$/.test(text.split('|')[0])) {
        let [number, ...rest] = text.split('|')
        return { number: menfess.normalizeNumber(number), rest: rest.join('|') }
    }
    // Nomor boleh mengandung spasi/strip, mis. "+62 812-3456-7890 halo"
    let tokens = text.split(/(\s+)/)
    let digits = ''
    let used = 0
    for (let i = 0; i < tokens.length; i++) {
        let tok = tokens[i]
        if (/^\s+$/.test(tok)) { if (digits) used = i + 1; continue }
        if (!/^\+?[\d-]+$/.test(tok) || (digits + tok).replace(/\D/g, '').length > 15) break
        digits += tok
        used = i + 1
    }
    if (!digits) return null
    return { number: menfess.normalizeNumber(digits), rest: tokens.slice(used).join('') }
}

const handler = {}
handler.main = async function (dt, pesan) {
    let text = dt.text.trim()
    let [sub, ...args] = text.split(/\s+/)
    sub = (sub || '').toLowerCase()
    let isOwner = server.isOwner(dt.sender)
    // semua ID milik pengguna ini (nomor HP & ID chat, bisa berupa @lid)
    let me = [dt.sender, pesan.from]

    if (!text && !pesan.hasMedia || /^(help|bantuan|\?)$/.test(sub)) return pesan.reply(help() + (isOwner ? ownerHelp : ''))
    if (dt.chat.isGroup) return pesan.reply('Demi menjaga kerahasiaan, menfess hanya bisa digunakan lewat chat pribadi dengan bot')

    switch (sub) {
        case 'list': {
            let list = menfess.listThreads(me)
            if (!list.length) return pesan.reply('Kamu tidak punya menfess aktif')
            let rows = list.map(t => {
                let role = menfess.sideOf(t, me) == 'a' ? `➡️ ke ${menfess.mask(t.b)}` : `⬅️ dari ${t.alias || 'Seseorang'}`
                let status = t.status == 'active' ? '🟢' : '🔒'
                let last = new Date(t.last).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Jakarta' })
                return `${status} *#${t.id}* ${role}\n    ${t.count} pesan · terakhir ${last}`
            })
            return pesan.reply(`💌 *Menfess kamu*\n\n${rows.join('\n')}\n\n_Thread kedaluwarsa otomatis setelah 3 hari tanpa aktivitas_`)
        }
        case 'tutup': case 'close': case 'selesai': {
            if (!args[0]) return pesan.reply('Contoh: !menfess tutup K7Q2M')
            let t = await menfess.close(me, args[0])
            return pesan.reply(`🔒 Menfess #${t.id} ditutup`)
        }
        case 'blokir': case 'block': {
            if (!args[0]) return pesan.reply('Contoh: !menfess blokir K7Q2M')
            let t = menfess.block(me, args[0])
            return pesan.reply(`🔕 Lawan bicara di menfess #${t.id} diblokir.\nDia tidak bisa lagi mengirim menfess ke kamu.\nKetik *!menfess bukablokir* untuk menghapus semua blokir.`)
        }
        case 'bukablokir': case 'unblock': {
            let n = menfess.unblockAll(dt.sender)
            return pesan.reply(n ? `✅ ${n} blokir dihapus` : 'Kamu tidak memblokir siapa pun')
        }
        case 'off': case 'on': {
            menfess.setOptout(dt.sender, sub == 'off')
            return pesan.reply(sub == 'off'
                ? '🚫 Kamu tidak akan menerima menfess baru. Ketik *!menfess on* untuk mengaktifkan lagi.'
                : '✅ Kamu bisa menerima menfess lagi.')
        }
        case 'lapor': case 'report': {
            if (!args[0]) return pesan.reply('Contoh: !menfess lapor K7Q2M kata-kata kasar')
            let t = await menfess.report(me, args[0], args.slice(1).join(' '))
            return pesan.reply(`🚩 Laporan untuk menfess #${t.id} sudah dikirim ke owner. Terima kasih!\nKetik *!menfess blokir ${t.id}* bila ingin memblokirnya juga.`)
        }
        case 'ban': case 'unban': {
            if (!isOwner) return pesan.reply('Hanya owner yang bisa memakai perintah ini')
            if (!args[0]) return pesan.reply(`Contoh: !menfess ${sub} 628xxxx`)
            let jid = menfess.ban(args.join(''), sub == 'ban')
            return pesan.reply(sub == 'ban' ? `⛔ ${jid.split('@')[0]} dilarang memakai menfess` : `✅ ${jid.split('@')[0]} boleh memakai menfess lagi`)
        }
        case 'stat': case 'stats': {
            if (!isOwner) return pesan.reply('Hanya owner yang bisa memakai perintah ini')
            let s = menfess.stats()
            return pesan.reply(`📊 *Statistik Menfess*\nTerkirim: ${s.sent}\nBalasan: ${s.replies}\nThread aktif: ${s.active}\nThread tersimpan: ${s.threads}\nDiban: ${s.banned}\nMenolak menfess: ${s.optout}`)
        }
    }

    // ===== kirim menfess baru =====
    let target, rest
    if (pesan.mentionedIds && pesan.mentionedIds.length) {
        target = await server.toPn(typeof pesan.mentionedIds[0] == 'string' ? pesan.mentionedIds[0] : pesan.mentionedIds[0]._serialized)
        rest = text.replace(/@\d+/, '')
    } else {
        let parsed = parseTarget(text)
        if (parsed) ({ number: target, rest } = parsed)
    }
    if (!target) {
        await pesan.react(server.emoticon.marah[1])
        return pesan.reply(`Nulis nomor yang bener dong kakak\nContoh: !menfess 0812xxxx Halo kak\n\nKetik *!menfess help* untuk bantuan`)
    }
    let alias = ''
    let parts = rest.split('|')
    if (parts.length > 1 && parts[parts.length - 1].trim().length <= menfess.CONFIG.maxAlias) alias = parts.pop().trim()
    let message = parts.join('|').trim()
    let media = await menfess.getMedia(pesan)
    let { thread, censored } = await menfess.startThread({ sender: dt.sender, senderIds: me, target, text: message, alias, media })
    await pesan.reply(`✅ Menfess terkirim ke ${menfess.mask(thread.b)} · *#${thread.id}*${alias ? `\nNama samaran: ${alias}` : ''}${censored ? '\n⚠️ Beberapa kata disensor' : ''}

Balasan akan muncul di chat ini.
↩️ *Reply* pesan balasan atau ketik *!balas ${thread.id} pesan* untuk melanjutkan.
🔒 *!menfess tutup ${thread.id}* untuk mengakhiri.`)
}
handler.tags = ['top']
handler.help = ['menfess <nomor> <pesan>', 'menfess help']
handler.command = /^(menfess|mf|confess)$/i
handler.disabled = false
module.exports = handler
