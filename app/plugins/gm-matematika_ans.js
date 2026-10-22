const quiz = require('../api/quiz')('matematika')
const handler = {}
handler.all = quiz.answer
handler.child = 'matematika'
module.exports = handler
