const quiz = require('../api/quiz')('siapakahaku')
const handler = {}
handler.main = quiz.hint
handler.command = /^clue$/i
handler.child = 'siapakahaku'
handler.limit = true
module.exports = handler
