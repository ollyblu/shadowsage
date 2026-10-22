const quiz = require('../api/quiz')('susunkata')
const handler = {}
handler.main = quiz.start
handler.help = 'susunkata'
handler.tags = ['game']
handler.command = /^(susunkata?)$/i
module.exports = handler
