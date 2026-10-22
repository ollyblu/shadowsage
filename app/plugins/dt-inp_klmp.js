const handler = {}
'.klmp|2'
handler.main = async function (dt, pesan) {
    if (dt.args.length < 2) return pesan.reply(`Kelompok Kamu: ${dt.usr.klmp}\nUntuk mengganti Kelompok ketik\n!klmp (Kelompok kamu)`)
    let sender = [dt.sender]
    if (pesan.mentionedIds && pesan.mentionedIds.length) sender = await server.toPnAll(pesan.mentionedIds.map(id => typeof id == 'string' ? id : id._serialized))
    let klmp = Number(dt.args[1])
    if (!(klmp > 0)) return pesan.reply('Nulis klmp yang bener dong\n(1 s.d ...)')
    for (let sen of sender) getUser(sen).klmp = klmp
    await pesan.react('👍🏻')
}
handler.command = /^klmp$/i
handler.help = 'klmp'
handler.tags = ['data']
handler.disabled = true
module.exports = handler
