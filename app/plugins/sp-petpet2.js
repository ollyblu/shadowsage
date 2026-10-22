const { createCanvas, loadImage, registerFont } = require('canvas')
const path = require('path')
const fs = require('fs')
const fetch = require('node-fetch')
const Jimp = require('jimp');
const GIFEncoder = require('gif-encoder-2');
const axios = require('axios');



const handler = {}
handler.main = async function(dt,pesan){
    let media
    if(pesan.hasMedia){
        media = await pesan.downloadMedia()
    }else if(pesan.hasQuotedMsg){
        let qoutedM = await pesan.getQuotedMessage()
        if(qoutedM.hasMedia){
            media = await qoutedM.downloadMedia()
        }else{
            return pesan.reply(`Silahkan kirim gambar dengan caption *!stiker* atau reply gambar dengan perintah *!stiker*`)
        }
    }else {
        return pesan.reply(`Silahkan kirim gambar dengan caption *!stiker* atau reply gambar dengan perintah *!stiker*`)
    }
    //media.toFilePath(__dirname+`/oke.jpg`)
    let options = {
        sendMediaAsSticker : true,
        stickerAuthor: bot.creator,
        stickerName: bot.name,
        stickerCategories: ['👍🏻']
        }
    if(!media)return pesan.reply('Terdapat kesalahan')
    if (media.mimetype !== 'image/png' && media.mimetype !== 'image/jpeg') {
        return await pesan.reply(`Hanya format PNG atau JPEG yang didukung untuk petpet. Media ini adalah: ${media.mimetype}`);
    }
    const imageBuffer = Buffer.from(media.data, 'base64');
    // let temp_petpet = path.join(__dirname,`/app/temp/petpet/${Math.floor(Math.random()*100000000)}.gif`)
    // let temp_petpet = path.join(__dirname,`/app/temp/petpet/${Math.floor(Math.random()*100000000)}.gif`)
    fs.mkdirSync(path.join(__dirname, '..', 'temp', 'petpet'), { recursive: true })
    let temp_petpet = path.join(__dirname, '..', 'temp', 'petpet', `${dt.room_id}_${Date.now()}.gif`)
    await generateLocalPetpetFromBuffer(imageBuffer,temp_petpet);
    const petpetMedia = server.MessageMedia.fromFilePath(temp_petpet);
    await server.client.sendMessage(pesan.from,petpetMedia,options)
    fs.promises.unlink(temp_petpet).catch(() => {})
    //server.client.sendMessage()
}

// --- Konstanta dan Fungsi Generator GIF Lokal ---
// Pindahkan semua konstanta (MAX_FRAME, OUT_SIZE, DELAY, SQUISH, SCALE, frameOffsets, getSpriteFrame)
// dan fungsi generateLocalPetpet dari skrip sebelumnya ke sini.

const MAX_FRAME = 4; 
const OUT_SIZE = 112; 
const DELAY = 60; 
const SQUISH = 1.25;
const SCALE = 0.875;
const TEMP_GIF_OUTPUT = './app/temp/petpet/petpet.gif';

const frameOffsets = [
    { x: 0, y: 0, w: 0, h: 0 },
    { x: -4, y: 12, w: 4, h: -12 },
    { x: -12, y: 18, w: 12, h: -18 },
    { x: -8, y: 12, w: 4, h: -12 },
    { x: -4, y: 0, w: 0, h: 0 },
];

const getSpriteFrame = (frame, spriteX, spriteY, spriteWidth, spriteHeight) => {
    const offset = frameOffsets[frame];
    return {
        dx: Math.floor(spriteX + offset.x * (SQUISH * 0.4)),
        dy: Math.floor(spriteY + offset.y * (SQUISH * 0.9)),
        dw: Math.floor((spriteWidth + offset.w * SQUISH) * SCALE),
        dh: Math.floor((spriteHeight + offset.h * SQUISH) * SCALE),
    };
};

// URL Sprite Tangan (ini harus diakses publik untuk diunduh sekali)
const HAND_SPRITE_PATH = './app/library/petpet.png'; 
let handSpriteImage = null; // Simpan gambar sprite tangan setelah diunduh

/**
 * Fungsi generator GIF lokal yang menggunakan data buffer dari WhatsApp
 * @param {Buffer} targetImageBuffer - Buffer gambar target dari WhatsApp
 */
async function generateLocalPetpetFromBuffer(targetImageBuffer,temp_petpet) {
    // Memuat Sprite Tangan hanya sekali saat aplikasi dimulai
    handSpriteImage = await Jimp.Jimp.read(HAND_SPRITE_PATH);
    // handSpriteImage.clone().crop()
    
    // Memuat gambar target dari buffer
    const targetImage = await Jimp.Jimp.read(targetImageBuffer);

    // --- Logika Pemrosesan Gambar (sama seperti skrip sebelumnya) ---
    const SPRITE_X = 14;
    const SPRITE_Y = 20;
    const SPRITE_WIDTH = 112; 
    // const ratio = targetImage.getHeight() / targetImage.getWidth();
    const ratio = targetImage.height/ targetImage.width
    const SPRITE_HEIGHT = Math.floor(SPRITE_WIDTH * ratio);
    
    const encoder = new GIFEncoder(OUT_SIZE, OUT_SIZE, 'neuquant');

    //tambahan
    const out = fs.createWriteStream(temp_petpet)
    const done = new Promise((resolve, reject) => { out.on('finish', resolve); out.on('error', reject) })
    encoder.createReadStream().pipe(out);

    encoder.setDelay(DELAY);
    encoder.setRepeat(0); 
    encoder.setTransparent(0x00FF00); 
    // encoder.out.
    // const stream = fs.createWriteStream(temp_petpet);
    // encoder.
    // encoder.pipe(stream);
    encoder.start();
    for (let i = 0; i <= MAX_FRAME; i++) {
        const frameParams = getSpriteFrame(i, SPRITE_X, SPRITE_Y, SPRITE_WIDTH, SPRITE_HEIGHT);
        let frameCanvas = await new Jimp.Jimp({width:OUT_SIZE,height: OUT_SIZE,color: 0x00FF00FF}); 
        
        const targetClone = targetImage.clone();
        targetClone.resize({w:frameParams.dw,h: frameParams.dh});
        frameCanvas.blit(targetClone, frameParams.dx, frameParams.dy);

        
        const handFrame = handSpriteImage.clone();
        handFrame.crop({x:i * OUT_SIZE,y: 0,w: OUT_SIZE,h: OUT_SIZE});
        
        const handDy = Math.max(0, Math.floor(frameParams.dy * 0.75 - Math.max(0, SPRITE_Y) - 0.5));

        frameCanvas.blit(handFrame, 0, handDy);
        
        encoder.addFrame(frameCanvas.bitmap.data);
    }

    encoder.finish();
    await done;
    // await new Promise(resolve => stream.on('finish', resolve));

    // return temp_petpet; // Mengembalikan path file yang dihasilkan
    // const buffer = encoder.getBuffer(); 
    // const buffer = encoder.out.data; 

    // 4. Tulis buffer ke file
    // await fs.promises.writeFile(temp_petpet, buffer);
    // encoder.createWriteStream
    // var bitMapStream = makeMyBitMaps(); // read stream that creates RGBA 1-dimensional bitmaps
    // bitMapStream
    // .pipe(encoder.createWriteStream({ repeat: -1, delay: 500, quality: 10 }))
    // .pipe(fs.createWriteStream('myanimated.gif'));

    return temp_petpet;
}


handler.help = 'petpet'
handler.tags = ['petpet','top']
handler.command = /^petpet$/i
handler.disabled = true

module.exports = handler