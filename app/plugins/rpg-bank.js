const { getTarget, tag } = require('../api/target')
const { fmt, parseAmount, formatDuration } = require('../api/rpg')

const ROB_COOLDOWN = 3600000
const ROB_CHANCE = 0.4

const actions = {
    async bank(dt, pesan) {
        let u = dt.usr
        await pesan.reply(`🏦 *BANK SHADOWSAGE*\n\n💰 Dompet: *${fmt(u.money)}*\n🏦 Tabungan: *${fmt(u.bank)}*\n💵 Total: *${fmt(u.money + u.bank)}*\n\n_Uang di bank aman dari !rob_\n!depo <jumlah|all> — simpan\n!tarik <jumlah|all> — ambil`)
    },
    async depo(dt, pesan) {
        let n = parseAmount(dt.text, dt.usr.money)
        if (!n || n < 1) return pesan.reply('Contoh: !depo 5000 atau !depo all')
        if (n > dt.usr.money) return pesan.reply(`Uang di dompet cuma 💰 ${fmt(dt.usr.money)}`)
        dt.usr.money -= n
        dt.usr.bank += n
        await pesan.reply(`✅ Menyimpan 💰 ${fmt(n)} ke bank\n🏦 Tabungan: ${fmt(dt.usr.bank)}`)
    },
    async tarik(dt, pesan) {
        let n = parseAmount(dt.text, dt.usr.bank)
        if (!n || n < 1) return pesan.reply('Contoh: !tarik 5000 atau !tarik all')
        if (n > dt.usr.bank) return pesan.reply(`Tabungan kamu cuma 🏦 ${fmt(dt.usr.bank)}`)
        dt.usr.bank -= n
        dt.usr.money += n
        await pesan.reply(`✅ Mengambil 💰 ${fmt(n)} dari bank\n💰 Dompet: ${fmt(dt.usr.money)}`)
    },
    async transfer(dt, pesan) {
        let target = await getTarget(dt, pesan, { numbers: false })
        let n = parseAmount(dt.text.replace(/@\d+/g, '').trim(), dt.usr.money)
        if (!target || !n || n < 1) return pesan.reply('Contoh: !transfer @user 5000')
        if (target == dt.sender) return pesan.reply('Transfer ke diri sendiri? 🤨')
        if (server.isBot(target)) return pesan.reply('Bot tidak butuh uang, makasih 😌')
        if (n > dt.usr.money) return pesan.reply(`Uang di dompet cuma 💰 ${fmt(dt.usr.money)}`)
        dt.usr.money -= n
        getUser(target).money += n
        await server.client.sendMessage(pesan.from, `💸 *TRANSFER BERHASIL*\n${tag(dt.sender)} ➜ ${tag(target)}\nJumlah: 💰 ${fmt(n)}`, { mentions: [dt.sender, target] })
    },
    async rob(dt, pesan) {
        let target = await getTarget(dt, pesan, { numbers: false })
        if (!target || target == dt.sender || server.isBot(target)) return pesan.reply('Tag orang yang mau dirampok\nContoh: !rob @user')
        let left = dt.usr.lastRob + ROB_COOLDOWN - Date.now()
        if (left > 0) return pesan.reply(`🚓 Polisi masih patroli. Coba lagi dalam *${formatDuration(left)}*`)
        let victim = getUser(target)
        if (victim.money < 500) return pesan.reply('Dompetnya tipis banget, kasihan 😢')
        if (dt.usr.money < 500) return pesan.reply('Butuh minimal 💰 500 di dompet untuk modal (kalau ketangkap kena denda)')
        dt.usr.lastRob = Date.now()
        let mentions = [dt.sender, target]
        if (victim.inventory.shield > 0) {
            victim.inventory.shield--
            return server.client.sendMessage(pesan.from, `🛡️ ${tag(target)} memakai *Perisai*! Perampokan ${tag(dt.sender)} gagal total.`, { mentions })
        }
        if (Math.random() < ROB_CHANCE) {
            let n = Math.floor(victim.money * (0.1 + Math.random() * 0.2))
            victim.money -= n
            dt.usr.money += n
            return server.client.sendMessage(pesan.from, `🦹 ${tag(dt.sender)} berhasil merampok ${tag(target)}!\nHasil: 💰 ${fmt(n)}`, { mentions })
        }
        let fine = Math.floor(dt.usr.money * 0.15)
        dt.usr.money -= fine
        victim.money += fine
        await server.client.sendMessage(pesan.from, `🚔 ${tag(dt.sender)} ketangkap saat mencoba merampok ${tag(target)}!\nDenda 💰 ${fmt(fine)} diberikan ke korban.`, { mentions })
    },
}
const alias = { atm: 'bank', dompet: 'bank', balance: 'bank', bal: 'bank', deposit: 'depo', nabung: 'depo', withdraw: 'tarik', wd: 'tarik', tf: 'transfer', kirim: 'transfer', rampok: 'rob' }

const handler = {}
handler.main = async function (dt, pesan) {
    let name = dt.command.toLowerCase()
    await actions[alias[name] || name](dt, pesan)
}
handler.help = ['bank', 'depo <jumlah>', 'tarik <jumlah>', 'transfer @tag <jumlah>', 'rob @tag']
handler.tags = ['rpg']
handler.command = /^(bank|atm|dompet|balance|bal|depo|deposit|nabung|tarik|withdraw|wd|transfer|tf|kirim|rob|rampok)$/i
module.exports = handler
