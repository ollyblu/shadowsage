const quiz = require('../api/quiz')('tekateki')
const handler = {}
handler.all = quiz.answer
handler.child = 'tekateki'
module.exports = handler
