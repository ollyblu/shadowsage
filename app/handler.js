const chalk = require("chalk")
const generate = require('qrcode-terminal')
const fs = require('fs')
const moment = require('moment-timezone')
global.isNumber = x => typeof x === 'number' && !isNaN(x)
const util = require('util')
const os = require('os')
const fetch = require('node-fetch')
global.template = require('./library/template.json')
global.game = {
    salah: 0.05,
    mulai: 0.1,
    clue: 0.6,
    dikit: 0.03,
    dikitlagi: '❎',
    salahlah: '❌',
    proses: function (poin, nilai) { let hasil = Math.floor(poin * nilai); return isNumber(hasil) ? hasil : 1 }
}
server.identifier = ['!', '.', '#', '$']
server.pemisah = [' ', '|', '~', '<', '>', '+']
server.nResp = /(\/|\/\/|,)/
server.emoticon = {
    bingung: ['🤨', '😇', '🙏🏻', '🥲', '🙂', '🫡', '🤔', '🥱', '😴', '😮‍💨', '🥴'],
    bingunglah: function () { return this.bingung[Math.floor(Math.random() * this.bingung.length)] },
    marah: ['🤬', '😡']
}
const MAX_PROCESS = 3
const ownerJid = () => `${bot.owner[0]}@c.us`
const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')

function defaultUser(user = {}) {
    if (!isNumber(user.level)) user.level = 1
    if (!isNumber(user.exp)) user.exp = 0
    if (!isNumber(user.limit)) user.limit = 70
    if (!isNumber(user.poinG)) user.poinG = 0
    if (!isNumber(user.money)) user.money = 0
    if (!('banned' in user)) user.banned = false
    if (!('premium' in user)) user.premium = false
    if (!isNumber(user.premiumTime)) user.premiumTime = 0
    if (!('gender' in user)) user.gender = 'Unknown'
    if (!isNumber(user.bank)) user.bank = 0
    if (typeof user.inventory !== 'object' || user.inventory === null) user.inventory = {}
    for (let key of ['lastDaily', 'lastWeekly', 'lastRob', 'lastWork']) if (!isNumber(user[key])) user[key] = 0
    return user
}
global.defaultUser = defaultUser
global.getUser = function getUser(id) {
    let users = global.db.users.data
    if (typeof users[id] !== 'object' || users[id] === null) users[id] = {}
    return defaultUser(users[id])
}
// Pengaturan per chat (grup atau chat pribadi), disimpan di db.room
function defaultRoom(room = {}) {
    if (!isNumber(room.game)) room.game = 0
    for (let key of ['antilink', 'antitoxic', 'antidelete', 'mute', 'nsfw']) if (typeof room[key] !== 'boolean') room[key] = false
    if (typeof room.welcome !== 'boolean') room.welcome = true
    if (typeof room.sWelcome !== 'string') room.sWelcome = ''
    if (typeof room.sBye !== 'string') room.sBye = ''
    if (typeof room.warn !== 'object' || room.warn === null) room.warn = {}
    return room
}
global.defaultRoom = defaultRoom
global.getRoom = function getRoom(id) {
    let rooms = global.db.room.data
    if (typeof rooms[id] !== 'object' || rooms[id] === null) rooms[id] = {}
    return defaultRoom(rooms[id])
}
// ID room grup = waktu pembuatan grup (lihat handler), dipakai juga oleh event grup
global.roomIdOf = chat => chat.isGroup ? (chat.groupMetadata && chat.groupMetadata.creation) || chat.id._serialized : chat.id._serialized
const level = require('./api/level')
const cooldowns = new Map()
const limitCost = plugin => plugin.limit === true ? 1 : isNumber(plugin.limit) ? plugin.limit : 0

module.exports = {
    async handler(chatUpdate) {
        if (!server.isReady) return 0
        if (chatUpdate.from == 'status@broadcast' || chatUpdate.isStatus) return 0
        if (typeof chatUpdate.body !== 'string') return 0
        // Pesan 1 karakter tetap diproses (tebakan huruf hangman, angka tictactoe, dll)
        if (!chatUpdate.body.trim() && !chatUpdate.hasMedia) return 0
        let dt = {}
        let pesan = chatUpdate.body
        dt.chat = await chatUpdate.getChat()
        dt.id = Date.now() + Math.random()
        dt.sender = await server.toPn(chatUpdate.author || chatUpdate.from)
        dt.room_id = dt.chat.isGroup ? (dt.chat.groupMetadata && dt.chat.groupMetadata.creation) || dt.chat.id._serialized : dt.sender
        let sender = dt.sender
        if (typeof server.room[dt.room_id] == 'undefined') {
            server.room[dt.room_id] = {
                name: 'home',
                timeout: undefined,
                child: undefined,
                process: []
            }
        }
        let room = server.room[dt.room_id]
        if (!Array.isArray(room.process)) room.process = []
        let processes = room.process

        //antispam
        if (processes.length >= MAX_PROCESS) return 0
        processes.push(dt.id)
        try {
            if (processes.length == MAX_PROCESS) await chatUpdate.reply('jangan spam ngab:(')
            await this.process(dt, chatUpdate, pesan, sender)
        } finally {
            let index = processes.indexOf(dt.id)
            if (index >= 0) processes.splice(index, 1)
        }
    },
    async process(dt, chatUpdate, pesan, sender) {
        await dbLoad()
        let pemisah = server.pemisah.filter((pemisah) => pesan.includes(pemisah))
        pesan = pesan.replace(/[|+]/g, ' ')
        pemisah = [...new Set(pemisah.map(p => p == '|' || p == '+' ? ' ' : p))]
        dt.args = pemisah.length > 0
            ? pesan.split(RegExp(`[${pemisah.map(escapeRegex).join('')}\\s]+`)).filter(v => v)
            : [pesan]
        if (!dt.args.length) dt.args = [pesan]
        let isPrefix = server.identifier.includes(dt.args[0].charAt(0))
        let command = isPrefix || /[?!]$/.test(chatUpdate.body.trim())
        if (dt.args[0].length < 2 && isPrefix) dt.args = dt.args.slice(1)
        if (command && dt.args.length) {
            command = dt.args[0]
            if (server.identifier.includes(command.charAt(0))) command = command.slice(1)
            command = command.replace(/[?!]+$/, '')
        } else command = false
        // Teks setelah perintah, apa adanya (tanpa dipecah pemisah)
        dt.command = command
        dt.text = command ? chatUpdate.body.replace(new RegExp(`^\\s*[!.#$]?\\s*${escapeRegex(command)}[?!]*[\\s|~<>+]*`, 'i'), '') : chatUpdate.body
        if (command) {
            console.log(chalk.blueBright(command))
            console.log(dt.args)
        }

        try {
            let isNewUser = typeof global.db.users.data[sender] == 'undefined'
            // Buat data user dulu supaya pesan selamat datang tidak terkirim dobel
            dt.usr = getUser(sender)
            if (isNewUser && !dt.chat.isGroup) {
                let replace = {
                    '%': '%',
                    name: `@${sender.split('@')[0]}`,
                    ucapan: ucapan(),
                    me: bot.name
                }
                let text = global.template.welcome
                text = text.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join`|`})`, 'g'), (_, name) => '' + replace[name])
                await server.client.sendMessage(chatUpdate.from, text.toString(), { mentions: [sender] })
            }
        } catch (e) { console.log(e) }
        dt.usr = getUser(sender)
        dt.roomdb = getRoom(dt.room_id)
        dt.isOwner = server.isOwner(sender) || !!chatUpdate.fromMe
        dt.isPremium = dt.isOwner || !!dt.usr.premium || (bot.premium || []).map(String).includes(sender.split('@')[0])
        // Status admin dihitung hanya bila dibutuhkan (perlu daftar peserta grup)
        dt.getAdmin = async () => {
            if (dt.isAdmin !== undefined) return dt
            dt.isAdmin = dt.isBotAdmin = false
            if (!dt.chat.isGroup) return dt
            dt.participants = await server.getParticipants(dt.chat, { includeBot: true })
            dt.isAdmin = dt.participants.some(p => p.id == sender && p.isAdmin)
            dt.isBotAdmin = dt.participants.some(p => server.isBot(p.id) && p.isAdmin)
            return dt
        }
        if (dt.usr.banned && !dt.isOwner) return
        let mode = server.settings().mode
        if (!dt.isOwner && (mode == 'self' || (mode == 'group' && !dt.chat.isGroup))) return
        if (command && dt.chat.isGroup && dt.roomdb.mute && !dt.isOwner) {
            await dt.getAdmin()
            dt.muted = !dt.isAdmin
        }

        let command_found = false
        for (let name in global.plugins) {
            let plugin = global.plugins[name]
            if (!plugin) continue
            if (plugin.disabled) continue
            if (!server.room[dt.room_id]) server.room[dt.room_id] = { name: 'home', process: [] }
            let room = server.room[dt.room_id]
            if (plugin.room && room.name !== plugin.room && room.name !== 'home') continue
            if (plugin.child && plugin.child !== room.child) continue
            if (typeof plugin.all === 'function') {
                try {
                    await plugin.all(dt, chatUpdate)
                } catch (e) {
                    console.log('catch', name, e)
                    if (typeof e == 'string') await chatUpdate.reply(e)
                    else await this.reportError(name, dt, `${pesan}`, e)
                }
                // Plugin .all bisa menghentikan pemrosesan plugin lain dengan dt.stop = true
                if (dt.stop) break
                continue
            }
            if (!command) continue
            if (!(plugin.command instanceof RegExp)) continue
            plugin.command.lastIndex = 0
            if (!plugin.command.test(command)) continue
            if (typeof plugin.main !== 'function') continue
            command_found = true
            if (dt.muted && !plugin.bypassMute) break
            let fail = await this.checkAccess(name, plugin, dt)
            if (fail) {
                await chatUpdate.reply(fail)
                break
            }
            try {
                await chatUpdate.react('🧑🏻‍🦽').catch(() => { })
                await plugin.main(dt, chatUpdate)
                // Plugin bisa membatalkan potongan limit (mis. hanya menampilkan cara pakai) dengan dt.noLimit = true
                if (!dt.isPremium && !dt.noLimit) dt.usr.limit -= limitCost(plugin)
                dt.usr.exp += isNumber(plugin.exp) ? plugin.exp : 3 + Math.floor(Math.random() * 8)
                let stats = server.settings().stats
                stats[name] = (stats[name] || 0) + 1
            } catch (e) {
                console.log('catch', name, e)
                if (typeof e == 'string') await chatUpdate.reply(e)
                else if (e) {
                    await chatUpdate.reply(`Mohon maaf terdapat error pada perintah tersebut`)
                    await this.reportError(name, dt, `${plugin.command}: ${dt.args.join(' ')}`, e)
                }
            }
            break
        }
        if (!command_found && command && server.identifier.includes(chatUpdate.body.trim().charAt(0)))
            await chatUpdate.react(server.emoticon.bingunglah()).catch(() => { })
        if (isNumber(dt.usr.poinG)) dt.usr.poinG = Math.abs(Math.floor(dt.usr.poinG))
        for (let key of ['exp', 'money', 'limit']) if (!isNumber(dt.usr[key])) dt.usr[key] = 0
        dt.usr.exp = Math.floor(dt.usr.exp)
        let before = level.levelUp(dt.usr)
        if (before !== false && !dt.muted) {
            await server.client.sendMessage(chatUpdate.from, `🎉 *LEVEL UP!*\n@${sender.split('@')[0]} naik dari level *${before}* ke *${dt.usr.level}*\nGelar: ${level.role(dt.usr.level)}`, { mentions: [sender] }).catch(console.error)
        }
    },
    // Mengembalikan pesan penolakan bila pengguna tidak boleh menjalankan plugin, selain itu null
    async checkAccess(name, plugin, dt) {
        const fail = global.config.dfail
        if (plugin.owner && !dt.isOwner) return fail.owner
        if (plugin.premium && !dt.isPremium) return fail.premium
        if ((plugin.group || plugin.admin || plugin.botAdmin) && !dt.chat.isGroup) return fail.group
        if (plugin.private && dt.chat.isGroup) return fail.private
        if (plugin.admin || plugin.botAdmin) await dt.getAdmin()
        if (plugin.admin && !dt.isAdmin && !dt.isOwner) return fail.admin
        if (plugin.botAdmin && !dt.isBotAdmin) return fail.botAdmin
        if (isNumber(plugin.level) && dt.usr.level < plugin.level && !dt.isOwner) return fail.level(plugin.level)
        let cost = limitCost(plugin)
        if (cost && !dt.isPremium && dt.usr.limit < cost) return fail.limit(cost)
        if (isNumber(plugin.cooldown) && !dt.isOwner) {
            let key = `${name}:${dt.sender}`
            let left = (cooldowns.get(key) || 0) + plugin.cooldown - Date.now()
            if (left > 0) return fail.cooldown(left)
            cooldowns.set(key, Date.now())
            if (cooldowns.size > 5000) for (let [k, t] of cooldowns) if (Date.now() - t > 3600000) cooldowns.delete(k)
        }
        return null
    },
    async reportError(name, dt, command, e) {
        try {
            let text = util.format(e)
            while (text.includes(__dirname)) text = text.replace(__dirname, 'Google:\\app')
            await server.client.sendMessage(ownerJid(), `*Plugin:* ${name}\n*Sender:* @${dt.sender.split('@')[0]}\n*Chat:* ${dt.room_id}\n*Command:* ${command}\n\n\`\`\`${text}\`\`\``.trim(), { mentions: [dt.sender] })
        } catch (err) { console.error('Gagal melapor ke owner', err) }
    },
    // Anggota masuk/keluar/di-promote/di-demote. action: add | remove | promote | demote
    async group_update(n, action) {
        if (!server.isReady) return
        let chatId = n.chatId || (n.id && n.id.remote)
        if (!chatId) return
        let chat = await server.client.getChatById(chatId)
        let roomdb = getRoom(roomIdOf(chat))
        if (!roomdb.welcome) return
        let users = (await server.toPnAll((n.recipientIds || []).map(id => typeof id == 'string' ? id : id._serialized))).filter(u => !server.isBot(u))
        let template = { add: roomdb.sWelcome || server.welcome, remove: roomdb.sBye || server.bye, promote: server.spromote, demote: server.sdemote }[action]
        if (!users.length || !template) return
        let meta = chat.groupMetadata || {}
        let subject = chat.name || meta.subject || ''
        let count = (meta.participants || chat.participants || []).length
        for (let user of users) {
            let text = template
                .replace(/@user/g, `@${user.split('@')[0]}`)
                .replace(/@subject/g, subject)
                .replace(/@desc/g, meta.desc || chat.description || '')
                .replace(/@count/g, count)
            if (action == 'add' || action == 'remove') {
                try {
                    let card = await require('./api/card').welcomeCard({ id: user, name: `+${user.split('@')[0]}`, group: subject, type: action == 'add' ? 'welcome' : 'bye', count })
                    let media = new server.MessageMedia('image/png', card.toString('base64'), 'welcome.png')
                    await server.client.sendMessage(chatId, media, { caption: text, mentions: [user] })
                    continue
                } catch (e) { console.error('Gagal membuat kartu welcome', e.message) }
            }
            await server.client.sendMessage(chatId, text, { mentions: [user] })
        }
    },
    // Anti-delete: kirim ulang pesan yang dihapus untuk semua orang (opt-in per grup lewat !setting antidelete)
    async message_revoke(after, before) {
        if (!server.isReady || !before || before.fromMe) return
        let chat = await before.getChat()
        if (!chat.isGroup || !getRoom(roomIdOf(chat)).antidelete) return
        let sender = await server.toPn(before.author || before.from)
        let caption = `🗑️ *ANTI DELETE*\n@${sender.split('@')[0]} menghapus pesan:${before.body ? `\n\n${before.body}` : ''}`
        if (before.hasMedia) {
            try {
                let media = await before.downloadMedia()
                if (media) return await server.client.sendMessage(chat.id._serialized, media, { caption, mentions: [sender] })
            } catch (e) { console.error('Anti-delete: media gagal diunduh', e.message) }
        }
        if (!before.body) return
        await server.client.sendMessage(chat.id._serialized, caption, { mentions: [sender] })
    },
    qr(data) {
        generate.generate(data, { small: true })
    },
    authenticated() {
        console.log(chalk.greenBright('Authentication...'))
    },
    async ready() {
        console.log(chalk.greenBright('API Ready...'))
        server.isReady = true
        if (server.client.info && server.client.info.wid) bot.number = server.client.info.wid.user
        let IpAddress
        for (const ifaces of Object.values(os.networkInterfaces())) {
            for (const iface of ifaces || []) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    IpAddress = iface.address
                    break
                }
            }
            if (IpAddress) break
        }
        if (server.notifiedOwner) return
        server.notifiedOwner = true
        await server.client.sendMessage(ownerJid(), `Halo @${bot.owner[0]}\n${bot.name} Telah Diaktifkan\nIpAddress: ${IpAddress}\nJumlah user: ${Object.keys(db.users.data).length}`, { mentions: [ownerJid()] })
    },
    auth_failure(reason) {
        console.error('AUTHENTICATION FAILURE', reason)
    },
    async disconnected(reason) {
        server.isReady = false
        console.error(chalk.redBright('DISCONNECTED'), reason)
        try { await dbWrite() } catch (e) { console.error(e) }
        // Keluar dengan kode error agar index.js menjalankan ulang bot
        try { await server.client.destroy() } catch { }
        process.exit(1)
    },
    loading_screen(percent, message) {
        server.percent = percent
        console.log('loading ' + percent + ' ' + message)
    },
    changestate(state) {
        console.log(state)
    },
    async message_create(msg) {
        if (typeof msg.body !== 'string') return false
        let Timestamp = new Date(msg.timestamp * 1000).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' })
        if (msg.fromMe) {
            console.log(chalk.blueBright(Timestamp), '=>', chalk.yellowBright(msg.to), ':', chalk.greenBright(msg.body))
        } else {
            console.log(chalk.blueBright(Timestamp), '=>', (msg.author ? chalk.greenBright : chalk.yellowBright)(msg.from), ':', chalk.redBright(msg.body))
        }
        // Perintah debug: hanya untuk owner (atau akun bot sendiri)
        let cmd = msg.body.split(' ')[0]
        if (!['!dataC', '!gChat', '!gChat2', '!gChat3', '!grupc'].includes(cmd)) return
        if (!msg.fromMe && !server.isOwner(await server.toPn(msg.author || msg.from))) return
        let message
        if (cmd == '!dataC') message = JSON.stringify(msg)
        if (cmd == '!gChat') message = JSON.stringify(await msg.getChat())
        if (cmd == '!gChat2') message = JSON.stringify(await server.client.getChats())
        if (cmd == '!gChat3') message = JSON.stringify(await server.client.getNumberId(msg.author || msg.from))
        if (cmd == '!grupc') return fs.promises.writeFile('gchats.json', JSON.stringify(await msg.getChat()), 'utf-8').catch(console.error)
        await msg.reply(message.slice(0, 60000))
        fs.promises.writeFile('msgC.json', message, 'utf-8').catch(console.error)
    },
    async message_(msg) {
        let isOwner = server.isOwner(await server.toPn(msg.author || msg.from))
        if (msg.body === '!buttons') {
            await msg.reply(`fungsi button ilegal digunakan kecuali owner membayar pada pihak meta`)
        }
        if (isOwner) {
            if (msg.body === '!mention') {
                const chat = await msg.getChat()
                const contact = await msg.getContact()
                await chat.sendMessage(`Hello @${contact.id.user}`, { mentions: [contact.id._serialized] })
            }
            if (msg.body == '!gchat') {
                let Jchat = JSON.stringify(await msg.getChat())
                fs.promises.writeFile('chat.json', Jchat, 'utf-8').catch(console.error)
                await msg.reply(Jchat.slice(0, 60000))
            }
            if (msg.body.split(' ')[0] == '!datam') {
                let message = JSON.stringify(msg)
                await msg.reply(message.slice(0, 60000))
                fs.promises.writeFile('mmsg.json', message, 'utf-8').catch(console.error)
            }
            // !plugin, !memory, dst. dipindah ke plugins/owner-tools.js (!plugins, !stats)
        }
        await this.handler(msg)
    },
    consoleToWa(data) {
        return server.client.sendMessage(ownerJid(), data)
    }
}
let file = require.resolve(__filename)
fs.watchFile(file, async () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright("Update 'handler.js'"))
    delete require.cache[file]
    if (global.reloadHandler) console.log(await global.reloadHandler())
})

global.listkatakotor = /k(o?a)ngk(o?a)ng|yat(e?i)m|ancrit|bokep| anj(k|g)|sundala| ajn?(g|k)| a?njin(g|k)|bajingan|cabul|lonte|b(a?n)?gsa?t|ko?nto?l|me?me?(k|q)|pe?pe?(k|q)|meki|titi(t|d)|pe?ler|tetek|toket|ngewe|go?blo?k|to?lo?l|idiot|(k|ng)e?nto?(t|d)|jembut|bego|dajj?al|janc(u|o)k|pantek|puki ?(mak)?|kimak|kampang|lonte|col(i|mek?)|pelacur|henceu?t|nigga|fuck|dick|bitch|tits|bastard|gay|lesbi|asshole| asu|babi| tai$/i
global.keluarroom = /quit|keluar|close|minggat|exit|pergi/i
function ucapan() {
    const time = Number(moment.tz('Asia/Jakarta').format('HH'))
    let res = "Selamat dinihari"
    if (time >= 4) res = "Selamat pagi"
    if (time > 10) res = "Selamat siang"
    if (time >= 15) res = "Selamat sore"
    if (time >= 18) res = "Selamat malam"
    return res
}
global.ucapan = ucapan
global.reloadRoom = function reloadRoom(id) {
    if (server.room[id] && typeof server.room[id].timeout !== 'undefined') clearTimeout(server.room[id].timeout)
    server.room[id] = {
        name: 'home',
        timeout: undefined,
        child: undefined,
        process: (server.room[id] && server.room[id].process) || []
    }
}
global.clockEmot = function (inputTime) {
    const [hour, minute] = inputTime.split('-')
    const hourInt = parseInt(hour, 10) % 12
    const minuteInt = parseInt(minute, 10)
    const emotMap = ['🕛', '🕧', '🕐', '🕜', '🕑', '🕝', '🕒', '🕞', '🕓', '🕟', '🕔', '🕠', '🕕', '🕡', '🕖', '🕢', '🕗', '🕣', '🕘', '🕤', '🕙', '🕥', '🕚', '🕦']
    return emotMap[hourInt * 2 + (minuteInt >= 30 ? 1 : 0)] || '🕛'
}
global.toRealUrl = async function (url) {
    let response = await fetch(url)
    return response.url
}
global.parseObject = function (arr) {
    if (typeof arr == 'object') {
        for (let obj in arr) {
            arr[obj] = parseObject(arr[obj])
        }
    }
    if (Array.isArray(arr) && arr.length === 1) {
        return arr[0]
    }
    return arr
}
global.explainObject = function (obj, parentKey = "") {
    let result = ""
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const newKey = parentKey ? `${parentKey}.${key}` : key
            if (obj[key] && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
                result += explainObject(obj[key], newKey)
            } else {
                result += `${newKey} = ${obj[key]}\n`
            }
        }
    }
    return result
}
global.pickRandom = function (arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}
global.getDate = function () {
    let d = new Date(new Date + 3600000)
    let locale = 'id'
    let weton = ['Pahing', 'Pon', 'Wage', 'Kliwon', 'Legi'][Math.floor(d / 84600000) % 5]
    let week = d.toLocaleDateString(locale, { weekday: 'long' })
    let date = d.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
    let time = d.toLocaleTimeString(locale, {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    })
    return { weton, week, date, time }
}
