const ttt = require('../api/tictactoe')
const { tag } = require('../api/target')

const REWARD = { exp: 400, money: 400 }
const REWARD_BOT = { exp: 200, money: 150 }

function end(game) {
    clearTimeout(game.timer)
    delete server.room.big[game.id]
}

async function finish(game, result) {
    end(game)
    let board = ttt.render(game.board)
    if (result === 'draw') return server.client.sendMessage(game.chat, `${board}\n\n🤝 *SERI!*`, { mentions: game.players })
    let win = game.players[result]
    if (game.vsBot && result === 1) return server.client.sendMessage(game.chat, `${board}\n\n🤖 Bot menang! Coba lagi ya ${tag(game.players[0])}`, { mentions: [game.players[0]] })
    let r = game.vsBot ? REWARD_BOT : REWARD
    let user = getUser(win)
    user.exp += r.exp
    user.money += r.money
    await server.client.sendMessage(game.chat, `${board}\n\n🏆 ${tag(win)} *MENANG!*\n+✨ ${r.exp} XP  +💰 ${r.money}`, { mentions: game.players })
}

const handler = {}
handler.all = async function (dt, pesan) {
    let game = Object.values(server.room.big || {}).find(g => g.id && g.id.startsWith('ttt') && g.chat == pesan.from && g.players.includes(dt.sender))
    if (!game) return
    let body = pesan.body.trim().toLowerCase()
    if (game.status == 'wait') {
        if (dt.sender !== game.players[1]) return
        if (/^(tolak|gamau|nanti|ga(k)?\s?bisa)/.test(body)) {
            end(game)
            return pesan.reply('TicTacToe ditolak 😢')
        }
        if (!/^(terima|acc|gas|ok(e)?|ayo)/.test(body)) return
        game.status = 'play'
        game.refresh()
        return server.client.sendMessage(game.chat, `🎮 *TICTACTOE DIMULAI*\n\n${ttt.render(game.board)}\n\n❌ ${tag(game.players[0])}\n⭕ ${tag(game.players[1])}\n\nGiliran ${tag(game.players[0])}, ketik angka *1-9*`, { mentions: game.players })
    }
    if (/^(nyerah|menyerah|surrender)$/.test(body)) {
        let loser = game.players.indexOf(dt.sender)
        return finish(game, 1 - loser)
    }
    if (!/^[1-9]$/.test(body)) return
    if (game.players[game.turn] !== dt.sender) return pesan.reply('Bukan giliran kamu')
    let i = Number(body) - 1
    if (game.board[i] !== null) return pesan.reply('Kotak itu sudah terisi')
    game.board[i] = game.turn
    dt.stop = true
    let w = ttt.winner(game.board)
    if (w !== null) return finish(game, w)
    game.turn = 1 - game.turn
    if (game.vsBot) {
        game.board[ttt.botMove(game.board, 1)] = 1
        w = ttt.winner(game.board)
        if (w !== null) return finish(game, w)
        game.turn = 0
    }
    game.refresh()
    let next = game.players[game.turn]
    await server.client.sendMessage(game.chat, `${ttt.render(game.board)}\n\nGiliran ${game.vsBot ? 'kamu' : tag(next)} (${ttt.mark[game.turn]})`, { mentions: [next] })
}
module.exports = handler
