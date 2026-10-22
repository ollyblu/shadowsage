const quiz = require('../api/quiz')('tebakbendera')
const handler = {}
handler.main = quiz.start
handler.help = 'tebakbendera'
handler.tags = ['game']
handler.command = /^(tebakbendera)$/i
module.exports = handler
