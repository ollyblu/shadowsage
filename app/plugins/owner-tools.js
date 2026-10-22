const util = require('util')
const os = require('os')
const path = require('path')
const { exec } = require('child_process')
const { getTargets, tag } = require('../api/target')
const { formatDuration } = require('../api/rpg')

const delay = ms => new Promise(r => setTimeout(r, ms))
// "30d", "12j", "2w" -> milidetik
function parseDuration(text) {
    let m = `${text || ''}`.match(/(\d+)\s*(d|h|hari|j|jam|w|minggu|m|bulan)\b/i)
    if (!m) return 0
    let unit = { d: 864e5, h: 864e5, hari: 864e5, j: 36e5, jam: 36e5, w: 6048e5, minggu: 6048e5, m: 2592e6, bulan: 2592e6 }[m[2].toLowerCase()]
    return +m[1] * unit
}

const actions = {
    async eval(dt, pesan) {
        let result
        try {
            // eslint-disable-next-line no-eval
            result = await eval(`(async () => { ${/\breturn\b/.test(dt.text) ? dt.text : `return ${dt.text}`} })()`)
        } catch (e) { result = e }
        await pesan.reply(util.inspect(result, { depth: 2 }).slice(0, 4000))
    },
    async exec(dt, pesan) {
        if (!dt.text.trim()) return pesan.reply('Contoh: !exec node -v')
        exec(dt.text, { timeout: 60000, windowsHide: true, cwd: path.join(__dirname, '..', '..') }, (err, stdout, stderr) => {
            let out = `${stdout || ''}${stderr || ''}${err && !stderr ? err.message : ''}`.trim() || '(tidak ada output)'
            pesan.reply('```' + out.slice(0, 4000) + '```').catch(console.error)
        })
    },
    async bc(dt, pesan) {
        let text = dt.text.trim()
        if (!text) return pesan.reply('Contoh: !bc Bot update fitur baru, cek !menu')
        let groups = (await server.client.getChats()).filter(c => c.isGroup)
        await pesan.reply(`📢 Mengirim broadcast ke ${groups.length} grup...`)
        let ok = 0
        for (let g of groups) {
            try {
                await server.client.sendMessage(g.id._serialized, `📢 *BROADCAST ${bot.name}*\n\n${text}`)
                ok++
            } catch (e) { console.error('Broadcast gagal ke', g.id._serialized, e.message) }
            await delay(1500 + Math.random() * 1500)
        }
        await pesan.reply(`✅ Broadcast terkirim ke ${ok}/${groups.length} grup`)
    },
    async ban(dt, pesan) {
        let targets = (await getTargets(dt, pesan)).filter(id => !server.isOwner(id))
        if (!targets.length) return pesan.reply('Tag/reply/tulis nomor yang mau di-ban')
        let unban = /^unban$/i.test(dt.command)
        for (let id of targets) getUser(id).banned = !unban
        await server.client.sendMessage(pesan.from, `${unban ? '✅ Unban' : '🚫 Ban'}: ${targets.map(tag).join(', ')}`, { mentions: targets })
    },
    async listban(dt, pesan) {
        let list = Object.entries(global.db.users.data).filter(([, u]) => u && u.banned).map(([id]) => id)
        await server.client.sendMessage(pesan.from, list.length ? `🚫 *DAFTAR BAN*\n\n${list.map(tag).join('\n')}` : 'Tidak ada pengguna yang di-ban', { mentions: list })
    },
    async addprem(dt, pesan) {
        let targets = await getTargets(dt, pesan)
        if (!targets.length) return pesan.reply('Contoh: !addprem @user 30d\nSatuan: j (jam), d (hari), w (minggu), m (bulan). Tanpa durasi = permanen')
        let ms = parseDuration(dt.text.replace(/@\d+/g, ''))
        for (let id of targets) {
            let u = getUser(id)
            u.premium = true
            u.premiumTime = ms ? Math.max(Date.now(), u.premiumTime || 0) + ms : 0
        }
        await server.client.sendMessage(pesan.from, `💎 Premium ${ms ? formatDuration(ms) : 'permanen'} untuk ${targets.map(tag).join(', ')}`, { mentions: targets })
    },
    async delprem(dt, pesan) {
        let targets = await getTargets(dt, pesan)
        if (!targets.length) return pesan.reply('Tag/reply pengguna')
        for (let id of targets) Object.assign(getUser(id), { premium: false, premiumTime: 0 })
        await server.client.sendMessage(pesan.from, `Premium dicabut: ${targets.map(tag).join(', ')}`, { mentions: targets })
    },
    async listprem(dt, pesan) {
        let list = Object.entries(global.db.users.data).filter(([, u]) => u && u.premium)
        let rows = list.map(([id, u]) => `${tag(id)} — ${u.premiumTime > 0 ? `sisa ${formatDuration(u.premiumTime - Date.now())}` : 'permanen'}`)
        await server.client.sendMessage(pesan.from, rows.length ? `💎 *PENGGUNA PREMIUM*\n\n${rows.join('\n')}` : 'Belum ada pengguna premium', { mentions: list.map(([id]) => id) })
    },
    async addlimit(dt, pesan) {
        let targets = await getTargets(dt, pesan, { numbers: false })
        let n = parseInt(dt.text.replace(/@\d+/g, '').trim())
        if (!targets.length || !n) return pesan.reply('Contoh: !addlimit @user 50')
        for (let id of targets) getUser(id).limit += n
        await server.client.sendMessage(pesan.from, `⛽ +${n} limit untuk ${targets.map(tag).join(', ')}`, { mentions: targets })
    },
    async backupdb(dt, pesan) {
        await dbWrite()
        let dir = path.join(__dirname, '..', 'database')
        let prefix = opts._[0] ? opts._[0] + '_' : ''
        let owner = `${bot.owner[0]}@c.us`
        for (let name of ['users', 'rooms', 'settings']) {
            let media = server.MessageMedia.fromFilePath(path.join(dir, `${prefix}${name}.json`))
            media.filename = `${name}-${new Date().toISOString().slice(0, 10)}.json`
            await server.client.sendMessage(owner, media, { sendMediaAsDocument: true })
        }
        if (pesan.from !== owner) await pesan.reply('✅ Backup database dikirim ke chat owner')
    },
    async restart(dt, pesan) {
        if (!process.send) return pesan.reply('Bot tidak dijalankan lewat index.js, restart manual ya')
        await pesan.reply('♻️ Restarting...')
        await dbWrite()
        process.send('reset')
    },
    async mode(dt, pesan) {
        let s = server.settings()
        let mode = dt.text.trim().toLowerCase()
        if (!['public', 'self', 'group'].includes(mode)) return pesan.reply(`Mode sekarang: *${s.mode}*\n\n!mode public — semua orang\n!mode self — hanya owner\n!mode group — hanya di grup (owner tetap bisa di chat pribadi)`)
        s.mode = mode
        await pesan.reply(`✅ Mode bot: *${mode}*`)
    },
    async stats(dt, pesan) {
        let s = server.settings()
        let top = Object.entries(s.stats).sort((a, b) => b[1] - a[1]).slice(0, 10)
        let mem = process.memoryUsage()
        let mb = n => (n / 1048576).toFixed(1) + ' MB'
        let users = Object.values(global.db.users.data).filter(u => u && typeof u == 'object')
        await pesan.reply(`📊 *STATISTIK BOT*

⏱️ Uptime: ${formatDuration(process.uptime() * 1000)}
👥 Pengguna: ${users.length} (💎 ${users.filter(u => u.premium).length}, 🚫 ${users.filter(u => u.banned).length})
💬 Room tersimpan: ${Object.keys(global.db.room.data).length}
⏰ Pengingat aktif: ${s.reminders.length}
🔌 Plugin: ${Object.values(global.plugins).filter(p => p && !p.disabled).length} aktif / ${Object.keys(global.plugins).length}
⚙️ Mode: ${s.mode} • API: ${server.api}

🧠 RAM: ${mb(mem.rss)} (heap ${mb(mem.heapUsed)})
🖥️ ${os.type()} ${os.release()} • Node ${process.version}
💾 Free memory server: ${mb(os.freemem())} / ${mb(os.totalmem())}

🔥 *Perintah terpopuler*
${top.map(([name, n], i) => `${i + 1}. ${name.replace(/\.js$/, '')} — ${n}x`).join('\n') || '-'}`)
    },
    async plugins(dt, pesan) {
        let list = Object.entries(global.plugins).map(([name, p]) => `${p && p.disabled ? '❌' : '✅'} ${name}`)
        await pesan.reply(list.join('\n'))
    },
}
const alias = { '>': 'eval', ev: 'eval', '$': 'exec', broadcast: 'bc', unban: 'ban', banlist: 'listban', premium: 'addprem', unprem: 'delprem', backup: 'backupdb', topcmd: 'stats', status: 'stats', plugin: 'plugins' }

const handler = {}
handler.main = async function (dt, pesan) {
    let name = dt.command.toLowerCase()
    await actions[alias[name] || name](dt, pesan)
}
handler.help = ['eval <js>', 'exec <cmd>', 'bc <pesan>', 'ban @tag', 'unban @tag', 'listban', 'addprem @tag 30d', 'delprem @tag', 'listprem', 'addlimit @tag <n>', 'backupdb', 'restart', 'mode public|self|group', 'stats', 'plugins']
handler.tags = ['owner']
handler.command = /^(eval|ev|exec|bc|broadcast|ban|unban|listban|banlist|addprem|premium|delprem|unprem|listprem|addlimit|backupdb|backup|restart|mode|stats|topcmd|status|plugins?)$/i
handler.owner = true
handler.bypassMute = true
handler.exp = 0
module.exports = handler
