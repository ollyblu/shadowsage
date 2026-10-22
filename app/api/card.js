/**
 * Kartu bergambar (canvas): welcome/bye grup dan profil pengguna.
 */
const { createCanvas, loadImage } = require('canvas')
const fetch = require('node-fetch')

const FONT = '"Segoe UI", Arial, sans-serif'
const palette = {
    welcome: ['#0f2027', '#2c5364', '#4ade80'],
    bye: ['#1f1c2c', '#4b3b5c', '#f87171'],
    profile: ['#141e30', '#243b55', '#60a5fa'],
}

async function getAvatar(id) {
    try {
        let url = await server.client.getProfilePicUrl(id)
        if (!url) return null
        let res = await fetch(url, { timeout: 15000 })
        if (!res.ok) return null
        return await loadImage(await res.buffer())
    } catch { return null }
}

function background(ctx, w, h, [from, to]) {
    let g = ctx.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, from)
    g.addColorStop(1, to)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    // pola titik halus
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    for (let x = 0; x < w; x += 24) for (let y = 0; y < h; y += 24) ctx.fillRect(x, y, 2, 2)
}

function avatarCircle(ctx, img, x, y, r, accent, initial) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(x, y, r + 6, 0, Math.PI * 2)
    ctx.fillStyle = accent
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.clip()
    if (img) ctx.drawImage(img, x - r, y - r, r * 2, r * 2)
    else {
        ctx.fillStyle = '#334155'
        ctx.fillRect(x - r, y - r, r * 2, r * 2)
        ctx.fillStyle = '#e2e8f0'
        ctx.font = `bold ${r}px ${FONT}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(initial || '?', x, y + 4)
    }
    ctx.restore()
}

function fitText(ctx, text, maxWidth, size, weight = 'bold') {
    do {
        ctx.font = `${weight} ${size}px ${FONT}`
        size -= 2
    } while (ctx.measureText(text).width > maxWidth && size > 12)
}

async function welcomeCard({ id, name, group, type = 'welcome', count }) {
    const w = 1000, h = 400
    const [c1, c2, accent] = palette[type] || palette.welcome
    const canvas = createCanvas(w, h)
    const ctx = canvas.getContext('2d')
    background(ctx, w, h, [c1, c2])
    avatarCircle(ctx, await getAvatar(id), 200, 200, 120, accent, `${name}`.replace(/\D/g, '').slice(-2))
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = accent
    ctx.font = `bold 64px ${FONT}`
    ctx.fillText(type == 'bye' ? 'SELAMAT TINGGAL' : 'SELAMAT DATANG', 370, 150)
    ctx.fillStyle = '#ffffff'
    fitText(ctx, name, 580, 44)
    ctx.fillText(name, 370, 215)
    ctx.fillStyle = '#cbd5e1'
    fitText(ctx, group || '', 580, 32, 'normal')
    ctx.fillText(group || '', 370, 270)
    if (count) {
        ctx.font = `normal 26px ${FONT}`
        ctx.fillStyle = '#94a3b8'
        ctx.fillText(type == 'bye' ? `Tersisa ${count} anggota` : `Anggota ke-${count}`, 370, 320)
    }
    return canvas.toBuffer('image/png')
}

async function profileCard({ id, name, level, role, exp, min, max, ratio, money, bank, limit, rank, premium }) {
    const w = 1000, h = 420
    const [c1, c2, accent] = palette.profile
    const canvas = createCanvas(w, h)
    const ctx = canvas.getContext('2d')
    background(ctx, w, h, [c1, c2])
    avatarCircle(ctx, await getAvatar(id), 170, 170, 110, premium ? '#facc15' : accent, `${name}`.replace(/\D/g, '').slice(-2))
    ctx.textAlign = 'center'
    ctx.fillStyle = premium ? '#facc15' : '#94a3b8'
    ctx.font = `bold 24px ${FONT}`
    ctx.fillText(premium ? 'PREMIUM' : 'FREE USER', 170, 330)

    ctx.textAlign = 'left'
    ctx.fillStyle = '#ffffff'
    fitText(ctx, name, 600, 44)
    ctx.fillText(name, 330, 95)
    ctx.fillStyle = accent
    ctx.font = `bold 30px ${FONT}`
    ctx.fillText(`Level ${level}  •  ${role.replace(/^\S+\s/, '')}`, 330, 145)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#e2e8f0'
    ctx.font = `bold 28px ${FONT}`
    ctx.fillText(rank ? `#${rank}` : '', 950, 95)

    // progress bar XP
    const bx = 330, by = 175, bw = 620, bh = 32
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    roundRect(ctx, bx, by, bw, bh, 16)
    ctx.fill()
    ctx.fillStyle = accent
    roundRect(ctx, bx, by, Math.max(bh, bw * ratio), bh, 16)
    ctx.fill()
    ctx.textAlign = 'right'
    ctx.fillStyle = '#cbd5e1'
    ctx.font = `normal 22px ${FONT}`
    ctx.fillText(`${exp - min} / ${max - min} XP`, bx + bw, by + bh + 30)

    const stats = [['Money', money], ['Bank', bank], ['Limit', premium ? '∞' : limit]]
    ctx.textAlign = 'left'
    stats.forEach(([label, value], i) => {
        let x = 330 + i * 210
        ctx.fillStyle = '#94a3b8'
        ctx.font = `normal 22px ${FONT}`
        ctx.fillText(label, x, 300)
        ctx.fillStyle = '#ffffff'
        ctx.font = `bold 32px ${FONT}`
        ctx.fillText(Number(value) ? Number(value).toLocaleString('id-ID') : `${value}`, x, 345)
    })
    return canvas.toBuffer('image/png')
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
}

module.exports = { welcomeCard, profileCard, getAvatar }
