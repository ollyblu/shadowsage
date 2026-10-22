/**
 * Sistem peringatan grup. Peringatan disimpan di db.room[room_id].warn[user].
 * Saat mencapai MAX_WARN, pengguna dikeluarkan (bila bot admin) dan hitungan direset.
 */
const MAX_WARN = 3

async function addWarn(dt, pesan, user, reason) {
    let warn = dt.roomdb.warn
    warn[user] = (warn[user] || 0) + 1
    let count = warn[user]
    let tag = `@${user.split('@')[0]}`
    if (count < MAX_WARN) {
        await server.client.sendMessage(pesan.from, `⚠️ *PERINGATAN ${count}/${MAX_WARN}*\n${tag} ${reason}\n\n_Di peringatan ke-${MAX_WARN} kamu akan dikeluarkan_`, { mentions: [user] })
        return count
    }
    delete warn[user]
    await dt.getAdmin()
    if (dt.isBotAdmin) {
        await server.client.sendMessage(pesan.from, `🚫 ${tag} sudah ${MAX_WARN}x diperingatkan dan dikeluarkan dari grup\nAlasan terakhir: ${reason}`, { mentions: [user] })
        await dt.chat.removeParticipants([user])
    } else {
        await server.client.sendMessage(pesan.from, `🚫 ${tag} sudah ${MAX_WARN}x diperingatkan.\nBot bukan admin, jadi tidak bisa mengeluarkan. Admin, silakan ditindak.`, { mentions: [user] })
    }
    return count
}

module.exports = { addWarn, MAX_WARN }
