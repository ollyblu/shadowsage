const quiz = require('../api/quiz')('tebakkimia')
const handler = {}
handler.main = quiz.start
handler.help = 'tebakkimia'
handler.tags = ['game']
handler.command = /^(tebakkimia)$/i
module.exports = handler
