# VICE CITY — Cover Art Studio

Ubah foto dan caption menjadi cover art gaya poster GTA 6 — grid multi-panel,
lettering tebal, grading sunset Vice City / neon — lalu export sebagai PNG siap posting.

Dibangun untuk kompetisi make.fun **gta6-cover-art-01**. 100% offline, file statis,
tanpa server, tanpa upload.

## Cara pakai

1. Double-click `index.html` — app terbuka di desktop Chrome (juga jalan dari
   `file://`, tanpa server sama sekali).
2. Tambah foto lewat tombol **+ Tambah Foto** atau seret foto ke area pratinjau.
   Bisa beberapa foto; tiap panel bisa pakai foto berbeda.
3. Klik sebuah panel di pratinjau untuk memilihnya, lalu atur foto, zoom, dan
   posisi panel itu.
4. Pilih layout (Grid 2×2 / Hero + 3 / Trio / Single), preset grading
   (Sunset / Neon Night / Pastel Vice), dan filter (saturasi, kontras, kecerahan).
5. Ganti judul (default **VICE CITY**), caption, dan lencana sesukamu.
6. Export PNG: **1080 × 1080**, **1080 × 1350**, atau **1920 × 1080** — atau
   **Export Ketiganya** sekaligus.

Belum punya foto? Tekan **Pakai Scene Contoh**: scene sunset prosedural
(skyline, pohon palem, matahari bergaris) digambar langsung di kanvas, jadi app
bisa dipakai dan diverifikasi tanpa upload foto apa pun.

## File

- `index.html` — struktur app
- `app.js` — semua logika: render cover, layout panel, grading, export, self-test
  (classic `<script>`, tanpa module, tanpa library eksternal)
- `style.css` — tampilan editor

## Privasi

Foto dibaca dengan `FileReader` di browsermu saja dan tidak pernah keluar dari
mesin. Tidak ada `fetch`/`XMLHttpRequest`, tidak ada URL eksternal, tidak ada
pelacak, tidak ada cookie. Semua artwork latar digambar prosedural di kanvas.

## Self-test

Buka `index.html?selftest=1` — app akan me-render ketiga ukuran export di memori
dan menulis hasilnya ke elemen `#selftest-result` dan ke `document.title`:

- `SELFTEST PASS: OK 1080x1080 | OK 1080x1350 | OK 1920x1080`

## Disclaimer

Karya orisinal buatan penggemar, bukan produk resmi. Tidak berafiliasi dengan
Rockstar Games. Tanpa logo Rockstar, tanpa artwork resmi, tanpa font game.
Font memakai stack sistem (Arial Black / Impact / sans-serif).

## Lisensi

MIT — lihat `LICENSE`.
