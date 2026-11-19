# Vice City Cover Maker

Ubah foto dan caption menjadi cover art gaya poster GTA 6 — grid multi-panel,
lettering tebal, grading sunset Vice City / neon — lalu export PNG
1080×1080, 1080×1350, dan 1920×1080.

Web app offline (file statis, tanpa server). Buka `app/index.html` langsung di
desktop Chrome — dari `file://` pun jalan, tanpa internet sama sekali.

## Cara pakai

1. Buka `app/index.html` di desktop Chrome.
2. Upload 1 sampai banyak foto (tombol **Upload Foto** atau seret & letakkan).
   Tips: 2–3 foto dengan suasana berbeda (siang, sunset, malam) memberi cover
   terkaya. Satu foto pun bisa — cover memakai sel grafik & grade berbeda.
3. Ganti judul (default **VICE CITY**) dan subtitle (default **LEONIDA • 2026**).
   Judul kosong otomatis kembali ke “VICE CITY”.
4. Pilih grade (**Vice Sunset** / **Neon Night** / **Original**) dan ukuran cover.
5. Klik sebuah panel di preview untuk memilihnya, lalu atur crop-nya dengan
   slider X / Y / Zoom, tombol **Flip**, atau **Shuffle Crops** untuk mengacak
   semua panel.
6. Export PNG — ukuran exact 1080×1080, 1080×1350, atau 1920×1080.

## Privasi

Foto diproses client-side saja di perangkatmu — tidak ada foto yang keluar
dari mesin, tidak ada request network. App ini tidak memuat apa pun dari
internet: font dibundel lokal, semua grafis digambar sendiri dengan canvas.

## Bukan produk resmi

Bukan produk resmi Rockstar Games. Tidak ada logo, artwork, screenshot, atau
font Rockstar di sini. Semua panel grafik (cakram matahari, skyline, bintang)
digambar sendiri dengan canvas; “VICE CITY” hanyalah kata judul, bukan logo.

## Font

- **Anton** — judul besar (SIL Open Font License)
- **Bebas Neue** — subtitle (SIL Open Font License)
- **Archivo Black** — header UI (SIL Open Font License)

File woff2 ada di `app/fonts/`; atribusi lengkap di `app/OFL-LICENSES.txt`.

## Struktur

```
app/
  index.html   — UI + preview (classic <script>, bukan module)
  cover.js     — renderer cover (layout, grading, judul, export)
  style.css
  fonts/       — Anton, Bebas Neue, Archivo Black (.woff2, OFL)
  OFL-LICENSES.txt
screenshots/   — 4 screenshot (cover hasil export + app di browser)
main.ts        — entrypoint Node 22: salin app/ + screenshots/ ke /output,
                 tulis /output/dossier.json (vendor/makefun-app.ts)
```

Jalankan entrypoint di luar grader dengan:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Lisensi

MIT — lihat `LICENSE`.
