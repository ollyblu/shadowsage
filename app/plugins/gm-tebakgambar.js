const quiz = require('../api/quiz')('tebakgambar')
const handler = {}
handler.main = quiz.start
handler.help = 'tebakgambar'
handler.tags = ['game']
handler.command = /^(tebakgambar)$/i
module.exports = handler
