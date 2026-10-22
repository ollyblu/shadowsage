const quiz = require('../api/quiz')('tebakkata')
const handler = {}
handler.all = quiz.answer
handler.child = 'tebakkata'
module.exports = handler
