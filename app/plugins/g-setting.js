const options = {
    welcome: 'Kartu welcome/bye & notifikasi admin',
    antilink: 'Hapus link grup WA lain + peringatan',
    antitoxic: 'Peringatan untuk kata kasar',
    antidelete: 'Kirim ulang pesan yang dihapus',
    mute: 'Bot hanya merespons admin',
    nsfw: 'Izinkan konten 18+',
}
const on = v => v ? '✅' : '❌'

const handler = {}
handler.main = async function (dt, pesan) {
    let room = dt.roomdb
    let cmd = dt.command.toLowerCase()
    let text = dt.text.trim()

    if (cmd == 'mute' || cmd == 'unmute') {
        room.mute = cmd == 'mute'
        return pesan.reply(room.mute ? '🔇 Bot dibisukan, sekarang hanya merespons admin' : '🔊 Bot kembali merespons semua anggota')
    }
    if (cmd == 'setwelcome' || cmd == 'setbye') {
        let key = cmd == 'setwelcome' ? 'sWelcome' : 'sBye'
        if (!text) return pesan.reply(`Variabel: @user, @subject, @desc, @count\nContoh:\n!${cmd} Halo @user, selamat datang di @subject!\n\n!${cmd} reset — kembali ke teks bawaan\n\nTeks sekarang:\n${room[key] || (key == 'sWelcome' ? server.welcome : server.bye)}`)
        room[key] = /^(reset|default)$/i.test(text) ? '' : text
        return pesan.reply(`✅ Teks ${cmd == 'setwelcome' ? 'welcome' : 'bye'} ${room[key] ? 'diubah' : 'dikembalikan ke bawaan'}`)
    }

    let [key, value] = text.toLowerCase().split(/\s+/)
    if (!key || !(key in options)) {
        let list = Object.entries(options).map(([k, desc]) => `${on(room[k])} *${k}* — ${desc}`).join('\n')
        return pesan.reply(`⚙️ *PENGATURAN GRUP*\n\n${list}\n\nUbah: !setting <opsi> on|off\nContoh: !setting antilink on`)
    }
    let enable = /^(on|1|aktif|nyala|true)$/.test(value || '') ? true : /^(off|0|mati|false)$/.test(value || '') ? false : !room[key]
    room[key] = enable
    await pesan.reply(`${on(enable)} *${key}* sekarang ${enable ? 'aktif' : 'nonaktif'}`)
}
handler.help = ['setting <opsi> on|off', 'mute', 'unmute', 'setwelcome <teks>', 'setbye <teks>']
handler.tags = ['group']
handler.command = /^(setting|settings|pengaturan|mute|unmute|setwelcome|setbye)$/i
handler.admin = true
handler.bypassMute = true
module.exports = handler
