const quiz = require('../api/quiz')('siapakahaku')
const handler = {}
handler.all = quiz.answer
handler.child = 'siapakahaku'
module.exports = handler
