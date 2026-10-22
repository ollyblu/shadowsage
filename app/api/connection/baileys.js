/**
 * Adapter Baileys -> meniru API whatsapp-web.js yang dipakai handler & plugin
 * (client.sendMessage, msg.reply, msg.react, msg.getChat, msg.downloadMedia, dst).
 * ID ditampilkan dengan format whatsapp-web.js ("nomor@c.us") supaya database tetap sama.
 */
const EventEmitter = require('events')
const fs = require('fs')
const path = require('path')
const MessageMedia = require('./media')
const { toSticker, toVoiceNote } = require('./convert')

const GROUP_CACHE_MS = 5 * 60 * 1000
const MSG_STORE_LIMIT = 1000

// "628xx:12@s.whatsapp.net" -> "628xx@c.us" ; lid & grup tetap
function toCus(jid) {
    if (typeof jid !== 'string' || !jid) return jid
    let [user, server] = jid.split('@')
    user = user.split(':')[0]
    if (server == 's.whatsapp.net') server = 'c.us'
    return server ? `${user}@${server}` : user
}
// "628xx@c.us" -> "628xx@s.whatsapp.net"
function toWa(id) {
    if (id && typeof id == 'object') id = id._serialized || (id.id && id.id._serialized)
    if (typeof id !== 'string' || !id) return id
    if (id.endsWith('@c.us')) return id.replace(/@c\.us$/, '@s.whatsapp.net')
    if (!id.includes('@')) return `${id}@s.whatsapp.net`
    return id
}
const wid = jid => {
    let _serialized = toCus(jid)
    let [user, server] = `${_serialized}`.split('@')
    return { _serialized, user, server }
}
const toNumber = t => t == null ? 0 : typeof t == 'object' && typeof t.toNumber == 'function' ? t.toNumber() : Number(t)
const MEDIA_TYPES = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage', 'ptvMessage']

class Message {
    constructor(client, raw) {
        const B = client.B
        this._client = client
        this.raw = raw
        const key = raw.key || {}
        client._rememberLid(key.remoteJid, key.remoteJidAlt)
        client._rememberLid(key.participant, key.participantAlt)
        const content = B.normalizeMessageContent(raw.message) || {}
        const type = B.getContentType(content)
        const inner = (type && content[type]) || {}
        const ctx = (inner && typeof inner == 'object' && inner.contextInfo) || {}
        this._content = content
        this._inner = inner
        this._ctx = ctx
        this.type = type
        this._chatId = key.remoteJid
        const me = client.info && client.info.wid && client.info.wid._serialized
        const chat = toCus(key.remoteJid)
        this.fromMe = !!key.fromMe
        this.from = this.fromMe ? me : chat
        this.to = this.fromMe ? chat : me
        this.author = key.remoteJid && key.remoteJid.endsWith('@g.us') ? toCus(key.participant) || (this.fromMe ? me : undefined) : undefined
        this.id = { id: key.id, fromMe: this.fromMe, remote: chat, _serialized: `${this.fromMe}_${chat}_${key.id}` }
        this.body = content.conversation
            || (content.extendedTextMessage && content.extendedTextMessage.text)
            || (inner && inner.caption)
            || (content.buttonsResponseMessage && content.buttonsResponseMessage.selectedButtonId)
            || (content.listResponseMessage && content.listResponseMessage.singleSelectReply && content.listResponseMessage.singleSelectReply.selectedRowId)
            || (content.templateButtonReplyMessage && content.templateButtonReplyMessage.selectedId)
            || ''
        this.timestamp = toNumber(raw.messageTimestamp) || Math.floor(Date.now() / 1000)
        this.hasMedia = MEDIA_TYPES.includes(type)
        this.hasQuotedMsg = !!ctx.quotedMessage
        this.mentionedIds = (ctx.mentionedJid || []).map(toCus)
        this.isStatus = key.remoteJid == 'status@broadcast'
        this.isForwarded = !!ctx.isForwarded
        const m = raw.message || {}
        const isViewOnce = !!(m.viewOnceMessage || m.viewOnceMessageV2 || m.viewOnceMessageV2Extension || (inner && inner.viewOnce))
        this._data = { id: this.id, t: this.timestamp, isViewOnce, notifyName: raw.pushName, type }
        this.notifyName = raw.pushName
    }
    async reply(content, chatId, options = {}) {
        if (chatId && typeof chatId == 'object') options = chatId, chatId = undefined
        return this._client.sendMessage(chatId || this._chatId, content, { ...options, quoted: this.raw })
    }
    async react(emoji) {
        await this._client.sock.sendMessage(this._chatId, { react: { text: emoji || '', key: this.raw.key } })
    }
    async getChat() {
        return this._client.getChatById(this._chatId)
    }
    async getContact() {
        return this._client.getContactById(this.author || this.from)
    }
    async getMentions() {
        return Promise.all(this.mentionedIds.map(id => this._client.getContactById(id)))
    }
    async getQuotedMessage() {
        if (!this.hasQuotedMsg) return undefined
        const ctx = this._ctx
        const user = this._client.sock.user || {}
        // bot bisa dikenali lewat nomor HP maupun LID-nya
        const me = [user.id, user.lid].filter(Boolean)
        const participant = ctx.participant || ctx.remoteJid
        return new Message(this._client, {
            key: {
                remoteJid: this._chatId,
                id: ctx.stanzaId,
                fromMe: !!(participant && me.some(j => this._client.B.areJidsSameUser(participant, j))),
                participant: this._chatId.endsWith('@g.us') ? participant : undefined,
            },
            message: ctx.quotedMessage,
        })
    }
    async downloadMedia() {
        if (!this.hasMedia) return undefined
        const B = this._client.B
        const sock = this._client.sock
        const buffer = await B.downloadMediaMessage(this.raw, 'buffer', {}, {
            logger: this._client.logger,
            reuploadRequest: sock.updateMediaMessage,
        })
        let mimetype = (this._inner.mimetype || MessageMedia.sniffMime(buffer) || 'application/octet-stream').split(';')[0]
        let filename = this._inner.fileName || `file.${MessageMedia.mimeExt[mimetype] || 'bin'}`
        return new MessageMedia(mimetype, buffer.toString('base64'), filename, buffer.length)
    }
    toJSON() {
        const { _client, ...rest } = this
        return rest
    }
    async delete(everyone) {
        if (everyone) await this._client.sock.sendMessage(this._chatId, { delete: this.raw.key })
    }
}

class Chat {
    constructor(client, jid, metadata) {
        this._client = client
        this.id = wid(jid)
        this.isGroup = jid.endsWith('@g.us')
        this.name = metadata ? metadata.subject : undefined
        if (metadata) {
            const participants = (metadata.participants || []).map(p => {
                client._rememberLid(p.lid || (p.id && p.id.endsWith('@lid') ? p.id : undefined), p.phoneNumber || (p.id && p.id.endsWith('@s.whatsapp.net') ? p.id : undefined))
                return {
                    id: wid(p.id),
                    isAdmin: p.admin == 'admin' || p.admin == 'superadmin' || !!p.isAdmin,
                    isSuperAdmin: p.admin == 'superadmin' || !!p.isSuperAdmin,
                }
            })
            this.groupMetadata = {
                id: wid(metadata.id),
                creation: metadata.creation,
                owner: metadata.owner ? wid(metadata.owner) : undefined,
                subject: metadata.subject,
                desc: metadata.desc,
                announce: metadata.announce,
                restrict: metadata.restrict,
                participants,
            }
            this.participants = participants
        }
    }
    sendMessage(content, options) {
        return this._client.sendMessage(this.id._serialized, content, options)
    }
    // ===== Aksi grup, nama method mengikuti GroupChat whatsapp-web.js =====
    async _participants(ids, action) {
        const res = await this._client.sock.groupParticipantsUpdate(this.id._serialized, [].concat(ids).map(toWa), action)
        this._client.groupCache.delete(this.id._serialized)
        return res
    }
    addParticipants(ids) { return this._participants(ids, 'add') }
    removeParticipants(ids) { return this._participants(ids, 'remove') }
    promoteParticipants(ids) { return this._participants(ids, 'promote') }
    demoteParticipants(ids) { return this._participants(ids, 'demote') }
    async setMessagesAdminsOnly(adminsOnly = true) {
        await this._client.sock.groupSettingUpdate(this.id._serialized, adminsOnly ? 'announcement' : 'not_announcement')
        this._client.groupCache.delete(this.id._serialized)
        return true
    }
    getInviteCode() { return this._client.sock.groupInviteCode(this.id._serialized) }
    revokeInvite() { return this._client.sock.groupRevokeInvite(this.id._serialized) }
    async setSubject(subject) { await this._client.sock.groupUpdateSubject(this.id._serialized, subject); return true }
    async setDescription(desc) { await this._client.sock.groupUpdateDescription(this.id._serialized, desc); return true }
    toJSON() {
        const { _client, ...rest } = this
        return rest
    }
}

class BaileysClient extends EventEmitter {
    constructor(options = {}) {
        super()
        this.options = options
        this.authFolder = options.authFolder || path.join(process.cwd(), 'auth_baileys')
        this.pairingNumber = `${options.pairingNumber || ''}`.replace(/\D/g, '')
        this.info = null
        this.sock = null
        this.lidMap = new Map()
        this.groupCache = new Map()
        this.msgStore = new Map()
        this._destroyed = false
        this._pairingRequested = false
    }
    async initialize() {
        this.B = await import('baileys')
        const pino = require('pino')
        this.logger = pino({ level: process.env.BAILEYS_LOG || 'silent' })
        await this._connect()
    }
    async _connect() {
        const B = this.B
        const makeWASocket = B.makeWASocket || B.default
        const { state, saveCreds } = await B.useMultiFileAuthState(this.authFolder)
        let version
        try { ({ version } = await B.fetchLatestBaileysVersion()) } catch { }
        const sock = this.sock = makeWASocket({
            ...(version ? { version } : {}),
            auth: { creds: state.creds, keys: B.makeCacheableSignalKeyStore(state.keys, this.logger) },
            logger: this.logger,
            browser: B.Browsers.windows('Chrome'),
            markOnlineOnConnect: false,
            syncFullHistory: false,
            cachedGroupMetadata: async jid => {
                let cached = this.groupCache.get(jid)
                return cached && Date.now() - cached.time < GROUP_CACHE_MS ? cached.data : undefined
            },
            getMessage: async key => {
                let stored = this.msgStore.get(key.id)
                return stored ? stored.message : undefined
            },
        })
        sock.ev.on('creds.update', saveCreds)
        sock.ev.on('connection.update', update => this._onConnection(sock, update).catch(e => console.error('[baileys]', e)))
        sock.ev.on('messages.upsert', ({ messages, type }) => {
            for (const raw of messages) {
                if (!raw.message || raw.message.protocolMessage || raw.message.reactionMessage) continue
                this._store(raw)
                let msg
                try { msg = new Message(this, raw) } catch (e) { console.error('[baileys] gagal membaca pesan', e); continue }
                this.emit('message_create', msg)
                if (!raw.key.fromMe && type == 'notify') this.emit('message', msg)
            }
        })
        sock.ev.on('groups.update', updates => { for (let u of updates) this.groupCache.delete(u.id) })
        sock.ev.on('group-participants.update', u => {
            this.groupCache.delete(u.id)
            // Diteruskan dengan bentuk mirip GroupNotification whatsapp-web.js
            const recipientIds = (u.participants || []).map(p => {
                if (typeof p == 'string') return toCus(p)
                this._rememberLid(p.lid || p.id, p.phoneNumber)
                return toCus(p.phoneNumber || p.id)
            })
            const notification = { id: { remote: toCus(u.id) }, chatId: toCus(u.id), author: toCus(u.authorPn || u.author), recipientIds, type: u.action }
            const event = { add: 'group_join', remove: 'group_leave', promote: 'group_admin_changed', demote: 'group_admin_changed' }[u.action]
            if (event) this.emit(event, notification)
        })
        sock.ev.on('messages.update', updates => {
            for (const { key, update } of updates) {
                if (!update || update.message !== null || update.messageStubType != B.WAMessageStubType.REVOKE) continue
                const stored = this.msgStore.get(key.id)
                if (!stored || !stored.message) continue
                let before
                try { before = new Message(this, stored) } catch { continue }
                this.emit('message_revoke_everyone', undefined, before)
            }
        })
        sock.ev.on('lid-mapping.update', m => this._rememberLid(m.lid, m.pn))
        sock.ev.on('contacts.upsert', contacts => { for (let c of contacts) this._rememberLid(c.lid, c.phoneNumber) })
    }
    async _onConnection(sock, { connection, lastDisconnect, qr }) {
        const B = this.B
        if (qr) {
            if (this.pairingNumber && !sock.authState.creds.registered) {
                if (!this._pairingRequested) {
                    this._pairingRequested = true
                    let code = await sock.requestPairingCode(this.pairingNumber)
                    code = code && code.match(/.{1,4}/g) ? code.match(/.{1,4}/g).join('-') : code
                    console.log(`\nKode pairing untuk ${this.pairingNumber}: ${code}\nBuka WhatsApp > Perangkat tertaut > Tautkan dengan nomor telepon\n`)
                    this.emit('pairing_code', code)
                }
            } else this.emit('qr', qr)
        }
        if (connection == 'open') {
            const user = sock.user || {}
            this.info = { wid: wid(B.jidNormalizedUser(user.id)), pushname: user.name, platform: 'baileys', me: wid(B.jidNormalizedUser(user.id)) }
            if (user.lid) this._rememberLid(user.lid, user.id)
            this.emit('authenticated')
            this.emit('change_state', 'CONNECTED')
            this.emit('ready')
        }
        if (connection == 'close') {
            if (this.sock !== sock) return
            const code = lastDisconnect && lastDisconnect.error && lastDisconnect.error.output && lastDisconnect.error.output.statusCode
            this.emit('change_state', 'DISCONNECTED')
            if (this._destroyed) return
            if (code == B.DisconnectReason.loggedOut) {
                console.error('Sesi Baileys logout, folder sesi dihapus. Jalankan ulang untuk scan QR baru.')
                fs.rmSync(this.authFolder, { recursive: true, force: true })
                this.emit('disconnected', 'LOGOUT')
                return
            }
            if (code == B.DisconnectReason.connectionReplaced) {
                this.emit('disconnected', 'CONFLICT')
                return
            }
            const wait = code == B.DisconnectReason.restartRequired ? 0 : 3000
            console.log(`Koneksi Baileys terputus (${code || 'unknown'}), menyambung ulang...`)
            this._pairingRequested = false
            setTimeout(() => this._connect().catch(e => {
                console.error('[baileys] gagal menyambung ulang', e)
                this.emit('disconnected', 'RECONNECT_FAILED')
            }), wait)
        }
    }
    _store(raw) {
        if (!raw.key || !raw.key.id) return
        this.msgStore.set(raw.key.id, raw)
        if (this.msgStore.size > MSG_STORE_LIMIT) this.msgStore.delete(this.msgStore.keys().next().value)
    }
    _rememberLid(a, b) {
        if (!a || !b) return
        let lid = [a, b].find(j => `${j}`.endsWith('@lid'))
        let pn = [a, b].find(j => `${j}`.endsWith('@s.whatsapp.net') || `${j}`.endsWith('@c.us'))
        if (lid && pn) this.lidMap.set(toCus(lid), toCus(pn))
    }
    async _groupMetadata(jid) {
        let cached = this.groupCache.get(jid)
        if (cached && Date.now() - cached.time < GROUP_CACHE_MS) return cached.data
        let data = await this.sock.groupMetadata(jid)
        this.groupCache.set(jid, { data, time: Date.now() })
        return data
    }

    // ===== API mirip whatsapp-web.js =====
    async getChatById(chatId) {
        const jid = toWa(chatId)
        if (jid.endsWith('@g.us')) return new Chat(this, jid, await this._groupMetadata(jid))
        return new Chat(this, jid)
    }
    async getChats() {
        let groups = await this.sock.groupFetchAllParticipating()
        return Object.values(groups).map(g => new Chat(this, g.id, g))
    }
    async getContactLidAndPhone(userIds) {
        if (!Array.isArray(userIds)) userIds = [userIds]
        return Promise.all(userIds.map(async id => {
            id = toCus(id)
            if (!`${id}`.endsWith('@lid')) return { lid: undefined, pn: id }
            let pn = this.lidMap.get(id)
            if (!pn) {
                try {
                    let res = await this.sock.signalRepository.lidMapping.getPNForLID(id)
                    if (res) pn = toCus(res)
                } catch { }
                if (pn) this.lidMap.set(id, pn)
            }
            return { lid: id, pn }
        }))
    }
    async getContactById(contactId) {
        const id = toCus(contactId)
        const [{ pn }] = await this.getContactLidAndPhone([id])
        const me = this.info && this.info.wid && this.info.wid._serialized
        return {
            id: wid(id),
            number: pn ? pn.split('@')[0] : id.split('@')[0],
            isMe: id == me,
            isGroup: id.endsWith('@g.us'),
            isUser: !id.endsWith('@g.us'),
        }
    }
    async getProfilePicUrl(contactId) {
        try { return await this.sock.profilePictureUrl(toWa(contactId), 'image') } catch { return undefined }
    }
    async getNumberId(number) {
        const [res] = await this.sock.onWhatsApp(`${number}`.replace(/\D/g, ''))
        return res && res.exists ? wid(res.jid) : null
    }
    async isRegisteredUser(id) {
        return !!(await this.getNumberId(`${id}`.split('@')[0]))
    }
    async getState() {
        return this.info ? 'CONNECTED' : 'DISCONNECTED'
    }
    async resetState() { }
    async destroy() {
        this._destroyed = true
        try { this.sock && this.sock.end(undefined) } catch { }
    }
    async logout() {
        await this.sock.logout()
    }
    async sendMessage(chatId, content, options = {}) {
        const jid = toWa(chatId)
        const mentions = (options.mentions || []).map(toWa).filter(Boolean)
        let msg
        if (typeof content == 'string') {
            msg = { text: content }
            if (mentions.length) msg.mentions = mentions
        } else if (content && content.mimetype && content.data) {
            const buffer = Buffer.from(content.data, 'base64')
            const mimetype = content.mimetype
            const caption = options.caption
            if (options.sendMediaAsSticker) {
                msg = { sticker: await toSticker(buffer, mimetype, { name: options.stickerName, author: options.stickerAuthor, categories: options.stickerCategories }) }
            } else if (options.sendMediaAsDocument) {
                msg = { document: buffer, mimetype, fileName: content.filename || 'file', caption }
            } else if (mimetype.startsWith('image/') && mimetype != 'image/gif') {
                msg = { image: buffer, mimetype, caption }
            } else if (mimetype.startsWith('video/') || mimetype == 'image/gif') {
                msg = { video: buffer, mimetype: mimetype == 'image/gif' ? 'video/mp4' : mimetype, caption, gifPlayback: !!options.sendVideoAsGif }
            } else if (mimetype.startsWith('audio/')) {
                if (options.sendAudioAsVoice) {
                    try {
                        const voice = await toVoiceNote(buffer, mimetype)
                        msg = { audio: voice.buffer, mimetype: voice.mimetype, ptt: true }
                    } catch (e) {
                        console.error('[baileys] gagal konversi voice note, dikirim sebagai audio biasa:', e.message)
                        msg = { audio: buffer, mimetype, ptt: false }
                    }
                } else msg = { audio: buffer, mimetype, ptt: false }
            } else {
                msg = { document: buffer, mimetype, fileName: content.filename || 'file', caption }
            }
            if (mentions.length && !msg.sticker && !msg.audio) msg.mentions = mentions
        } else {
            throw new Error('Tipe pesan tidak didukung oleh adapter Baileys')
        }
        const sent = await this.sock.sendMessage(jid, msg, options.quoted ? { quoted: options.quoted } : {})
        if (sent) this._store(sent)
        return sent ? new Message(this, sent) : undefined
    }
}

module.exports = { BaileysClient, MessageMedia, toCus, toWa }
