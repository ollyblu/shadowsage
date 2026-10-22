const quiz = require('../api/quiz')('siapakahaku')
const handler = {}
handler.main = quiz.start
handler.help = 'siapakahaku'
handler.tags = ['game']
handler.command = /^(siapakahaku)$/i
module.exports = handler
