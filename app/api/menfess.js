/**
 * Logika & penyimpanan menfess (pesan anonim dua arah).
 * Data disimpan di app/database/menfess.json
 *
 * Istilah: setiap obrolan menfess disebut "thread" dengan ID pendek (mis. "K7Q2M").
 *  - a = pengirim pertama (anonim)
 *  - b = penerima
 */
const fs = require('fs')
const path = require('path')

const FILE = process.env.MENFESS_DB || path.join(__dirname, '..', 'database', 'menfess.json')
const CONFIG = {
    threadTTL: 3 * 24 * 60 * 60 * 1000,   // thread kedaluwarsa setelah 3 hari tanpa aktivitas
    newCooldown: 60 * 1000,               // jeda antar menfess baru per pengirim
    dailyLimit: 10,                       // maksimal menfess baru per pengirim per hari
    replyCooldown: 2000,                  // jeda antar balasan
    maxLength: 2000,                      // panjang maksimal pesan
    maxMediaBytes: 16 * 1024 * 1024,      // ukuran maksimal media
    historySize: 5,                       // pesan terakhir yang disimpan untuk laporan
    maxAlias: 25,
}
const ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

let data = load()
let dirty = false
let saveTimer = null
const rate = new Map() // pengirim -> { last, day, count, lastReply }

function load() {
    let d = {}
    try { d = JSON.parse(fs.readFileSync(FILE, 'utf-8')) } catch { }
    return {
        threads: d.threads || {},
        msgMap: d.msgMap || {},
        blocked: d.blocked || {},
        optout: d.optout || [],
        banned: d.banned || [],
        stats: d.stats || { sent: 0, replies: 0 },
    }
}
function save() {
    dirty = true
    if (saveTimer) return
    saveTimer = setTimeout(flush, 2000)
}
function flush() {
    clearTimeout(saveTimer)
    saveTimer = null
    if (!dirty) return
    dirty = false
    try {
        fs.mkdirSync(path.dirname(FILE), { recursive: true })
        fs.writeFileSync(FILE + '.tmp', JSON.stringify(data, null, 2))
        fs.renameSync(FILE + '.tmp', FILE)
    } catch (e) { console.error('[menfess] gagal menyimpan', e) }
}
process.on('exit', flush)

function cleanup() {
    let now = Date.now()
    let changed = false
    for (let [id, t] of Object.entries(data.threads))
        if (now - t.last > CONFIG.threadTTL) { delete data.threads[id]; changed = true }
    for (let [msgId, m] of Object.entries(data.msgMap))
        if (!data.threads[m.t]) { delete data.msgMap[msgId]; changed = true }
    if (changed) save()
}
setInterval(cleanup, 60 * 60 * 1000).unref()
cleanup()

// ===== util =====
const user = jid => `${jid}`.split('@')[0]
const toJid = num => `${num}`.includes('@') ? num : `${num}@c.us`
function mask(jid) {
    let n = user(jid)
    return n.length > 7 ? n.slice(0, 4) + '****' + n.slice(-3) : n
}
function normalizeNumber(text) {
    let n = `${text}`.replace(/[^\d+]/g, '').replace(/^\+/, '')
    if (n.startsWith('0')) n = '62' + n.slice(1)
    if (n.startsWith('8') && n.length >= 9 && n.length <= 13) n = '62' + n
    return /^\d{9,15}$/.test(n) ? n : null
}
function newId() {
    let id
    do {
        id = Array.from({ length: 5 }, () => ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]).join('')
    } while (data.threads[id])
    return id
}
function censor(text) {
    let re = new RegExp(global.listkatakotor.source, 'gi')
    let censored = false
    let out = `${text}`.replace(re, m => { censored = true; return '*'.repeat(Math.max(3, m.trim().length)) })
    return { text: out, censored }
}
function getThread(id) {
    let t = data.threads[`${id || ''}`.toUpperCase().replace(/^#/, '')]
    return t && Date.now() - t.last <= CONFIG.threadTTL ? t : null
}
// Satu orang bisa muncul dengan beberapa ID (nomor@c.us, xxx@lid, ID chat).
// Semua ID yang pernah terbukti milik suatu pihak disimpan di t.ids[side].
const idsOf = who => (Array.isArray(who) ? who : [who]).filter(j => typeof j == 'string' && j)
function ensureIds(t) {
    if (!t.ids) t.ids = { a: [t.a], b: [t.b] }
    return t.ids
}
function learn(t, side, ...jids) {
    let ids = ensureIds(t)
    for (let j of idsOf(jids.flat())) if (!ids[side].includes(j)) ids[side].push(j)
    // simpan ID utama + 5 ID terbaru saja
    if (ids[side].length > 6) ids[side].splice(1, ids[side].length - 6)
}
function sideOf(t, who) {
    let ids = ensureIds(t)
    for (let j of idsOf(who)) {
        if (t.a == j || ids.a.includes(j)) return 'a'
        if (t.b == j || ids.b.includes(j)) return 'b'
    }
    return null
}
const other = side => side == 'a' ? 'b' : 'a'
// ID chat tujuan dari pesan yang dikirim bot (whatsapp-web.js & adapter Baileys)
function chatOf(msg) {
    if (!msg) return undefined
    let id = msg.id || {}
    let remote = typeof id.remote == 'string' ? id.remote : id.remote && id.remote._serialized
    return remote || (typeof msg.to == 'string' ? msg.to : msg.to && msg.to._serialized)
}

function pushHistory(t, from, text) {
    t.history = t.history || []
    t.history.push({ from, text: `${text || ''}`.slice(0, 300), time: Date.now() })
    if (t.history.length > CONFIG.historySize) t.history.shift()
}
function remember(sentMsg, t, receiverSide) {
    let id = sentMsg && sentMsg.id && sentMsg.id.id
    let chat = chatOf(sentMsg)
    if (chat) learn(t, receiverSide, chat)
    if (id) data.msgMap[id] = { t: t.id, side: receiverSide, chat, time: Date.now() }
    else console.warn(`[menfess] ID pesan terkirim untuk #${t.id} tidak terbaca, reply ke pesan ini tidak akan bisa diteruskan`)
}

// Ambil media dari pesan (atau dari pesan yang di-reply bila diizinkan)
async function getMedia(pesan) {
    if (!pesan.hasMedia) return null
    let media = await pesan.downloadMedia()
    if (!media) return null
    let size = Buffer.byteLength(media.data || '', 'base64')
    if (size > CONFIG.maxMediaBytes) throw `Ukuran media terlalu besar (maks ${CONFIG.maxMediaBytes / 1024 / 1024} MB)`
    return media
}

async function deliver(to, text, media) {
    if (media) {
        let isSticker = media.mimetype == 'image/webp'
        let opts = isSticker ? { sendMediaAsSticker: true, stickerName: 'Menfess', stickerAuthor: bot.name } : { caption: text }
        if (/^audio\//.test(media.mimetype)) opts = { sendAudioAsVoice: true }
        let sent = await server.client.sendMessage(to, media, opts)
        // stiker & audio tidak punya caption, kirim teksnya terpisah
        if (isSticker || /^audio\//.test(media.mimetype)) sent = await server.client.sendMessage(to, text)
        return sent
    }
    return server.client.sendMessage(to, text)
}

function checkRate(sender, kind) {
    let now = Date.now()
    let r = rate.get(sender) || { last: 0, day: new Date().toDateString(), count: 0, lastReply: 0 }
    if (r.day !== new Date().toDateString()) { r.day = new Date().toDateString(); r.count = 0 }
    rate.set(sender, r)
    if (kind == 'new') {
        if (server.isOwner(sender)) return null
        if (now - r.last < CONFIG.newCooldown) return `Tunggu ${Math.ceil((CONFIG.newCooldown - (now - r.last)) / 1000)} detik lagi sebelum mengirim menfess baru`
        if (r.count >= CONFIG.dailyLimit) return `Batas ${CONFIG.dailyLimit} menfess baru per hari sudah tercapai, coba lagi besok`
        r.last = now
        r.count++
    } else {
        if (now - r.lastReply < CONFIG.replyCooldown) return 'Pelan-pelan kak, tunggu sebentar sebelum membalas lagi'
        r.lastReply = now
    }
    return null
}

// ===== aksi utama =====

/** Mulai menfess baru dari `sender` ke `target` (nomor/jid) */
async function startThread({ sender, senderIds, target, text, alias, media }) {
    if (data.banned.includes(sender)) throw 'Kamu tidak diizinkan memakai fitur menfess'
    let targetNum = normalizeNumber(user(target))
    if (!targetNum) throw 'Nomor tujuan tidak valid'
    if (server.isBot(targetNum)) throw 'Kamukan udah bicara sama aku secara private 😏😋'
    if (targetNum == user(sender)) throw 'Tidak bisa mengirim menfess ke diri sendiri'
    if (!text && !media) throw 'Pesannya mana kak?'
    if (text.length > CONFIG.maxLength) throw `Pesan terlalu panjang (maks ${CONFIG.maxLength} karakter)`
    let wid = await server.client.getNumberId(targetNum).catch(() => null)
    if (!wid) throw `Nomor ${targetNum} tidak terdaftar di WhatsApp`
    let to = toJid(targetNum)
    // Penerima menolak menfess / memblokir pengirim: pesan sengaja dibuat sama agar tidak membocorkan apa pun
    if (data.optout.includes(to) || (data.blocked[to] || []).includes(sender)) throw 'Menfess tidak bisa dikirim ke nomor tersebut'
    let limit = checkRate(sender, 'new')
    if (limit) throw limit

    let { text: clean, censored } = censor(text)
    alias = alias ? censor(alias.slice(0, CONFIG.maxAlias)).text : ''
    let id = newId()
    let t = data.threads[id] = {
        id, a: sender, b: to, alias,
        created: Date.now(), last: Date.now(), count: 1, status: 'active', history: [],
    }
    learn(t, 'a', senderIds || [])
    learn(t, 'b', wid._serialized)
    pushHistory(t, 'a', clean)

    let caption = `💌 *MENFESS* · #${t.id}
Dari: *${alias || 'Seseorang'}*

${clean}

━━━━━━━━━━━━━━
↩️ *Reply* pesan ini untuk membalas secara anonim
🔕 *!menfess blokir ${t.id}* — blokir pengirim ini
🚩 *!menfess lapor ${t.id}* — laporkan penyalahgunaan
🚫 *!menfess off* — tolak semua menfess`
    let sent
    try {
        sent = await deliver(wid._serialized || to, caption, media)
    } catch (e) {
        delete data.threads[t.id]
        save()
        throw e
    }
    remember(sent, t, 'b')
    data.stats.sent++
    save()
    return { thread: t, censored }
}

/** Balas thread `t` dari `sender` */
async function reply({ sender, thread, side, text, media }) {
    let t = typeof thread == 'string' ? getThread(thread) : thread
    if (!t) throw 'Menfess tidak ditemukan atau sudah kedaluwarsa'
    side = side || sideOf(t, sender)
    if (!side) throw 'Menfess tidak ditemukan atau sudah kedaluwarsa'
    if (t.status !== 'active') throw `Menfess #${t.id} sudah ditutup`
    sender = idsOf(sender)[0]
    if (data.banned.includes(sender) || data.banned.includes(t[side])) throw 'Kamu tidak diizinkan memakai fitur menfess'
    if (!text && !media) throw 'Pesannya mana kak?'
    if (text.length > CONFIG.maxLength) throw `Pesan terlalu panjang (maks ${CONFIG.maxLength} karakter)`
    let limit = checkRate(sender, 'reply')
    if (limit) throw limit
    let { text: clean, censored } = censor(text)
    let target = side == 'a' ? t.b : t.a
    let label = side == 'a' ? (t.alias || 'Seseorang') : mask(t.b)
    let caption = `💬 *Balasan Menfess* · #${t.id}
Dari: *${label}*

${clean}

↩️ _Reply pesan ini untuk membalas_`
    let sent = await deliver(target, caption, media)
    remember(sent, t, other(side))
    console.log(`[menfess] #${t.id} balasan ${side == 'a' ? 'pengirim -> penerima' : 'penerima -> pengirim'} diteruskan ke ${target}`)
    t.last = Date.now()
    t.count++
    pushHistory(t, side, clean)
    data.stats.replies++
    save()
    return { thread: t, censored }
}

/** Cari thread dari pesan bot yang di-reply */
/**
 * Cari thread dari pesan bot yang di-reply.
 * ID pesan menfess hanya ada di chat penerimanya, jadi reply ke pesan itu sudah cukup
 * membuktikan siapa yang membalas (tidak perlu mencocokkan nomor yang bisa berupa @lid).
 * @returns {{thread, side} | null}
 */
function threadFromQuoted(quotedId, who) {
    let m = data.msgMap[quotedId]
    if (!m) return null
    let t = getThread(m.t)
    if (!t) return null
    learn(t, m.side, idsOf(who))
    save()
    return { thread: t, side: m.side }
}
function isMenfessMessage(quotedId) {
    return !!data.msgMap[quotedId]
}

function listThreads(who) {
    return Object.values(data.threads)
        .filter(t => sideOf(t, who) && Date.now() - t.last <= CONFIG.threadTTL)
        .sort((x, y) => y.last - x.last)
}

async function close(sender, id) {
    let t = getThread(id)
    if (!t || !sideOf(t, sender)) throw 'Menfess tidak ditemukan atau sudah kedaluwarsa'
    if (t.status !== 'active') throw `Menfess #${t.id} sudah ditutup`
    t.status = 'closed'
    t.last = Date.now()
    save()
    let target = sideOf(t, sender) == 'a' ? t.b : t.a
    await server.client.sendMessage(target, `🔒 Menfess #${t.id} telah ditutup oleh lawan bicara.`).catch(() => { })
    return t
}

function block(sender, id) {
    let t = getThread(id)
    let side = t && sideOf(t, sender)
    if (!side) throw 'Menfess tidak ditemukan atau sudah kedaluwarsa'
    let me = t[side]
    let target = t[other(side)]
    data.blocked[me] = [...new Set([...(data.blocked[me] || []), target])]
    t.status = 'closed'
    save()
    return t
}
function unblockAll(sender) {
    let n = (data.blocked[sender] || []).length
    delete data.blocked[sender]
    save()
    return n
}
function setOptout(sender, off) {
    data.optout = data.optout.filter(j => j !== sender)
    if (off) data.optout.push(sender)
    save()
}
function isOptout(sender) { return data.optout.includes(sender) }

async function report(sender, id, reason) {
    let t = getThread(id)
    let side = t && sideOf(t, sender)
    if (!side) throw 'Menfess tidak ditemukan atau sudah kedaluwarsa'
    let history = (t.history || []).map(h => `[${h.from == 'a' ? 'Pengirim' : 'Penerima'}] ${h.text}`).join('\n')
    let owner = `${bot.owner[0]}@c.us`
    await server.client.sendMessage(owner, `🚩 *LAPORAN MENFESS* · #${t.id}
Pelapor: @${user(t[side])} (${side == 'a' ? 'pengirim' : 'penerima'})
Pengirim: @${user(t.a)}
Penerima: @${user(t.b)}
Alasan: ${reason || '-'}

Riwayat terakhir:
${history || '-'}

Ban pengirim: *!menfess ban ${user(t.a)}*`, { mentions: [t[side], t.a, t.b] })
    return t
}

function ban(num, on) {
    let jid = toJid(normalizeNumber(num) || num)
    data.banned = data.banned.filter(j => j !== jid)
    if (on) {
        data.banned.push(jid)
        for (let t of Object.values(data.threads)) if (t.a == jid || t.b == jid) t.status = 'closed'
    }
    save()
    return jid
}
function stats() {
    let active = Object.values(data.threads).filter(t => t.status == 'active' && Date.now() - t.last <= CONFIG.threadTTL).length
    return { ...data.stats, active, threads: Object.keys(data.threads).length, banned: data.banned.length, optout: data.optout.length }
}

module.exports = {
    CONFIG, startThread, reply, threadFromQuoted, isMenfessMessage, sideOf, listThreads, close, block, unblockAll,
    setOptout, isOptout, report, ban, stats, getMedia, normalizeNumber, mask, getThread, flush,
}
