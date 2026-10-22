const quiz = require('../api/quiz')('tekateki')
const handler = {}
handler.main = quiz.start
handler.help = 'tekateki'
handler.tags = ['game']
handler.command = /^(tekateki)$/i
module.exports = handler
