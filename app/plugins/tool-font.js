let fetch = require('node-fetch')
let cheerio = require('cheerio')
const handler = {}

handler.main = async function(dt,pesan){
    if(dt.args.length<2){
        return pesan.reply('Contoh:\n!font Pesan...')
    }
    let data = dt.text.trim()
    if(!data) return pesan.reply('Contoh:\n!font Pesan...')
    await pesan.reply(Object.entries(await stylizeTextCheerio(data)).map(([name, value]) => `*${name}*\n${value}`).join`\n\n`)
}


async function stylizeTextCheerio(text) {
    let res = await fetch('https://qaz.wtf/u/convert.cgi?text=' + encodeURIComponent(text));
    if (!res.ok) throw `Server font sedang error (${res.status})`
    let html = await res.text();

    // Memuat HTML ke Cheerio
    const $ = cheerio.load(html); 

    let obj = {};
    // Menggunakan selector seperti jQuery
    const tableRows = $('table').children().first().children(); 

    tableRows.each((i, tr) => {
        let name = $(tr).find('.aname').html();
        // .text() mendapatkan konten teks, trim() untuk menghapus whitespace di awal/akhir
        let content = $(tr).children().eq(1).text().trim(); 

        obj[name + (obj[name] ? ' Reversed' : '')] = content;
    });
    return obj;
}


handler.command = /^font$/i
handler.help = 'font Pesan...'
handler.tags = ['tools']
handler.disabled = false
module.exports = handler