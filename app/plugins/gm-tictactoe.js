const ttt = require('../api/tictactoe')
const { getTarget, tag } = require('../api/target')

const TIMEOUT = 120000
const handler = {}
handler.main = async function (dt, pesan) {
    server.room.big = server.room.big || {}
    let games = Object.values(server.room.big)
    if (games.find(g => g.id.startsWith('ttt') && g.players.includes(dt.sender))) return pesan.reply('Selesaikan dulu TicTacToe kamu yang sebelumnya\nKetik *nyerah* untuk menyerah')
    let lawan = /^(bot|ai)$/i.test(dt.text.trim()) ? null : await getTarget(dt, pesan, { numbers: false })
    if (lawan == dt.sender) return pesan.reply('Tidak bisa melawan diri sendiri')
    let vsBot = !lawan || server.isBot(lawan)
    if (!vsBot && games.find(g => g.players && g.players.includes(lawan))) return pesan.reply('Lawan kamu sedang bermain game lain')
    let id = 'ttt_' + Date.now()
    let botId = `${bot.number}@c.us`
    let game = server.room.big[id] = {
        id, chat: pesan.from, vsBot,
        players: [dt.sender, vsBot ? botId : lawan],
        board: Array(9).fill(null),
        turn: 0,
        status: vsBot ? 'play' : 'wait',
    }
    // suit.js & anonvoting membaca .peserta dari semua isi server.room.big
    game.peserta = game.players
    game.refresh = () => {
        clearTimeout(game.timer)
        game.timer = setTimeout(() => {
            if (server.room.big[id] !== game) return
            delete server.room.big[id]
            server.client.sendMessage(game.chat, '⌛ TicTacToe dibatalkan karena tidak ada langkah').catch(console.error)
        }, TIMEOUT)
    }
    game.refresh()
    if (vsBot) {
        return server.client.sendMessage(pesan.from, `🎮 *TICTACTOE vs BOT*\n\n${ttt.render(game.board)}\n\nKamu ❌, bot ⭕\nKetik angka *1-9* untuk menaruh tanda\nKetik *nyerah* untuk menyerah`, { mentions: [dt.sender] })
    }
    await server.client.sendMessage(pesan.from, `🎮 *TICTACTOE*\n${tag(dt.sender)} menantang ${tag(lawan)}!\n\nKetik *terima* untuk bermain atau *tolak* untuk menolak`, { mentions: game.players })
}
handler.help = ['ttt @tag', 'ttt bot']
handler.tags = ['game']
handler.command = /^(ttt|tictactoe|xo)$/i
module.exports = handler
