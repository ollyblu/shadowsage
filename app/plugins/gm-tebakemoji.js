const quiz = require('../api/quiz')('tebakemoji')
const handler = {}
handler.main = quiz.start
handler.help = 'tebakemoji'
handler.tags = ['game']
handler.command = /^(tebakemoji|temoji)$/i
module.exports = handler
