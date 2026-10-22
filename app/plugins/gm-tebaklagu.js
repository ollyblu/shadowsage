const quiz = require('../api/quiz')('tebaklagu')
const handler = {}
handler.main = quiz.start
handler.help = 'tebaklagu'
handler.tags = ['game']
handler.command = /^(tebaklagu)$/i
module.exports = handler
