const quiz = require('../api/quiz')('tebakgambar')
const handler = {}
handler.all = quiz.answer
handler.child = 'tebakgambar'
module.exports = handler
