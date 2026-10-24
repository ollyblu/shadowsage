<h1 align="center">🤖 ShadowSage-BOT</h1>

<p align="center">
  Bot WhatsApp multifungsi berbahasa Indonesia - modular, tahan <i>crash</i>, dan mendukung dua lapisan koneksi.
</p>

<p align="center">
  <img alt="Node" src="https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js&logoColor=white">
  <img alt="Version" src="https://img.shields.io/badge/version-2.2.0-f2aa4c">
  <img alt="License" src="https://img.shields.io/badge/license-GPL--3.0-blue">
  <img alt="Library" src="https://img.shields.io/badge/whatsapp--web.js-%7C%20Baileys-25D366?logo=whatsapp&logoColor=white">
</p>

---

## 🙏 Kredit & Ucapan Terima Kasih

**ShadowSage-BOT** merupakan hasil *recode* dan pengembangan dari [balhisyhrl/Anon-BOT](https://github.com/balhisyhrl/Anon-BOT). 

Ucapan terima kasih dan apresiasi sebesar-besarnya kepada para pengembang berikut:

* 👤 **[@balhisyhrl](https://github.com/balhisyhrl)** - Pembuat basis kode utama (Anon-BOT)
* 👤 **[@Nurutomo](https://github.com/Nurutomo)** - Kontributor & inspirasi modul
* 👤 **[@BochilGaming](https://github.com/BochilGaming)** - Penyedia *scrapers* & basis data
* 👤 **[@Aiine](https://github.com/Aiinne)** - Kontributor & pendukung proyek

---

## ✨ Tentang

ShadowSage-BOT dibangun dengan arsitektur **event-driven**, **master–worker**, dan **plugin-based**
(satu file = satu fitur) sehingga mudah dikembangkan dan mendukung *hot-reload* tanpa restart.
Bot bisa berjalan di atas dua lapisan koneksi WhatsApp:

- **whatsapp-web.js** (Chrome / Puppeteer)
- **Baileys** (WebSocket langsung, tanpa browser)

> 📐 Detail arsitektur lengkap ada di [`architecture.md`](architecture.md).

**Prefix default:** `!` (juga menerima `.` dan `#`). Contoh: `!menu`, `!stiker`, `!profile`.

---

## 🧩 Daftar Fitur

### 🎮 Game & Kuis
| Perintah | Keterangan |
|---|---|
| `tebakgambar` `tebakkata` `tebakkalimat` | Tebak dari gambar / kata / kalimat acak |
| `tebakbendera` `tebakemoji` `tebakgame` | Tebak bendera negara, emoji, judul game |
| `tebaklagu` `tebaklirik` `tebakkimia` | Tebak lagu, lirik, unsur kimia |
| `tebakangka` | Tebak angka (ada mode sulit) |
| `caklontong` `family100` `asahotak` | Kuis klasik ala TV |
| `hangman` `susunkata` `sambungkata` | Permainan kata |
| `matematika` | Soal hitung (mudah → gila) |
| `siapakahaku` `tekateki` | Tebak tokoh & teka-teki |
| `turnamen` | Kuis beruntun beberapa ronde |
| `suit @tag` | Suit pvp antar pengguna |
| `tictactoe` `xo` | Tic-tac-toe |
| `clue` | Minta petunjuk saat game berjalan |

### 💰 RPG & Ekonomi
| Perintah | Keterangan |
|---|---|
| `profile` `level` `me` | Lihat profil, XP, & level |
| `bank` `depo` `tarik` `transfer` `rob` | Sistem bank: nabung, tarik, kirim, rampok |
| `daily` `weekly` `work` | Hadiah harian/mingguan & kerja |
| `shop` `buy` `inv` `use` `buylimit` | Toko, inventaris, beli limit |
| `slots` `coinflip` `dadu` | Casino mini |
| `lb` `leaderboard` `top` | Papan peringkat (exp/money/level) |

### 🎨 Stiker & Media
| Perintah | Keterangan |
|---|---|
| `stiker` `sticker` | Ubah gambar/video jadi stiker |
| `petpet` | Stiker petpet (elus kepala) |
| `smeme` `wm` `take` `brat` `emojimix` | Alat stiker: meme, watermark, brat, mix emoji |
| `toimg` | Stiker → gambar |
| `hd` `remini` `upscale` `blur` `gray` `invert` | Edit & tingkatkan kualitas gambar |
| `tomp3` `tovn` `togif` | Konversi media (audio/voice note/gif) |

### ⬇️ Downloader
| Perintah | Keterangan |
|---|---|
| `play` `ytmp3` `ytmp4` | Unduh audio/video YouTube |
| `tiktok` `ig` `fb` `twitter` `pinterest` | Unduh dari TikTok, Instagram, Facebook, X, Pinterest |

### 🌐 Info & Internet
| Perintah | Keterangan |
|---|---|
| `cuaca <kota>` | Prakiraan cuaca |
| `gempa` `bmkg` | Info gempa terkini |
| `kurs` `crypto` | Kurs mata uang & kripto |
| `covid` | Statistik COVID-19 |
| `sholat` | Jadwal sholat (bisa langganan) |
| `kbbi <kata>` | Arti kata dari KBBI |
| `brainly` | Cari jawaban di Brainly |

### 🔤 Tools
| Perintah | Keterangan |
|---|---|
| `tr <bahasa> <teks>` | Terjemahan (Google Translate) |
| `aksara` | Transliterasi aksara Jawa |
| `font` | Ubah teks ke berbagai gaya font |
| `qrcode` | Buat QR code |
| `tts` `gtts` | Teks → suara |
| `encryptCC` `decryptCC` `encryptaes` | Enkripsi Caesar & AES |
| `remind` `listingat` `delingat` | Pengingat berjadwal |

### 😄 Fun & Random
| Perintah | Keterangan |
|---|---|
| `apakah` `benarkah` `bisakah` `bukankah` `kapankah` `siapakah` `rate` | Kerang ajaib |
| `bucin` `cerpen` `pantun` `katanime` `renungan` | Kata-kata & tulisan acak |
| `konachan` | Gambar acak |

### 💌 Menfess (Pesan Anonim)
| Perintah | Keterangan |
|---|---|
| `menfess` `mf` `confess` | Kirim pesan anonim antar pengguna |
| `balas` `mfr` | Balas thread menfess |

### 👥 Manajemen Grup
| Perintah | Keterangan |
|---|---|
| `kick` `add` `promote` `demote` | Kelola anggota grup |
| `linkgc` `revoke` `setnamegc` `setdescgc` | Kelola info grup |
| `setting` `mute` `unmute` `setwelcome` `setbye` | Pengaturan grup |
| `warn` `unwarn` `listwarn` | Sistem peringatan |
| `tagall` `hidetag` | Tag semua anggota |
| `anonvot` | Voting anonim |
| `autotim` | Bagi anggota jadi beberapa kelompok otomatis |

### 📖 Agama
| Perintah | Keterangan |
|---|---|
| `alkitab` | Baca ayat Alkitab |
| `sholat` | Jadwal sholat |

### 👑 Owner
| Perintah | Keterangan |
|---|---|
| `eval` `exec` | Jalankan kode/perintah |
| `broadcast` `bc` | Siaran ke semua chat |
| `ban` `unban` `addprem` `addlimit` | Kelola pengguna |
| `mode` `stats` `topcmd` `restart` `backup` `plugins` | Administrasi bot |

### 🔁 Otomatis (tanpa perintah)
Anti-link, auto-reply, auto-save media, dan relay menfess berjalan di latar belakang sesuai pengaturan grup.

> Lihat daftar lengkap & bantuan tiap perintah lewat **`!menu`** di dalam chat.

---

## 📋 Prasyarat

- **Node.js** `>= 18`
- *(Opsional)* **Google Chrome** untuk mode `whatsapp-web.js`
- *(Opsional)* **ffmpeg** & **yt-dlp** untuk fitur media / voice note

---

## 🚀 Instalasi

```bash
# 1) Clone & install
git clone https://github.com/ollyblu/shadowsage.git
cd Shadowsage
npm install

# 2) Konfigurasi rahasia (opsional) - salin lalu isi seperlunya
cp .env.example .env

# 3) Konfigurasi bot - salin template lalu isi nomor owner & bot
cp app/settings/data.example.json app/settings/data.json
```

Edit `app/settings/data.json`:

| Field | Keterangan |
|---|---|
| `owner` | Array nomor owner, format `628xxxxxxxxxx` |
| `premium` | Array nomor pengguna premium |
| `number` | Nomor WhatsApp yang dipakai sebagai bot |
| `creator` | Namamu |
| `api` | `wwebjs` atau `baileys` |

> File database (`app/database/*.json`) dibuat otomatis saat bot pertama kali jalan -
> strukturnya dapat dilihat di file `*.example.json`.

---

## ▶️ Menjalankan

```bash
npm start                 # pakai pengaturan "api" di data.json
npm run start:wwebjs      # paksa whatsapp-web.js
npm run start:baileys     # paksa Baileys
```

- **whatsapp-web.js** → scan QR code yang muncul di terminal.
- **Baileys** → isi `baileys.pairingNumber` di `data.json` (atau env `PAIRING_NUMBER`) untuk login via kode pairing.

---

## 🔒 Catatan Keamanan

File berikut **tidak** ikut ke repo (lihat [`.gitignore`](.gitignore)) karena berisi kredensial/data pribadi:

- `.wwebjs_auth/`, `.wwebjs_cache/`, `auth_baileys/` - sesi login WhatsApp
- `app/settings/data.json` - nomor owner/bot
- `app/database/*.json`, `app/urgent/`, `app/saved/`, `app/temp/` - data pengguna runtime
- `.env` - API key

---

## 📜 Lisensi

Dirilis di bawah lisensi **[GPL-3.0-or-later](https://www.gnu.org/licenses/gpl-3.0.html)**
