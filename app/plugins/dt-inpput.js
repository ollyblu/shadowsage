const handler = {}
'.gender|laki'
handler.main = async function (dt, pesan) {
    if (dt.args.length < 2) return pesan.reply(`Gender Kamu: ${dt.usr.gender}\nUntuk mengganti gender ketik\n!gender (gender kamu)`)
    let sender = [dt.sender]
    if (pesan.mentionedIds && pesan.mentionedIds.length) sender = await server.toPnAll(pesan.mentionedIds.map(id => typeof id == 'string' ? id : id._serialized))
    let gender = dt.args[1]
    if (/^(perempuan|p|wedok|cewek?|wanita)$/i.test(gender)) gender = 'P'
    else if (/^(laki(-?laki)?|pria|l|cowok?|lanang)$/i.test(gender)) gender = 'L'
    else return pesan.reply('Nulis gender yang bener dong\n(P / L)')
    for (let sen of sender) getUser(sen).gender = gender
    await pesan.react(gender == 'L' ? '🧑🏼' : '👩🏼')
}
handler.command = /^(gender|gnd)$/i
handler.help = 'gender'
handler.tags = ['data']
module.exports = handler
