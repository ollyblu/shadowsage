# Blueprint Arsitektur Shadowsage-BOT

Dokumen ini menjelaskan arsitektur sistem, alur pemrosesan permintaan (request), serta struktur direktori dari **Shadowsage-BOT**.

---

## 1. Gambaran Umum Arsitektur

Shadowsage-BOT dibangun menggunakan arsitektur **Event-Driven**, **Master-Worker (Process Management)**, dan **Plugin-Based Modular Architecture**. Pendekatan ini memastikan bot mudah dikembangkan, tahan terhadap *crash*, dan mendukung *hot-reloading* fitur tanpa harus me-restart seluruh proses bot.

```
                  +--------------------------+
                  |  index.js (Cluster/Master) |
                  +-------------+------------+
                                | Spawns / Manages
                                v
                  +--------------------------+
                  |    app/main.js (Worker)   |
                  +-------------+------------+
                                |
        +-----------------------+-----------------------+
        | Initializes                                   | Initializes
        v                                               v
+-----------------------+                       +-----------------------+
|  Database (LowDB)     |                       | WhatsApp Client       |
+-----------------------+                       +---+-------------------+
                                                    | Receives `message`
                                                    v
                                                +-----------------------+
                                                |    app/handler.js     |
                                                +---+-------------------+
                                                    | Parses & Matches
                                                    v
                                                +-----------------------+
                                                |   app/plugins/*.js    |
                                                +-----------------------+
```

---

## 2. Struktur Direktori Utama

```text
Shadowsage-BOT/
├── index.js              # Entry point utama (Cluster Manager)
├── app/                  # Inti logika aplikasi
│   ├── main.js           # Inisialisasi utama (Client, DB, Plugin loader)
│   ├── handler.js        # Dispatcher pusat untuk pesan & command
│   ├── api/              # Adapter database (lowdb lokal), helper API eksternal, quiz.js (logika bersama game tebak-tebakan)
│   ├── plugins/          # Modul fitur/perintah bot (Command-based)
│   └── settings/         # Konfigurasi & konstanta global
├── database/             # Penyimpanan data lokal (JSON database)
├── package.json          # Manajemen dependensi & skrip
└── architecture.md       # (Dokumentasi Blueprint ini)
```

---

## 3. Komponen Utama

### A. Process Management (`index.js`)
*   Menggunakan modul bawaan Node.js `cluster`.
*   Berfungsi sebagai *Process Supervisor* yang secara otomatis me-restart worker (`app/main.js`) jika terjadi kegagalan atau *crash*.

### B. Core Application & Inisialisasi (`app/main.js`)
*   Memuat konfigurasi global dan menginisialisasi koneksi database (LowDB / MongoDB).
*   Menginisialisasi klien WhatsApp (menggunakan `whatsapp-web.js` dan Puppeteer).
*   Memuat seluruh file plugin dari direktori `app/plugins/` dan memantau perubahan file (*hot-reload*).
*   Mendaftarkan event listener utama (seperti `message`, `qr`, `ready`, dll.).

### B2. Lapisan Koneksi WhatsApp (`app/api/connection/`)
*   Bot bisa memakai **whatsapp-web.js** (Chrome/puppeteer) atau **Baileys** (WebSocket langsung, tanpa browser).
*   Pilihan API (prioritas tertinggi dulu): argumen `--api baileys|wwebjs`, env `WA_API`, lalu `"api"` di `app/settings/data.json`.
*   `baileys.js` adalah adapter yang meniru API whatsapp-web.js (`sendMessage`, `msg.reply`, `msg.react`, `msg.getChat`, `downloadMedia`, dst.) dan menampilkan ID dalam format `nomor@c.us`, sehingga handler, plugin, dan database tidak perlu diubah.
*   `convert.js` menangani pembuatan stiker (sharp + node-webpmux) dan voice note (ffmpeg) untuk Baileys.
*   Sesi login terpisah: `.wwebjs_auth/` untuk whatsapp-web.js dan `auth_baileys/` untuk Baileys.

### C. Message Dispatcher / Request Handler (`app/handler.js`)
*   Bertindak sebagai *Middleware* dan router pusat untuk setiap pesan yang masuk.
*   **Alur Kerja Handler:**
    1.  **Penerimaan Event:** Menerima payload pesan dari klien WhatsApp.
    2.  **Preprocessing & Sanitasi:** Memeriksa apakah pesan berasal dari bot sendiri, melakukan *rate-limiting*, dan memastikan struktur data pesan valid.
    3.  **Manajemen Pengguna:** Memuat atau mendaftarkan data user, grup, dan sesi ke dalam database.
    4.  **Command Matching:** Memeriksa apakah teks pesan diawali dengan prefix yang valid (misal: `!`, `.`, `#`) atau mencocokkannya dengan pola regex yang didaftarkan oleh plugin.
    5.  **Eksekusi Plugin:** Memanggil fungsi eksekusi dari plugin yang cocok.

### D. Sistem Plugin (`app/plugins/`)
*   Setiap fitur bot diisolasi ke dalam file terpisah (contoh: pengunduh media, game, alat bantu).
*   Setiap plugin mengekspor struktur standar yang berisi metadata perintah, batasan akses (admin/owner), dan fungsi eksekusi utama (`run` atau `handler`).

---

## 4. Alur Penanganan Permintaan (Request Lifecycle)

```
[ Client / User ]
       │
       ▼ Kirim Pesan via WhatsApp
[ WhatsApp Server ]
       │
       ▼ Event `message`
[ app/main.js ]
       │
       ▼ Teruskan payload
[ app/handler.js ]
       ├── 1. Validasi & Filter (Anti-spam, Group/Private check)
       ├── 2. Update Database (User stats, saldo, level)
       ├── 3. Cek Prefix & Command Matching
       │
       ▼ Jika cocok dengan plugin
[ app/plugins/<target-plugin>.js ]
       │
       ▼ Eksekusi logika & kirim balasan
[ WhatsApp Client ] ──> [ Client / User ]
```

---

## 5. Penyimpanan Data (Database)
*   Menggunakan **LowDB** berbasis file JSON lokal (`database.json`) atau **Mongoose/MongoDB** untuk skala yang lebih besar.
*   Menyimpan data terstruktur untuk:
    *   Pengguna (nomor, limit, XP, level, status banned).
    *   Grup (pengaturan khusus grup, welcome message, dll.).
    *   Sesi interaktif (game, kuis, verifikasi).

---

## 6. Atribut Plugin (Middleware Handler)

`handler.js` memeriksa atribut berikut sebelum menjalankan `plugin.main` (lihat `checkAccess`). Pesan penolakan ada di `config.dfail` (`app/settings/config.js`).

| Atribut | Contoh | Arti |
|---|---|---|
| `owner` | `true` | Hanya owner bot |
| `premium` | `true` | Hanya pengguna premium (owner selalu lolos) |
| `group` / `private` | `true` | Hanya di grup / hanya di chat pribadi |
| `admin` / `botAdmin` | `true` | Pengirim harus admin / bot harus admin |
| `level` | `5` | Level minimum |
| `limit` | `true` atau `2` | Potong limit setelah perintah sukses (premium bebas). Set `dt.noLimit = true` di plugin untuk membatalkan potongan |
| `cooldown` | `10000` | Jeda (ms) per pengguna per plugin |
| `exp` | `0` | XP per pemakaian (default acak 3–10) |
| `bypassMute` | `true` | Tetap jalan di grup yang di-`!mute` |

Objek `dt` juga berisi `dt.usr` (data user), `dt.roomdb` (pengaturan grup: `welcome`, `antilink`, `antitoxic`, `antidelete`, `mute`, `warn`), `dt.isOwner`, `dt.isPremium`, dan `await dt.getAdmin()` (mengisi `dt.isAdmin`, `dt.isBotAdmin`, `dt.participants`).

Helper bersama di `app/api/`: `target.js` (ambil target dari mention/reply/nomor), `warn.js`, `level.js`, `rpg.js` (format uang & item toko), `card.js` (kartu gambar), `media-tools.js`, `ytdlp.js`, `kbbi.js`, `cron.js` (job berkala; plugin bisa `register(nama, fn)`), dan `quiz.js` (engine tebak-tebakan; soal bisa dari JSON atau `generate`).

Database ketiga `app/database/settings.json` menyimpan mode bot, statistik perintah, pengingat, dan langganan jadwal sholat.
