const quiz = require('../api/quiz')('asahotak')
const handler = {}
handler.main = quiz.hint
handler.command = /^clue$/i
handler.child = 'asahotak'
handler.limit = true
module.exports = handler
