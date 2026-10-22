const fetch = require('node-fetch')
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const KONACHAN_API_URL = 'https://konachan.com/post.json';
const DOWNLOAD_PATH = path.join(__dirname, 'random_konachan_image.jpg');
const handler = {}
handler.main = async function(dt,pesan){
    let random = await getRandomPost()
    if (!random) throw 'Gagal mengambil gambar'
    let media = await server.MessageMedia.fromUrl(random.file_url, { unsafeMime: true })
    await server.client.sendMessage(pesan.from,media,{caption:`ID:${random.id}`})
}

async function getRandomPost() {
    try {
        // Ambil postingan terbaru (misalnya 20 postingan pertama).
        // Kita hanya mengambil halaman 1 karena Konachan tidak memiliki parameter 'random'.
        const response = await axios.get(KONACHAN_API_URL, {
            params: {
                limit: 20, // Batasi jumlah postingan yang diambil
                page: 1    // Ambil halaman pertama
            }
        });

        const posts = response.data;

        if (posts.length === 0) {
            console.log('Tidak ada postingan yang ditemukan.');
            return null;
        }

        // Pilih postingan acak dari daftar yang diambil
        const randomIndex = Math.floor(Math.random() * posts.length);
        const randomPost = posts[randomIndex];

        return randomPost;

    } catch (error) {
        console.error('Terjadi kesalahan saat mengambil data dari Konachan API:', error.message);
        return null;
    }
}

handler.help = 'konachan'
// handler.tags = ['']
handler.command = /^konachan$/i
handler.disabled = true
module.exports = handler