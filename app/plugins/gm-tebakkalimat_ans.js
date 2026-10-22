const quiz = require('../api/quiz')('tebakkalimat')
const handler = {}
handler.all = quiz.answer
handler.child = 'tebakkalimat'
module.exports = handler
