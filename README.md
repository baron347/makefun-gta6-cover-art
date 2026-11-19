# Vice City Cover Maker

Turn your own photos + a caption into a multi-panel poster cover in the
style of GTA 6 posters — a comic-style panel grid around a bold centre
title, Vice City sunset or neon grading — and export it as a PNG to share.
Built for the make.fun competition `gta6-cover-art-01`.

> An original fan-style poster maker. Not affiliated with or endorsed by
> Rockstar Games. It uses no Rockstar logo, artwork, character, or font.

## How to use

1. Open `app/index.html` in desktop Chrome — double-click it, or serve
   `app/` with any static server. The app works fully **offline** and makes
   **no network request**.
2. Upload 1–3 of your own photos (file picker, or drag them onto the
   preview). Tip: upload 2–3 photos with different moods for the richest
   cover — a portrait, a street or night shot, and a skyline or beach.
   One photo works too: the app adds drawn graphic panels so it never
   looks like a contact sheet.
3. Edit the caption (default **VICE CITY**) and the subtitle
   (default **LEONIDA • 2026**). An empty caption falls back to VICE CITY,
   so the title is never blank.
4. Pick a colour grade — **Vice Sunset** (warm pink/orange),
   **Neon Night** (purple/cyan), or **Original** — and an export size:
   1080×1080, 1080×1350, or 1920×1080.
5. Click any photo panel in the preview to select it, then crop it with
   the focal X / focal Y / zoom sliders, or flip it with **Flip panel**.
   Hit **Shuffle crops** to re-roll the focal point and zoom of **every**
   panel at once.
6. Click **Export PNG** — the cover downloads as a PNG at the exact size
   you picked.

## Layouts

- **Square 1080×1080** — 3×3 grid, title block in the centre cell.
- **Portrait 1080×1350** — 2 columns × 4 rows, title band across row 2.
- **Landscape 1920×1080** — 4 columns × 2 rows, title strip bottom-left.
- **One photo (square)** — solo layout: 6 photo panels + 2 drawn graphic
  panels (a giant "VI" over a sunset disc, and a night skyline), grades
  rotated sunset / neon / original across panels, one panel flipped.

White gutters, a white outer frame, and thin dark panel edges give the
comic-poster feel. The sun disc and skyline behind the title are shapes
drawn on canvas, not images.

## Privacy

Your photos are read on your own machine and **never leave it** — there is
no upload, no account, and no network request at all. The app is static
files under `app/` with no build step.

## Fonts

Anton (big caption), Bebas Neue (subtitle), and Archivo Black (header)
are bundled as `.woff2` files under `app/fonts/` and licensed under the
**SIL Open Font License 1.1**. See `app/OFL-LICENSES.txt` for attribution
and the license summary.

## Files

```
main.ts            hand-in plumbing (copies app/ + screenshots/, writes dossier.json)
app/
  index.html       UI + preview (classic scripts — works from file://)
  cover.js         panel layouts, grading, lettering, PNG export
  style.css        styles
  fonts/           Anton, Bebas Neue, Archivo Black (.woff2, OFL)
  OFL-LICENSES.txt font attributions
screenshots/      cover + app screenshots for the judges
```

Run the hand-in locally with:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see `LICENSE`. Fonts are under the SIL Open Font License 1.1
(see `app/OFL-LICENSES.txt`).
