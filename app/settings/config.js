let fs = require('fs')
let chalk = require('chalk')
let file = require.resolve(__filename)
fs.watchFile(file,()=>{
  fs.unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  delete require.cache[file]
  require(file)
})
// Prefix API eksternal untuk global.API(name, path, query, apikeyqueryname)
// Endpoint lama (herokuapp, xteam, zeks, dll) sudah mati dan dihapus.
// API key diambil dari .env (lihat .env.example), contoh: APIKEY_LOLHUMAN=xxxx
global.APIs = {
    // name: 'https://website'
    lol: 'https://api.lolhuman.xyz',
}
global.APIKeys = {
    // 'https://website': 'apikey'
    'https://api.lolhuman.xyz': process.env.APIKEY_LOLHUMAN || '',
}

global.config = {}
config.wait = '_*𝚜𝚎𝚍𝚊𝚗𝚐 𝚍𝚒 𝚙𝚛𝚘𝚜𝚎𝚜...*_'
config.eror = '_*𝚖𝚊𝚊𝚏 𝚜𝚎𝚛𝚟𝚎𝚛 𝚜𝚎𝚍𝚊𝚗𝚐 𝚊𝚍𝚊 𝚔𝚎𝚜𝚊𝚕𝚊𝚑𝚊𝚗 𝚝𝚎𝚔𝚗𝚒𝚜...*_'
// Limit harian default; direset tiap 00:00 WIB (lihat api/cron.js)
config.defaultLimit = 70
// Pesan penolakan dari middleware handler (atribut plugin: owner, premium, group, admin, dll)
config.dfail = {
    owner: '👑 Perintah ini khusus *owner* bot',
    premium: '💎 Perintah ini khusus pengguna *premium*\nBeli tiket premium di *!shop*',
    group: '👥 Perintah ini hanya bisa dipakai di *grup*',
    private: '🔒 Perintah ini hanya bisa dipakai di *chat pribadi*',
    admin: '🛡️ Perintah ini khusus *admin grup*',
    botAdmin: '🤖 Jadikan bot *admin* dulu agar perintah ini bisa jalan',
    level: lv => `📈 Perintah ini butuh minimal *level ${lv}*\nCek level kamu di *!profile*`,
    limit: n => `⛽ Limit kamu tidak cukup (butuh ${n})\nLimit direset tiap 00:00 WIB, atau beli di *!buylimit*`,
    cooldown: ms => `⏳ Sabar, tunggu *${Math.ceil(ms / 1000)} detik* lagi`,
}
