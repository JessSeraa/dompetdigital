# Dompetku — Pencatat Keuangan Pribadi

Aplikasi fullstack untuk mencatat pemasukan dan pengeluaran pribadi. Setiap akun memiliki kategori dan transaksi yang terpisah.

## Teknologi

- Frontend: React, Vite, Recharts
- Backend: Node.js, Express
- Database: SQLite melalui `better-sqlite3`
- Autentikasi: JWT dan bcrypt

## Persiapan

Pastikan Node.js versi 20 atau lebih baru telah terpasang. Buka dua terminal di folder proyek ini.

### 1. Jalankan backend

```powershell
cd backend
Copy-Item .env.example .env
```

Buka `backend/.env`, lalu ganti `JWT_SECRET` dengan secret acak yang panjang (minimal 32 karakter). Setelah itu:

```powershell
npm.cmd install
npm.cmd run dev
```

API berjalan di `http://localhost:4000`. Database SQLite dibuat otomatis di `backend/data/finance.db`.

### 2. Jalankan frontend

Di terminal kedua, dari folder proyek:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Buka alamat yang ditampilkan Vite, biasanya `http://localhost:5173`. Vite meneruskan panggilan `/api` ke backend.

Untuk membuat build produksi frontend:

```powershell
cd frontend
npm.cmd run build
```

## Akun demo

- Email: `demo@dompetku.id`
- Kata sandi: `Demo123!`

Akun beserta transaksi pemasukan contoh dibuat otomatis pada lingkungan development. Akun demo tidak dibuat di production. Kategori bawaan diberikan otomatis kepada setiap akun baru.

## Deploy online

Proyek ini sudah memiliki `Dockerfile` untuk menjalankan frontend dan API di satu alamat, serta membutuhkan volume persisten untuk file SQLite.

### Contoh deploy dengan Railway

1. Buat repository GitHub (sebaiknya private) dan unggah kode proyek. Pastikan `backend/.env` dan `backend/data/` tidak ikut diunggah; keduanya sudah tercantum di `.gitignore`.
2. Di Railway, buat project dari repository tersebut. Gunakan `Dockerfile` di folder root proyek.
3. Tambahkan Volume pada service dengan mount path `/data`. Jangan menambahkan replica kedua untuk aplikasi SQLite ini.
4. Tambahkan environment variables di pengaturan service:

   | Variable | Nilai |
   | --- | --- |
   | `JWT_SECRET` | Secret acak minimal 32 karakter; buat dengan `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
   | `DATABASE_FILE` | `/data/finance.db` |
   | `FRONTEND_URL` | URL publik aplikasi, misalnya `https://nama-aplikasi.up.railway.app` |

   `NODE_ENV=production` dan `PORT` sudah ditangani oleh container/platform. Jangan masukkan secret ke GitHub; atur hanya di dashboard hosting.
5. Deploy, buat domain publik dari pengaturan Railway, lalu buka domain tersebut dan uji pendaftaran akun serta transaksi. Jika domain berubah, perbarui `FRONTEND_URL` lalu deploy ulang.

Pastikan volume benar-benar terpasang sebelum menerima data pengguna. Jika container dibuat ulang tanpa volume persisten, file database dapat hilang. Buat backup volume/database secara berkala. SQLite pada konfigurasi ini ditujukan untuk satu service/instance; bila aplikasi membutuhkan banyak instance atau beban tulis tinggi, migrasikan database ke PostgreSQL sebelum scaling.

Untuk produksi publik, gunakan domain HTTPS, batasi akses repository dan environment variables, serta jangan gunakan akun demo untuk data pribadi.

## Fitur

- Registrasi, login, dan sesi JWT; data transaksi tiap pengguna terisolasi.
- Tambah, ubah, dan hapus transaksi pemasukan/pengeluaran.
- Kategori bawaan serta pembuatan kategori pribadi.
- Ringkasan pemasukan, pengeluaran, saldo bulan berjalan, grafik kategori, dan tren enam bulan.
- Filter transaksi berdasarkan bulan, kategori, dan jenis.
- Ekspor transaksi akun ke CSV dengan UTF-8.
- Tampilan responsif dan format nominal Rupiah.
- Peran admin untuk melihat statistik umum dan mengaktifkan/menonaktifkan akun tanpa melihat transaksi pribadi.

## Membuat akun admin

Pendaftaran publik selalu membuat akun `user`; formulir pendaftaran tidak menyediakan pilihan admin. Buat/promosikan admin secara manual melalui command berikut dari folder `backend`:

```powershell
$env:ADMIN_NAME = "Admin Dompetku"
$env:ADMIN_EMAIL = "admin@example.com"
$env:ADMIN_PASSWORD = "ganti-dengan-password-kuat-minimal-12-karakter"
npm.cmd run create-admin
Remove-Item Env:ADMIN_NAME, Env:ADMIN_EMAIL, Env:ADMIN_PASSWORD
```

Password admin minimal 12 karakter dan tidak ditampilkan oleh command. Di production, jalankan command ini **sekali di terminal service hosting** setelah deploy, agar admin dibuat pada database di volume production. Jangan menjalankannya di komputer lokal jika yang dimaksud adalah membuat admin pada database production.

Admin masuk melalui halaman login yang sama. Setelah masuk, menu **Admin** menampilkan jumlah akun dan transaksi secara agregat, daftar nama/email/status akun, serta kontrol aktif/nonaktif. Admin tidak mendapat endpoint untuk membaca transaksi pengguna. Akun user yang dinonaktifkan tidak dapat masuk atau memakai sesi yang sudah ada.

## Endpoint API utama

Semua endpoint selain autentikasi dan `GET /api/health` memerlukan header `Authorization: Bearer <token>`.

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| POST | `/api/auth/register` | Buat akun |
| POST | `/api/auth/login` | Masuk |
| GET | `/api/auth/me` | Profil sesi aktif |
| GET, POST | `/api/categories` | Daftar dan tambah kategori |
| GET, POST | `/api/transactions` | Daftar (filter `month`, `categoryId`, `type`) dan tambah transaksi |
| PUT, DELETE | `/api/transactions/:id` | Ubah dan hapus transaksi |
| GET | `/api/transactions/export` | Unduh transaksi dalam CSV |
| GET | `/api/dashboard?month=YYYY-MM` | Ringkasan dan data grafik |
| GET | `/api/admin/overview` | Statistik umum dan daftar akun (admin saja; tanpa transaksi pribadi) |
| PATCH | `/api/admin/users/:id/status` | Aktifkan/nonaktifkan akun (admin saja) |
