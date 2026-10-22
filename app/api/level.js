/**
 * Sistem level & gelar.
 * exp bersifat kumulatif; level tidak pernah turun walau exp berkurang (salah jawab di game).
 */
const roles = [
    [1, '🌱 Pemula'],
    [5, '🪵 Perunggu'],
    [10, '🥈 Perak'],
    [20, '🥇 Emas'],
    [35, '💎 Berlian'],
    [50, '👑 Master'],
    [75, '🔥 Grandmaster'],
    [100, '🌌 Legenda'],
]

// exp total yang dibutuhkan untuk mencapai level berikutnya dari `level`
const xpNeeded = level => Math.floor(100 * Math.pow(level, 1.5))

function role(level) {
    let r = roles[0][1]
    for (let [min, name] of roles) if (level >= min) r = name
    return r
}

// Naikkan level user selama exp cukup. Mengembalikan level lama bila naik, selain itu false
function levelUp(user) {
    let before = user.level
    while (user.exp >= xpNeeded(user.level)) user.level++
    return user.level > before ? before : false
}

// Progres menuju level berikutnya, 0..1
function progress(user) {
    let min = user.level > 1 ? xpNeeded(user.level - 1) : 0
    let max = xpNeeded(user.level)
    return { min, max, ratio: Math.max(0, Math.min(1, (user.exp - min) / (max - min))) }
}

module.exports = { roles, xpNeeded, role, levelUp, progress }
