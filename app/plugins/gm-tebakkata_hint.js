const quiz = require('../api/quiz')('tebakkata')
const handler = {}
handler.main = quiz.hint
handler.command = /^clue$/i
handler.child = 'tebakkata'
handler.limit = true
module.exports = handler
