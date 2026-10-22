const { getTargets, tag } = require('../api/target')

const actions = {
    async kick(dt, pesan) {
        let targets = await getTargets(dt, pesan)
        if (!targets.length) return pesan.reply('Tag, reply, atau tulis nomor yang mau dikeluarkan\nContoh: !kick @user')
        let byId = Object.fromEntries(dt.participants.map(p => [p.id, p]))
        let kicked = [], skipped = []
        for (let id of targets) {
            let p = byId[id]
            if (!p || server.isBot(id) || server.isOwner(id) || p.isSuperAdmin) skipped.push(id)
            else kicked.push(id)
        }
        if (kicked.length) await dt.chat.removeParticipants(kicked)
        let text = kicked.length ? `👢 Dikeluarkan: ${kicked.map(tag).join(', ')}` : ''
        if (skipped.length) text += `${text ? '\n' : ''}⏭️ Dilewati (bukan anggota / bot / owner / pembuat grup): ${skipped.map(tag).join(', ')}`
        await server.client.sendMessage(pesan.from, text, { mentions: [...kicked, ...skipped] })
    },
    async add(dt, pesan) {
        let targets = await getTargets(dt, pesan)
        if (!targets.length) return pesan.reply('Tulis nomor yang mau ditambahkan\nContoh: !add 08123456789')
        let res = await dt.chat.addParticipants(targets)
        let lines = targets.map((id, i) => {
            // whatsapp-web.js: { [id]: { code } }, Baileys: [{ status, jid }]
            let code = Array.isArray(res) ? res[i] && Number(res[i].status) : res && res[id] && res[id].code
            let status = { 200: '✅ ditambahkan', 403: '✉️ privasi, undangan dikirim', 408: '⏳ baru keluar, coba lagi nanti', 409: 'ℹ️ sudah di grup' }[code] || (typeof res == 'string' ? res : `❔ kode ${code}`)
            return `${tag(id)} ${status}`
        })
        await server.client.sendMessage(pesan.from, lines.join('\n'), { mentions: targets })
    },
    async promote(dt, pesan) {
        let targets = await getTargets(dt, pesan)
        if (!targets.length) return pesan.reply('Tag atau reply anggota yang mau dijadikan admin')
        await dt.chat.promoteParticipants(targets)
        await server.client.sendMessage(pesan.from, `⬆️ ${targets.map(tag).join(', ')} sekarang admin`, { mentions: targets })
    },
    async demote(dt, pesan) {
        let targets = (await getTargets(dt, pesan)).filter(id => !server.isBot(id))
        if (!targets.length) return pesan.reply('Tag atau reply admin yang mau diturunkan')
        await dt.chat.demoteParticipants(targets)
        await server.client.sendMessage(pesan.from, `⬇️ ${targets.map(tag).join(', ')} bukan admin lagi`, { mentions: targets })
    },
    async group(dt, pesan) {
        let arg = dt.text.trim().toLowerCase()
        let close = /^(close|tutup|off)$/.test(arg)
        if (!close && !/^(open|buka|on)$/.test(arg)) return pesan.reply('Contoh:\n!group close — hanya admin yang bisa kirim pesan\n!group open — semua anggota bisa kirim pesan')
        await dt.chat.setMessagesAdminsOnly(close)
        await pesan.reply(close ? server.sAnnounceOn : server.sAnnounceOff)
    },
    async linkgc(dt, pesan) {
        let code = await dt.chat.getInviteCode()
        await pesan.reply(`🔗 Link grup *${dt.chat.name}*\nhttps://chat.whatsapp.com/${code}`)
    },
    async revoke(dt, pesan) {
        await dt.chat.revokeInvite()
        let code = await dt.chat.getInviteCode()
        await pesan.reply(`♻️ Link grup sudah direset\nLink baru: https://chat.whatsapp.com/${code}`)
    },
    async setname(dt, pesan) {
        let name = dt.text.trim()
        if (!name) return pesan.reply('Contoh: !setname Grup Keren')
        await dt.chat.setSubject(name.slice(0, 100))
        await pesan.reply('✅ Nama grup diubah')
    },
    async setdesc(dt, pesan) {
        let desc = dt.text.trim()
        if (!desc) return pesan.reply('Contoh: !setdesc Aturan grup: ...')
        await dt.chat.setDescription(desc)
        await pesan.reply('✅ Deskripsi grup diubah')
    },
}
const alias = { tendang: 'kick', dor: 'kick', tambah: 'add', grup: 'group', gc: 'group', link: 'linkgc', resetlink: 'revoke', setnamegc: 'setname', setdescgc: 'setdesc' }

const handler = {}
handler.main = async function (dt, pesan) {
    let name = dt.command.toLowerCase()
    await actions[alias[name] || name](dt, pesan)
}
handler.help = ['kick @tag', 'add <nomor>', 'promote @tag', 'demote @tag', 'group open|close', 'linkgc', 'revoke', 'setname <teks>', 'setdesc <teks>']
handler.tags = ['group']
handler.command = /^(kick|tendang|dor|add|tambah|promote|demote|group|grup|gc|linkgc|link|revoke|resetlink|setname(gc)?|setdesc(gc)?)$/i
handler.admin = true
handler.botAdmin = true
handler.bypassMute = true
module.exports = handler
