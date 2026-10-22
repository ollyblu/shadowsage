const { fmt } = require('../api/rpg')

// Field yang boleh diurutkan (dulu .lb bisa membaca field apa pun di database)
const fields = {
    exp: ['✨ XP', u => u.exp],
    level: ['📈 Level', u => u.level],
    money: ['💰 Money', u => u.money],
    bank: ['🏦 Bank', u => u.bank],
    kaya: ['💵 Kekayaan', u => (u.money || 0) + (u.bank || 0)],
    poing: ['🎮 Poin game', u => u.poinG],
    limit: ['⛽ Limit', u => u.limit],
}
const alias = { xp: 'exp', lvl: 'level', uang: 'money', wealth: 'kaya', kekayaan: 'kaya', poin: 'poing' }
const medal = ['🥇', '🥈', '🥉']

const handler = {}
handler.main = async function (dt, pesan) {
    let args = dt.text.trim().toLowerCase().split(/\s+/).filter(Boolean)
    let global_ = args.includes('global') || !dt.chat.isGroup
    let key = args.find(a => a in fields || a in alias)
    key = alias[key] || key || 'exp'
    let [label, get] = fields[key]
    let ids
    if (global_) ids = Object.keys(global.db.users.data)
    else ids = (await server.getParticipants(dt.chat)).map(p => p.id)
    let rows = ids
        .map(id => ({ id, value: Number(get(global.db.users.data[id] || {})) || 0 }))
        .sort((a, b) => b.value - a.value)
    let myRank = rows.findIndex(r => r.id == dt.sender) + 1
    let top = rows.slice(0, global_ ? 10 : 15)
    let caption = `🏆 *LEADERBOARD ${global_ ? 'GLOBAL' : 'GRUP'}* — ${label}\n\n`
        + top.map((r, i) => `${medal[i] || `${i + 1}.`} @${r.id.split('@')[0]} — *${fmt(r.value)}*`).join('\n')
        + (myRank ? `\n\nPeringkat kamu: *#${myRank}* dari ${rows.length}` : '')
        + `\n\n_Pilihan: ${Object.keys(fields).join(', ')}${dt.chat.isGroup ? ' • tambah "global"' : ''}_`
    await server.client.sendMessage(pesan.from, caption, { mentions: top.map(r => r.id) })
}
handler.command = /^(g_lb|lb|leaderboard|top)$/i
handler.help = 'lb [exp|money|level|kaya] [global]'
handler.tags = ['rpg']
handler.cooldown = 10000
module.exports = handler
