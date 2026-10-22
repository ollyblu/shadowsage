const quiz = require('../api/quiz')('caklontong')
const handler = {}
handler.all = quiz.answer
handler.child = 'caklontong'
module.exports = handler
