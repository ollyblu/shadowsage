const quiz = require('../api/quiz')('matematika')
const handler = {}
handler.main = quiz.start
handler.help = 'math <mudah|sedang|sulit|gila>'
handler.tags = ['game']
handler.command = /^(matematika|math|mtk)$/i
module.exports = handler
