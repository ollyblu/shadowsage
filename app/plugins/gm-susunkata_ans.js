const quiz = require('../api/quiz')('susunkata')
const handler = {}
handler.all = quiz.answer
handler.child = 'susunkata'
module.exports = handler
