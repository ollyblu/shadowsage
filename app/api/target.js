/**
 * Mengambil pengguna target dari sebuah perintah: mention, pesan yang di-reply, atau nomor di teks.
 * Semua ID dikembalikan dalam format "nomor@c.us".
 */
function normalizeNumber(text) {
    let n = `${text}`.replace(/\D/g, '')
    if (n.startsWith('0')) n = '62' + n.slice(1)
    return n
}

async function getTargets(dt, pesan, { numbers = true, quoted = true } = {}) {
    let ids = (pesan.mentionedIds || []).map(id => typeof id == 'string' ? id : id._serialized)
    if (!ids.length && quoted && pesan.hasQuotedMsg) {
        let q = await pesan.getQuotedMessage()
        if (q) ids.push(q.author || q.from)
    }
    if (!ids.length && numbers) {
        // Nomor boleh berspasi/strip ("+62 812-3456-7890") tapi tidak boleh menyambung ke kata lain ("7d")
        for (let m of `${dt.text || ''}`.match(/(?<![\w@])\+?\d[\d\s-]{7,16}\d(?!\w)/g) || []) {
            let n = normalizeNumber(m)
            if (n.length >= 9 && n.length <= 15) ids.push(`${n}@c.us`)
        }
    }
    ids = await server.toPnAll(ids.filter(Boolean))
    return [...new Set(ids)]
}

async function getTarget(dt, pesan, options) {
    return (await getTargets(dt, pesan, options))[0]
}

const tag = id => `@${`${id}`.split('@')[0]}`

module.exports = { getTargets, getTarget, normalizeNumber, tag }
