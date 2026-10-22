const quiz = require('../api/quiz')('caklontong')
const handler = {}
handler.main = quiz.hint
handler.command = /^clue$/i
handler.child = 'caklontong'
module.exports = handler
