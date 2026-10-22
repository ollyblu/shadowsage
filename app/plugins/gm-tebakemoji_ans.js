const quiz = require('../api/quiz')('tebakemoji')
const handler = {}
handler.all = quiz.answer
handler.child = 'tebakemoji'
module.exports = handler
