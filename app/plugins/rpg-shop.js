const { fmt, parseAmount, items } = require('../api/rpg')

const LIMIT_PRICE = 150

const actions = {
    async shop(dt, pesan) {
        let list = Object.entries(items).map(([id, it]) => `${it.name}\n   Harga: 💰 ${fmt(it.price)} • kode: *${id}*\n   _${it.desc}_`).join('\n\n')
        await pesan.reply(`🛒 *TOKO SHADOWSAGE*\n\n${list}\n\n⛽ Limit\n   Harga: 💰 ${LIMIT_PRICE}/limit • !buylimit <jumlah>\n\nBeli: !buy <kode> [jumlah]\nPakai: !use <kode>\nTas: !inv\n\n💰 Uang kamu: ${fmt(dt.usr.money)}`)
    },
    async buy(dt, pesan) {
        let [id, qty] = dt.text.trim().toLowerCase().split(/\s+/)
        if (id == 'limit') return actions.buylimit(dt, pesan, qty)
        let item = items[id]
        if (!item) return pesan.reply('Item tidak ada. Lihat daftar di !shop')
        let n = parseAmount(qty || '1', Math.floor(dt.usr.money / item.price))
        if (!n || n < 1) return pesan.reply('Jumlah tidak valid')
        let total = n * item.price
        if (total > dt.usr.money) return pesan.reply(`Uang tidak cukup. Butuh 💰 ${fmt(total)}, kamu punya 💰 ${fmt(dt.usr.money)}`)
        dt.usr.money -= total
        dt.usr.inventory[id] = (dt.usr.inventory[id] || 0) + n
        await pesan.reply(`✅ Membeli ${n}x ${item.name} seharga 💰 ${fmt(total)}\nPakai dengan !use ${id}`)
    },
    async buylimit(dt, pesan, qty) {
        let n = parseAmount(qty || dt.text.trim().replace(/^limit\s*/i, ''), Math.floor(dt.usr.money / LIMIT_PRICE))
        if (!n || n < 1) return pesan.reply(`Contoh: !buylimit 10\nHarga 💰 ${LIMIT_PRICE}/limit`)
        let total = n * LIMIT_PRICE
        if (total > dt.usr.money) return pesan.reply(`Uang tidak cukup. Butuh 💰 ${fmt(total)}`)
        dt.usr.money -= total
        dt.usr.limit += n
        await pesan.reply(`✅ Membeli ⛽ ${n} limit seharga 💰 ${fmt(total)}\nLimit sekarang: ${dt.usr.limit}`)
    },
    async inv(dt, pesan) {
        let owned = Object.entries(dt.usr.inventory).filter(([id, n]) => n > 0 && items[id])
        let list = owned.length ? owned.map(([id, n]) => `${items[id].name} × *${n}*`).join('\n') : '_Tas kosong. Belanja di !shop_'
        await pesan.reply(`🎒 *INVENTORY*\n\n${list}`)
    },
    async use(dt, pesan) {
        let id = dt.text.trim().toLowerCase().split(/\s+/)[0]
        let item = items[id]
        if (!item) return pesan.reply('Contoh: !use lootbox\nLihat isi tas di !inv')
        if (!(dt.usr.inventory[id] > 0)) return pesan.reply(`Kamu tidak punya ${item.name}. Beli di !shop`)
        let result = await use[id](dt, pesan)
        if (result === false) return
        dt.usr.inventory[id]--
        if (result) await pesan.reply(result)
    },
}

// Efek item. Mengembalikan teks hasil, atau false bila item batal dipakai
const use = {
    async petunjuk(dt, pesan) {
        let room = server.room[dt.room_id]
        let quiz = require('../api/quiz')
        if (!room.child || !quiz.games[room.child] || !room[room.child]) {
            await pesan.reply('Kartu Petunjuk hanya bisa dipakai saat ada soal tebak-tebakan aktif')
            return false
        }
        await quiz(room.child).hint(dt, pesan)
        return ''
    },
    async shield(dt, pesan) {
        await pesan.reply('🛡️ Perisai bekerja otomatis saat ada yang mencoba !rob kamu, tidak perlu dipakai manual')
        return false
    },
    async lootbox(dt) {
        let roll = Math.random()
        if (roll < 0.45) {
            let n = 300 + Math.floor(Math.random() * 4700)
            dt.usr.money += n
            return `🎁 Kotak berisi 💰 *${fmt(n)}* money!`
        }
        if (roll < 0.7) {
            let n = 5 + Math.floor(Math.random() * 16)
            dt.usr.limit += n
            return `🎁 Kotak berisi ⛽ *${n}* limit!`
        }
        let id = roll < 0.9 ? 'petunjuk' : 'shield'
        dt.usr.inventory[id] = (dt.usr.inventory[id] || 0) + 1
        return `🎁 Kotak berisi ${items[id].name}!`
    },
    async premium(dt) {
        dt.usr.premium = true
        dt.usr.premiumTime = Math.max(Date.now(), dt.usr.premiumTime || 0) + 86400000
        return `💎 Premium aktif sampai *${new Date(dt.usr.premiumTime).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}*`
    },
}

const alias = { toko: 'shop', store: 'shop', beli: 'buy', inventory: 'inv', tas: 'inv', pakai: 'use', belilimit: 'buylimit' }
const handler = {}
handler.main = async function (dt, pesan) {
    let name = dt.command.toLowerCase()
    await actions[alias[name] || name](dt, pesan)
}
handler.help = ['shop', 'buy <item> [jumlah]', 'buylimit <jumlah>', 'inv', 'use <item>']
handler.tags = ['rpg']
handler.command = /^(shop|toko|store|buy|beli|buylimit|belilimit|inv|inventory|tas|use|pakai)$/i
module.exports = handler
