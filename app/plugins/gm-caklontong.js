const quiz = require('../api/quiz')('caklontong')
const handler = {}
handler.main = quiz.start
handler.help = 'caklontong'
handler.tags = ['game', 'top']
handler.command = /^(caklontong|cak|lontong)$/i
module.exports = handler
