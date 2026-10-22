const chalk = require('chalk')
const { createConnection, resolveApi } = require('./api/connection')
const fs = require('fs')
const yargs = require('yargs/yargs')
const path = require('path')
// Pakai lowdb versi lokal (CommonJS). lowdb dari npm v6+ hanya ESM dan API-nya berbeda.
const { Low, JSONFile } = require('./api/lowdb')

// Semua plugin memakai path relatif './app/...', jadi pastikan cwd selalu root project
process.chdir(path.join(__dirname, '..'))
// Variabel rahasia (API key, dll) dari file .env di root project, bila ada
try { process.loadEnvFile('.env') } catch { }
for (let dir of ['temp', 'saved/autotim', 'saved/viewonce', 'saved/deleted'])
  fs.mkdirSync(path.join(__dirname, dir), { recursive: true })

process.on('unhandledRejection', (reason) => {
  console.error(chalk.redBright('[unhandledRejection]'), reason)
})
process.on('uncaughtException', (err) => {
  console.error(chalk.redBright('[uncaughtException]'), err)
})

global.bot = require('./settings/data.json')
require('./settings/config')
require('./extension/index')
global.API = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({ ...query, ...(apikeyqueryname ? { [apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name] } : {}) })) : '')
global.timestamp = {
  start: new Date()
}
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.db = global.db || {}
const dbPrefix = opts._[0] ? opts._[0] + '_' : ''
global.db.users = new Low(new JSONFile(`${__dirname}/database/${dbPrefix}users.json`))
global.db.room = new Low(new JSONFile(`${__dirname}/database/${dbPrefix}rooms.json`))
global.db.settings = new Low(new JSONFile(`${__dirname}/database/${dbPrefix}settings.json`))
global.DATABASE = {}
global.DATABASE.users = global.db.users
global.DATABASE.room = global.db.room

function makeLoader(store) {
  let loading = null
  return function load() {
    if (store.data !== null) return Promise.resolve(store.data)
    if (!loading) loading = store.read()
      .then(() => {
        store.data = { ...(store.data || {}) }
        return store.data
      })
      .finally(() => { loading = null })
    return loading
  }
}
global.loadDatabase_users = makeLoader(global.db.users)
global.loadDatabase_room = makeLoader(global.db.room)
global.loadDatabase_settings = makeLoader(global.db.settings)
global.dbLoad = async function dbLoad() {
  await Promise.all([loadDatabase_users(), loadDatabase_room(), loadDatabase_settings()])
}
global.dbWrite = async function dbWrite() {
  if (global.db.users.data) await global.db.users.write()
  if (global.db.room.data) await global.db.room.write()
  if (global.db.settings.data) await global.db.settings.write()
}
if (!opts['test']) {
  setInterval(() => dbWrite().catch(console.error), 30 * 1000)
}

global.server = {
  percent: 0,
  isReady: false
}
server.room = {}
// Pengaturan global bot (mode, statistik perintah, pengingat, dll), disimpan di database/settings.json
server.settings = function settings() {
  let s = global.db.settings.data
  if (!s) return { mode: 'public', stats: {}, reminders: [] }
  if (!['public', 'self', 'group'].includes(s.mode)) s.mode = 'public'
  if (typeof s.stats !== 'object' || s.stats === null) s.stats = {}
  if (!Array.isArray(s.reminders)) s.reminders = []
  if (typeof s.sholat !== 'object' || s.sholat === null) s.sholat = {}
  if (typeof s.lastReset !== 'string') s.lastReset = ''
  return s
}
// Pilih API WhatsApp: --api baileys  >  env WA_API  >  "api" di settings/data.json
server.api = resolveApi(opts.api, process.env.WA_API, bot.api)
{
  let baileysCfg = { ...(bot.baileys || {}) }
  if (baileysCfg.authFolder) baileysCfg.authFolder = path.resolve(path.join(__dirname, '..'), baileysCfg.authFolder)
  let conn = createConnection(server.api, { wwebjs: bot.wwebjs, baileys: baileysCfg })
  server.client = conn.client
  server.MessageMedia = conn.MessageMedia
}
console.log(chalk.cyanBright(`API WhatsApp: ${server.api == 'baileys' ? 'Baileys' : 'whatsapp-web.js'}`))

// WhatsApp sekarang memakai ID "@lid" (bukan nomor HP) untuk sebagian pengguna.
// Database bot memakai "nomor@c.us", jadi ID @lid diterjemahkan ke nomor HP-nya.
const lidCache = new Map()
server.toPn = async function toPn(id) {
  if (typeof id !== 'string' || !id.endsWith('@lid')) return id
  if (lidCache.has(id)) return lidCache.get(id)
  let pn
  try {
    let [res] = await server.client.getContactLidAndPhone([id])
    pn = res && res.pn
  } catch (e) {
    console.error(chalk.redBright('Gagal resolve LID'), id, e.message)
  }
  if (!pn) {
    try {
      let contact = await server.client.getContactById(id)
      // contact.number pada kontak @lid bisa berisi digit LID; hanya pakai bila memang berbeda dari LID-nya
      let number = contact && `${contact.number || ''}`.replace(/\D/g, '')
      if (number && number !== id.split('@')[0].split(':')[0]) pn = `${number}@c.us`
    } catch { }
  }
  if (pn) {
    lidCache.set(id, pn)
    return pn
  }
  return id
}
server.toPnAll = ids => Promise.all(ids.map(id => server.toPn(id)))
// Peserta grup dengan ID yang sudah dinormalisasi ke nomor@c.us, tanpa bot sendiri
server.getParticipants = async function getParticipants(chat, { includeBot = false } = {}) {
  let participants = (chat.groupMetadata && chat.groupMetadata.participants) || chat.participants || []
  let result = []
  for (let p of participants) {
    let id = await server.toPn(p.id._serialized)
    if (!includeBot && server.isBot(id)) continue
    result.push({ id, user: id.split('@')[0], isAdmin: !!(p.isAdmin || p.isSuperAdmin), isSuperAdmin: !!p.isSuperAdmin })
  }
  return result
}
server.isBot = function isBot(id) {
  return `${id}`.split('@')[0] === `${bot.number}`
}
server.isOwner = function isOwner(id) {
  return bot.owner.map(String).includes(`${id}`.split('@')[0])
}

const imports = (path) => {
  path = require.resolve(path)
  let modules, retry = 0
  do {
    if (path in require.cache) delete require.cache[path]
    modules = require(path)
    retry++
  } while ((!modules || (Array.isArray(modules) || modules instanceof String) ? !(modules || []).length : typeof modules == 'object' && !Buffer.isBuffer(modules) ? !(Object.keys(modules || {})).length : true) && retry <= 10)
  return modules
}
let isInit = true
let listeners = {}
global.reloadHandler = async function (restatConn) {
  if (restatConn) {
    try { await global.server.client.resetState() } catch { }
  }
  for (let [event, fn] of Object.entries(listeners)) server.client.off(event, fn)
  let handler = imports('./handler')

  server.welcome = 'Hai, @user!\nSelamat datang di grup @subject\n\n@desc'
  server.bye = 'Selamat tinggal @user!'
  server.spromote = '@user sekarang admin!'
  server.sdemote = '@user sekarang bukan admin!'
  server.sDesc = 'Deskripsi telah diubah ke \n@desc'
  server.sSubject = 'Judul grup telah diubah ke \n@subject'
  server.sIcon = 'Icon grup telah diubah!'
  server.sRevoke = 'Link group telah diubah ke \n@revoke'
  server.sAnnounceOn = 'Group telah di tutup!\nsekarang hanya admin yang dapat mengirim pesan.'
  server.sAnnounceOff = 'Group telah di buka!\nsekarang semua peserta dapat mengirim pesan.'
  server.sRestrictOn = 'Edit Info Grup di ubah ke hanya admin!'
  server.sRestrictOff = 'Edit Info Grup di ubah ke semua peserta!'

  const wrap = fn => (...args) => Promise.resolve().then(() => fn(...args)).catch(e => console.error(chalk.redBright('[handler]'), e))
  listeners = {
    qr: wrap(qr => handler.qr(qr)),
    auth_failure: wrap(reason => handler.auth_failure(reason)),
    authenticated: wrap(() => handler.authenticated()),
    ready: wrap(() => handler.ready()),
    disconnected: wrap(reason => handler.disconnected(reason)),
    change_state: wrap(state => handler.changestate(state)),
    loading_screen: wrap((percent, message) => handler.loading_screen(percent, message)),
    message_create: wrap(message => handler.message_create(message)),
    message: wrap(message => handler.message_(message)),
    group_join: wrap(notification => handler.group_update(notification, 'add')),
    group_leave: wrap(notification => handler.group_update(notification, 'remove')),
    group_admin_changed: wrap(notification => handler.group_update(notification, notification.type)),
    message_revoke_everyone: wrap((after, before) => handler.message_revoke(after, before)),
  }
  for (let [event, fn] of Object.entries(listeners)) server.client.on(event, fn)
  if (isInit) server.client.initialize().catch(e => {
    console.error(chalk.redBright('Gagal menjalankan WhatsApp Web:'), e)
    process.exit(1)
  })
  isInit = false
  return true
}

let pluginFolder = path.join(__dirname, 'plugins')
let pluginFilter = filename => /\.js$/.test(filename)
global.plugins = {}
for (let filename of fs.readdirSync(pluginFolder).filter(pluginFilter).sort((a, b) => a.localeCompare(b))) {
  try {
    global.plugins[filename] = require(path.join(pluginFolder, filename))
  } catch (e) {
    console.error(chalk.redBright(`Gagal memuat plugin '${filename}'`), e)
    delete global.plugins[filename]
  }
}
console.log(Object.keys(global.plugins))
global.reload = (_ev, filename) => {
  if (!filename || !pluginFilter(filename)) return
  let dir = path.join(pluginFolder, filename)
  if (dir in require.cache) {
    delete require.cache[dir]
    if (fs.existsSync(dir)) console.info(`re require plugin '${filename}'`)
    else {
      console.warn(`deleted plugin '${filename}'`)
      return delete global.plugins[filename]
    }
  } else if (fs.existsSync(dir)) console.info(`requiring new plugin '${filename}'`)
  else return
  try {
    global.plugins[filename] = require(dir)
  } catch (e) {
    console.error(`error while loading '${filename}'\n`, e)
  } finally {
    global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b)))
  }
}
Object.freeze(global.reload)
fs.watch(pluginFolder, global.reload)

let shuttingDown = false
async function shutdown() {
  if (shuttingDown) return
  shuttingDown = true
  console.log(chalk.yellowBright('Menyimpan database...'))
  try { await dbWrite() } catch (e) { console.error(e) }
  try { await server.client.destroy() } catch { }
  process.exit(0)
}
process.on('message', msg => { if (msg === 'shutdown') shutdown() })
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

dbLoad().then(() => {
  require('./api/cron').start()
  return global.reloadHandler()
}).catch(e => {
  console.error(chalk.redBright('Gagal memuat database:'), e)
  process.exit(1)
})
