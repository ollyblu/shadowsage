// Kurs mata uang (open.er-api.com) & harga kripto (coingecko), tanpa API key
const fetch = require('node-fetch')

const major = ['USD', 'EUR', 'SGD', 'MYR', 'JPY', 'SAR', 'CNY', 'AUD', 'GBP', 'KRW']
const coins = { btc: 'bitcoin', eth: 'ethereum', bnb: 'binancecoin', sol: 'solana', xrp: 'ripple', doge: 'dogecoin', usdt: 'tether', ada: 'cardano', trx: 'tron', ton: 'the-open-network' }
const idr = n => 'Rp ' + Number(n).toLocaleString('id-ID', { maximumFractionDigits: n < 10 ? 4 : 2 })
let rates = { time: 0, data: null }

async function getRates() {
    if (rates.data && Date.now() - rates.time < 3600000) return rates.data
    let json = await (await fetch('https://open.er-api.com/v6/latest/USD', { timeout: 15000 })).json()
    if (json.result !== 'success') throw 'Data kurs tidak tersedia'
    rates = { time: Date.now(), data: json.rates }
    return json.rates
}

const handler = {}
handler.main = async function (dt, pesan) {
    let [a, b] = dt.text.trim().toLowerCase().split(/\s+/)
    if (/^(crypto|kripto|coin)$/i.test(dt.command)) {
        let ids = a && coins[a] ? [coins[a]] : a ? [a] : Object.values(coins).slice(0, 7)
        let json = await (await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=idr,usd&include_24hr_change=true`, { timeout: 15000 })).json()
        let rows = Object.entries(json).map(([id, p]) => {
            let sym = Object.keys(coins).find(k => coins[k] == id) || id
            let ch = p.usd_24h_change || 0
            return `*${sym.toUpperCase()}* ${idr(p.idr)} ($${p.usd.toLocaleString('en-US')}) ${ch >= 0 ? '🟢' : '🔴'} ${ch.toFixed(2)}%`
        })
        if (!rows.length) return pesan.reply(`Koin tidak ditemukan. Contoh: !crypto btc\nTersedia: ${Object.keys(coins).join(', ')}`)
        return pesan.reply(`🪙 *HARGA KRIPTO*\n\n${rows.join('\n')}\n\n_Perubahan 24 jam • coingecko_`)
    }
    let data = await getRates()
    // !kurs usd 100 -> 100 USD dalam rupiah
    if (a) {
        let code = a.toUpperCase()
        if (!data[code]) return pesan.reply(`Kode mata uang "${code}" tidak dikenal`)
        let amount = parseFloat((b || '1').replace(',', '.')) || 1
        return pesan.reply(`💱 ${amount.toLocaleString('id-ID')} ${code} = *${idr(amount * data.IDR / data[code])}*`)
    }
    let rows = major.map(c => `${c}: *${idr(data.IDR / data[c])}*`)
    await pesan.reply(`💱 *KURS HARI INI* (ke Rupiah)\n\n${rows.join('\n')}\n\nKonversi: !kurs usd 100`)
}
handler.help = ['kurs [kode] [jumlah]', 'crypto [koin]']
handler.tags = ['info']
handler.command = /^(kurs|rate|crypto|kripto|coin)$/i
handler.cooldown = 5000
module.exports = handler
