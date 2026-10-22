const quiz = require('../api/quiz')('tebakbendera')
const handler = {}
handler.all = quiz.answer
handler.child = 'tebakbendera'
module.exports = handler
