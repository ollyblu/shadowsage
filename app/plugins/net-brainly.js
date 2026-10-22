
const handler = {}
const {Brainly} = require('brainly-scraper-v2')
const brain = new Brainly('id')
handler.main = async function(dt,pesan){
    let text = dt.text.trim()
    if(!text)return pesan.reply('Soalnya?')
    let res = await brain.search(text)
    let jumlahjawaban = res.length
        await pesan.reply(`Terdapat ${jumlahjawaban} Soal yang mirip\n\n_Mengirim soal dan jawaban......_`)
        for(let i=0;i<jumlahjawaban;i++){
            let author = res[i].question.author
            let jawaban = res[i].answers[0]
            let Brains = `User : ${author && author.username ? author.username : ''}
Pertanyaan : ${res[i].question.content||''}
${jawaban && jawaban.content ? 'Jawaban : '+jawaban.content:'Jawaban : Belum ada'}`
            await pesan.reply(Brains)
        }
//     brain.search(text).then(async (res)=>{
//         let jumlahjawaban = res.length
//         //console.log(res)
//         await pesan.reply(`Terdapat ${jumlahjawaban} Soal yang mirip\n\n_Mengirim soal dan jawaban......_`)
//         for(let i=0;i<jumlahjawaban;i++){
//             let Brains = `User : ${res[i].question.author.username?res[i].question.author.username:''}
// Pertanyaan : ${res[i].question.content||''}
// ${res[i].answers[0].content ? 'Jawaban : '+res[i].answers[0].content:'Jawaban : Belum ada'}`
//             await pesan.reply(Brains)
//         }
//     }).catch((e)=>{

//     })
}
handler.help = ['brainly <soal>']
handler.tags = ['internet']
handler.command = /^brainly$/i
handler.disabled = true
module.exports = handler