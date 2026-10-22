const quiz = require('../api/quiz')('tebakkata')
const handler = {}
handler.main = quiz.start
handler.help = 'tebakkata'
handler.tags = ['game']
handler.command = /^(tebakkata)$/i
module.exports = handler
