const { fmt, parseAmount } = require('../api/rpg')

const MIN_BET = 100
const MAX_BET = 100000
const reels = ['🍒', '🍋', '🍇', '🔔', '💎', '7️⃣']
const jackpot = { '💎': 10, '7️⃣': 20 }
const dice = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

function bet(dt, pesan, text) {
    let n = parseAmount(text, Math.min(dt.usr.money, MAX_BET))
    if (!n) throw `Masukkan taruhan\nContoh: !${dt.command} 1000`
    if (n < MIN_BET) throw `Taruhan minimal 💰 ${fmt(MIN_BET)}`
    if (n > MAX_BET) throw `Taruhan maksimal 💰 ${fmt(MAX_BET)}`
    if (n > dt.usr.money) throw `Uang di dompet cuma 💰 ${fmt(dt.usr.money)}`
    return n
}

const games = {
    async slot(dt, pesan) {
        let n = bet(dt, pesan, dt.text.trim())
        let r = [0, 0, 0].map(() => pickRandom(reels))
        let mult = 0
        if (r[0] == r[1] && r[1] == r[2]) mult = jackpot[r[0]] || 5
        else if (r[0] == r[1] || r[1] == r[2] || r[0] == r[2]) mult = 1.5
        let win = Math.floor(n * mult)
        dt.usr.money += win - n
        await pesan.reply(`🎰 *SLOT*\n\n┃ ${r.join(' ┃ ')} ┃\n\n${mult ? `${mult >= 5 ? '🎉 *JACKPOT!* ' : '✨ '}Menang 💰 ${fmt(win)} (x${mult})` : `💸 Kalah 💰 ${fmt(n)}`}\nDompet: 💰 ${fmt(dt.usr.money)}`)
    },
    async coinflip(dt, pesan) {
        let [side, amount] = dt.text.trim().toLowerCase().split(/\s+/)
        side = /^(a|angka|head|h)/.test(side || '') ? 'angka' : /^(g|gambar|tail|t)/.test(side || '') ? 'gambar' : null
        if (!side) throw 'Contoh: !coinflip angka 1000\nPilihan: angka / gambar'
        let n = bet(dt, pesan, amount)
        let result = Math.random() < 0.5 ? 'angka' : 'gambar'
        let menang = result == side
        dt.usr.money += menang ? n : -n
        await pesan.reply(`🪙 Koin dilempar... *${result.toUpperCase()}*!\n\n${menang ? `✨ Menang 💰 ${fmt(n * 2)}` : `💸 Kalah 💰 ${fmt(n)}`}\nDompet: 💰 ${fmt(dt.usr.money)}`)
    },
    async dadu(dt, pesan) {
        let n = bet(dt, pesan, dt.text.trim())
        let a = 1 + Math.floor(Math.random() * 6)
        let b = 1 + Math.floor(Math.random() * 6)
        let hasil = a > b ? `✨ Kamu menang 💰 ${fmt(n * 2)}` : a < b ? `💸 Bot menang, kamu kalah 💰 ${fmt(n)}` : '🤝 Seri, taruhan dikembalikan'
        if (a != b) dt.usr.money += a > b ? n : -n
        await pesan.reply(`🎲 *DADU*\n\nKamu: ${dice[a]} (${a})\nBot: ${dice[b]} (${b})\n\n${hasil}\nDompet: 💰 ${fmt(dt.usr.money)}`)
    },
}
const alias = { slots: 'slot', cf: 'coinflip', flip: 'coinflip', dice: 'dadu' }

const handler = {}
handler.main = async function (dt, pesan) {
    let name = dt.command.toLowerCase()
    await games[alias[name] || name](dt, pesan)
}
handler.help = ['slot <taruhan>', 'coinflip angka|gambar <taruhan>', 'dadu <taruhan>']
handler.tags = ['rpg', 'game']
handler.command = /^(slots?|coinflip|cf|flip|dadu|dice)$/i
handler.cooldown = 8000
handler.exp = 0
module.exports = handler
