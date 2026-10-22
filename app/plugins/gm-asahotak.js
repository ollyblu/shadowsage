const quiz = require('../api/quiz')('asahotak')
const handler = {}
handler.main = quiz.start
handler.help = 'asahotak'
handler.tags = ['game']
handler.command = /^(asahotak)$/i
module.exports = handler
