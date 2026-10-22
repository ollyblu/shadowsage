const { getTargets, tag } = require('../api/target')
const { addWarn, MAX_WARN } = require('../api/warn')

const handler = {}
handler.main = async function (dt, pesan) {
    let cmd = dt.command.toLowerCase()
    let warn = dt.roomdb.warn
    if (cmd == 'listwarn') {
        let list = Object.entries(warn).filter(([, n]) => n > 0)
        if (!list.length) return pesan.reply('Belum ada anggota yang diperingatkan 😇')
        return server.client.sendMessage(pesan.from, `⚠️ *DAFTAR PERINGATAN*\n\n${list.map(([id, n]) => `${tag(id)} — ${n}/${MAX_WARN}`).join('\n')}`, { mentions: list.map(([id]) => id) })
    }
    let targets = (await getTargets(dt, pesan, { numbers: false })).filter(id => !server.isBot(id))
    if (!targets.length) return pesan.reply(`Tag atau reply anggota\nContoh: !${cmd} @user alasan`)
    if (cmd == 'unwarn' || cmd == 'delwarn') {
        for (let id of targets) delete warn[id]
        return server.client.sendMessage(pesan.from, `✅ Peringatan ${targets.map(tag).join(', ')} dihapus`, { mentions: targets })
    }
    let reason = dt.text.replace(/@\d+/g, '').trim() || 'melanggar aturan grup'
    for (let id of targets) await addWarn(dt, pesan, id, reason)
}
handler.help = ['warn @tag <alasan>', 'unwarn @tag', 'listwarn']
handler.tags = ['group']
handler.command = /^(warn|unwarn|delwarn|listwarn)$/i
handler.admin = true
handler.bypassMute = true
module.exports = handler
