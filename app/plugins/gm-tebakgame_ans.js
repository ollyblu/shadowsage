const quiz = require('../api/quiz')('tebakgame')
const handler = {}
handler.all = quiz.answer
handler.child = 'tebakgame'
module.exports = handler
