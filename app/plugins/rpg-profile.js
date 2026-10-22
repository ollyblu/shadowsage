const level = require('../api/level')
const { profileCard } = require('../api/card')
const { getTarget } = require('../api/target')
const { fmt } = require('../api/rpg')

const handler = {}
handler.main = async function (dt, pesan) {
    let id = (await getTarget(dt, pesan, { numbers: false })) || dt.sender
    let user = getUser(id)
    level.levelUp(user)
    let rank = Object.entries(global.db.users.data)
        .filter(([, u]) => u && typeof u == 'object')
        .sort(([, a], [, b]) => (b.exp || 0) - (a.exp || 0))
        .findIndex(([uid]) => uid == id) + 1
    let { min, max, ratio } = level.progress(user)
    let premium = user.premium || server.isOwner(id)
    let role = level.role(user.level)
    let caption = `👤 *PROFIL* @${id.split('@')[0]}
${role}

📈 Level: *${user.level}* (${user.exp - min}/${max - min} XP)
✨ Total XP: *${fmt(user.exp)}*
🏆 Peringkat global: *#${rank}*
💰 Money: *${fmt(user.money)}*
🏦 Bank: *${fmt(user.bank)}*
⛽ Limit: *${premium ? '∞' : user.limit}*
💎 Premium: *${premium ? (user.premiumTime > 0 ? `sampai ${new Date(user.premiumTime).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}` : 'Ya') : 'Tidak'}*
🎮 Poin game: *${user.poinG}*`
    try {
        let card = await profileCard({ id, name: `+${id.split('@')[0]}`, level: user.level, role, exp: user.exp, min, max, ratio, money: user.money, bank: user.bank, limit: user.limit, rank, premium })
        let media = new server.MessageMedia('image/png', card.toString('base64'), 'profile.png')
        await server.client.sendMessage(pesan.from, media, { caption, mentions: [id] })
    } catch (e) {
        console.error('Gagal membuat kartu profil', e.message)
        await server.client.sendMessage(pesan.from, caption, { mentions: [id] })
    }
}
handler.help = ['profile [@tag]', 'level']
handler.tags = ['rpg', 'top']
handler.command = /^(profile?|profil|me|level|lvl|infome|my)$/i
handler.cooldown = 10000
module.exports = handler
