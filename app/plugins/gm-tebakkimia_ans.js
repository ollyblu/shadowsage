const quiz = require('../api/quiz')('tebakkimia')
const handler = {}
handler.all = quiz.answer
handler.child = 'tebakkimia'
module.exports = handler
