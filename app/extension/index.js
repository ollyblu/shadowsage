let fs = require('fs')
let chalk = require('chalk')
let file = require.resolve(__filename)
fs.watchFile(file,()=>{
  fs.unwatchFile(file)
  console.log(chalk.redBright("Update 'extension.js'"))
  delete require.cache[file]
  require(file)
})
global.extension ={}
extension.ads = {
    your_ads_here:{
        url: "https://telegra.ph/file/fe00a359632863cf3800c.jpg",
        dir: __dirname+'/ads/your_ads.jpg'
    }
}