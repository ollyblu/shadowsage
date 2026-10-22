const quiz = require('../api/quiz')('tebaklirik')
const handler = {}
handler.all = quiz.answer
handler.child = 'tebaklirik'
module.exports = handler
