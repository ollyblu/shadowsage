const quiz = require('../api/quiz')('tebaklirik')
const handler = {}
handler.main = quiz.start
handler.help = 'tebaklirik'
handler.tags = ['game']
handler.command = /^(tebaklirik)$/i
module.exports = handler
