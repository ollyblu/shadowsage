const quiz = require('../api/quiz')('asahotak')
const handler = {}
handler.all = quiz.answer
handler.child = 'asahotak'
module.exports = handler
