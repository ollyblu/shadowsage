const quiz = require('../api/quiz')('tebaklagu')
const handler = {}
handler.all = quiz.answer
handler.child = 'tebaklagu'
module.exports = handler
