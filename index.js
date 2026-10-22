const Cfonts = require('cfonts')
const pkg = require('./package.json')
const cluster = require('cluster')
const path = require('path')
const yargs = require('yargs/yargs')
const Readline = require('readline')
const chalk = require('chalk')
const rl = Readline.createInterface(process.stdin, process.stdout)
global.terminal = {}
Cfonts.say('Starting...', {
    colors: ['#ff0000'],
    font: 'console',
    align: 'left'
})
Cfonts.say(pkg.name, {
    colors: ['#f2aa4c'],
    font: 'block',
    align: 'center',
})
Cfonts.say(`${pkg.author.name || pkg.author} dan ${pkg.name} dan ${pkg.main}`, {
    colors: ['#f2aa4c'],
    font: 'console',
    align: 'center',
})
const opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
let isRunning = false
let worker = null
let restartCount = 0
let lastStart = 0
function start(file) {
    if (isRunning) return
    isRunning = true
    lastStart = Date.now()
    let args = [path.join(__dirname, file), ...process.argv.slice(2)]
    Cfonts.say([process.argv[0], ...args].join(' '), {
        font: 'console',
        align: 'center',
        gradient: ['red', 'magenta']
    })
    cluster.setupPrimary({
        exec: args[0],
        args: args.slice(1),
    })
    let p = worker = cluster.fork()
    p.on('message', data => {
        console.log('[RECEIVED]', data)
        terminal.message = data
        switch (data) {
            case 'reset':
                p.removeAllListeners('exit')
                p.kill()
                isRunning = false
                start(file)
                break
            case 'uptime':
                p.send(process.uptime())
                break
            case 'break':
                terminal.break = true
                console.log('short break')
                break
        }
    })
    p.on('exit', code => {
        isRunning = false
        console.error(chalk.redBright('Exited with code:', code))
        if (code === 0 || shuttingDown) return process.exit(0)
        // Restart otomatis jika worker crash, dengan jeda yang makin lama bila crash beruntun
        if (Date.now() - lastStart > 60000) restartCount = 0
        restartCount++
        let wait = Math.min(5000 * restartCount, 60000)
        console.log(chalk.yellowBright(`Restart dalam ${wait / 1000} detik...`))
        setTimeout(() => start(file), wait)
    })
    p.on('error', err => {
        console.error(chalk.redBright(err))
    })
}
let shuttingDown = false
function shutdown() {
    if (shuttingDown) return
    shuttingDown = true
    console.log(chalk.yellowBright('Mematikan bot...'))
    if (worker && !worker.isDead()) worker.send('shutdown')
    else process.exit(0)
    // Paksa keluar bila worker tidak merespons
    setTimeout(() => process.exit(0), 15000).unref()
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
rl.on('SIGINT', shutdown)
if (!opts['test'] && !rl.listenerCount('line')) rl.on('line', line => {
    if (worker) worker.emit('message', line.trim())
})
start('./app/main.js')
