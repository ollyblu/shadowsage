const quiz = require('../api/quiz')('tebakgame')
const handler = {}
handler.main = quiz.start
handler.help = 'tebakgame'
handler.tags = ['game']
handler.command = /^(tebakgame)$/i
module.exports = handler
