/**
 * Logika TicTacToe: papan 9 kotak berisi 0 (X), 1 (O), atau null.
 */
const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]
const num = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣']
const mark = ['❌', '⭕']

// 0 / 1 = pemenang, 'draw' = seri, null = belum selesai
function winner(board) {
    for (let [a, b, c] of lines) if (board[a] !== null && board[a] === board[b] && board[a] === board[c]) return board[a]
    return board.every(v => v !== null) ? 'draw' : null
}

function render(board) {
    let cells = board.map((v, i) => v === null ? num[i] : mark[v])
    return [0, 3, 6].map(i => cells.slice(i, i + 3).join('')).join('\n')
}

function minimax(board, player, me) {
    let w = winner(board)
    if (w === me) return { score: 10 }
    if (w === 1 - me) return { score: -10 }
    if (w === 'draw') return { score: 0 }
    let best = { score: player === me ? -Infinity : Infinity }
    board.forEach((v, i) => {
        if (v !== null) return
        board[i] = player
        let { score } = minimax(board, 1 - player, me)
        board[i] = null
        if (player === me ? score > best.score : score < best.score) best = { score, move: i }
    })
    return best
}

// Langkah bot. Sesekali acak supaya masih bisa dikalahkan
function botMove(board, me, mistake = 0.2) {
    let empty = board.map((v, i) => v === null ? i : -1).filter(i => i >= 0)
    if (Math.random() < mistake) return empty[Math.floor(Math.random() * empty.length)]
    return minimax([...board], me, me).move
}

module.exports = { winner, render, botMove, mark }
