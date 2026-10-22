const quiz = require('../api/quiz')('tebakkalimat')
const handler = {}
handler.main = quiz.start
handler.help = 'tebakkalimat'
handler.tags = ['game']
handler.command = /^(tebakkalimat)$/i
module.exports = handler
