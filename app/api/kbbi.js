/**
 * Pencarian KBBI lewat kbbi.web.id (situs resmi kemdikbud sekarang butuh login).
 * lookup(kata) -> { lema, arti } atau null bila kata tidak ada.
 */
const fetch = require('node-fetch')
const cheerio = require('cheerio')

const cache = new Map()
const CACHE_LIMIT = 2000

async function lookup(kata) {
    kata = `${kata}`.trim().toLowerCase()
    if (cache.has(kata)) return cache.get(kata)
    let res = await fetch('https://kbbi.web.id/' + encodeURIComponent(kata), {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0 Safari/537.36' },
    })
    if (!res.ok) throw `KBBI sedang tidak bisa diakses (${res.status})`
    let $ = cheerio.load(await res.text())
    let d1 = $('#d1')
    let result = null
    if (d1.length && !/tidak ditemukan/i.test(d1.text())) {
        d1.find('br').replaceWith('\n')
        result = {
            lema: d1.find('b').first().text().replace(/·/g, '') || kata,
            arti: d1.text().replace(/\n{3,}/g, '\n\n').trim(),
        }
    }
    cache.set(kata, result)
    if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value)
    return result
}

// Kompatibel dengan pemakaian lama: kbbi(kata) -> { lema, arti: [] }, reject bila tidak ada
async function kbbi(kata) {
    let res = await lookup(kata)
    if (!res) throw `Kata "${kata}" tidak ditemukan di KBBI`
    return { lema: res.lema, arti: [res.arti.length > 1500 ? res.arti.slice(0, 1500) + '…' : res.arti] }
}

module.exports = { kbbi, lookup }
