// cover.js — Vice City Cover Maker renderer (classic script, no modules).
// Turns the user's own photos + a caption into multi-panel poster art in the
// style of GTA 6 posters: a comic-style panel grid around a bold centre
// title block, Vice City sunset / neon grading, thick condensed lettering.
// All art is the user's own photos plus shapes drawn on canvas — no Rockstar
// logo, artwork, or font. Fonts: Anton + Bebas Neue + Archivo Black,
// all SIL OFL, bundled under app/fonts/.
//
// Loaded as a classic <script src="cover.js"> so the app works from file://
// in desktop Chrome (ES modules are blocked from file:// by CORS).
// Exposes window.ViceCover = { SIZES, GRADES, LAYOUTS, layoutFor, loadImage,
// gradedCanvas, renderCover, exportPNG }.

(function (global) {
  'use strict';

  var SIZES = {
    '1080x1080': [1080, 1080],
    '1080x1350': [1080, 1350],
    '1920x1080': [1920, 1080],
  };

  var GRADES = {
    original: { label: 'Original', filter: 'saturate(1.05) contrast(1.03)' },
    sunset:   { label: 'Vice Sunset', filter: 'saturate(1.38) contrast(1.07) brightness(1.03)' },
    neon:     { label: 'Neon Night', filter: 'saturate(1.55) contrast(1.13) brightness(0.99) hue-rotate(-12deg)' },
  };

  // Layouts: cells in relative coords (0..1). type 'photo' | 'title' | 'graphic'.
  // photo picks from the photos array; fx/fy = focal point, zoom = crop zoom.
  var LAYOUTS = {
    // Square classic: 3x3 grid, centre cell is the title block.
    square: [
      { type: 'photo', x: 0.000, y: 0.000, w: 0.333, h: 0.333, photo: 0, fx: 0.50, fy: 0.30, zoom: 1.15 },
      { type: 'photo', x: 0.333, y: 0.000, w: 0.334, h: 0.333, photo: 1, fx: 0.50, fy: 0.45, zoom: 1.00 },
      { type: 'photo', x: 0.667, y: 0.000, w: 0.333, h: 0.333, photo: 2, fx: 0.50, fy: 0.55, zoom: 1.10 },
      { type: 'photo', x: 0.000, y: 0.333, w: 0.333, h: 0.334, photo: 2, fx: 0.25, fy: 0.40, zoom: 1.25 },
      { type: 'title', x: 0.333, y: 0.333, w: 0.334, h: 0.334 },
      { type: 'photo', x: 0.667, y: 0.333, w: 0.333, h: 0.334, photo: 0, fx: 0.65, fy: 0.55, zoom: 1.30 },
      { type: 'photo', x: 0.000, y: 0.667, w: 0.333, h: 0.333, photo: 1, fx: 0.30, fy: 0.60, zoom: 1.20 },
      { type: 'photo', x: 0.333, y: 0.667, w: 0.334, h: 0.333, photo: 2, fx: 0.70, fy: 0.35, zoom: 1.15 },
      { type: 'photo', x: 0.667, y: 0.667, w: 0.333, h: 0.333, photo: 0, fx: 0.50, fy: 0.70, zoom: 1.35 },
    ],
    // Portrait: 2 cols x 4 rows, title band across row 2.
    portrait: [
      { type: 'photo', x: 0.000, y: 0.000, w: 0.500, h: 0.250, photo: 0, fx: 0.50, fy: 0.30, zoom: 1.10 },
      { type: 'photo', x: 0.500, y: 0.000, w: 0.500, h: 0.250, photo: 1, fx: 0.50, fy: 0.45, zoom: 1.00 },
      { type: 'title', x: 0.000, y: 0.250, w: 1.000, h: 0.220 },
      { type: 'photo', x: 0.000, y: 0.470, w: 0.500, h: 0.265, photo: 2, fx: 0.50, fy: 0.50, zoom: 1.05 },
      { type: 'photo', x: 0.500, y: 0.470, w: 0.500, h: 0.265, photo: 0, fx: 0.60, fy: 0.55, zoom: 1.25 },
      { type: 'photo', x: 0.000, y: 0.735, w: 0.500, h: 0.265, photo: 1, fx: 0.35, fy: 0.55, zoom: 1.20 },
      { type: 'photo', x: 0.500, y: 0.735, w: 0.500, h: 0.265, photo: 2, fx: 0.65, fy: 0.40, zoom: 1.20 },
    ],
    // Landscape: 4 cols x 2 rows, title strip bottom-left across 2 cols.
    landscape: [
      { type: 'photo', x: 0.000, y: 0.000, w: 0.250, h: 0.500, photo: 0, fx: 0.50, fy: 0.30, zoom: 1.10 },
      { type: 'photo', x: 0.250, y: 0.000, w: 0.250, h: 0.500, photo: 1, fx: 0.50, fy: 0.45, zoom: 1.00 },
      { type: 'photo', x: 0.500, y: 0.000, w: 0.250, h: 0.500, photo: 2, fx: 0.50, fy: 0.50, zoom: 1.05 },
      { type: 'photo', x: 0.750, y: 0.000, w: 0.250, h: 0.500, photo: 0, fx: 0.60, fy: 0.55, zoom: 1.25 },
      { type: 'title', x: 0.000, y: 0.500, w: 0.500, h: 0.500 },
      { type: 'photo', x: 0.500, y: 0.500, w: 0.250, h: 0.500, photo: 1, fx: 0.35, fy: 0.55, zoom: 1.20 },
      { type: 'photo', x: 0.750, y: 0.500, w: 0.250, h: 0.500, photo: 2, fx: 0.65, fy: 0.40, zoom: 1.20 },
    ],
    // Solo variant of the square grid (1 photo): graphic cells at (2,0) and (0,2)
    // break the 8x repetition of a single face.
    squareSolo: [
      { type: 'photo', x: 0.000, y: 0.000, w: 0.333, h: 0.333, photo: 0, fx: 0.50, fy: 0.30, zoom: 1.15 },
      { type: 'photo', x: 0.333, y: 0.000, w: 0.334, h: 0.333, photo: 0, fx: 0.50, fy: 0.45, zoom: 1.60 },
      { type: 'graphic', kind: 'sun', x: 0.667, y: 0.000, w: 0.333, h: 0.333 },
      { type: 'photo', x: 0.000, y: 0.333, w: 0.333, h: 0.334, photo: 0, fx: 0.20, fy: 0.50, zoom: 1.90 },
      { type: 'title', x: 0.333, y: 0.333, w: 0.334, h: 0.334 },
      { type: 'photo', x: 0.667, y: 0.333, w: 0.333, h: 0.334, photo: 0, fx: 0.70, fy: 0.60, zoom: 1.50 },
      { type: 'graphic', kind: 'skyline', x: 0.000, y: 0.667, w: 0.333, h: 0.333 },
      { type: 'photo', x: 0.333, y: 0.667, w: 0.334, h: 0.333, photo: 0, fx: 0.50, fy: 0.75, zoom: 1.40 },
      { type: 'photo', x: 0.667, y: 0.667, w: 0.333, h: 0.333, photo: 0, fx: 0.50, fy: 0.25, zoom: 2.20 },
    ],
  };

  function layoutFor(sizeKey, photoCount) {
    if (sizeKey === '1080x1350') return LAYOUTS.portrait;
    if (sizeKey === '1920x1080') return LAYOUTS.landscape;
    // Solo-photo square: two drawn graphic cells break the 8x repetition.
    if ((photoCount || 3) < 2) return LAYOUTS.squareSolo;
    return LAYOUTS.square;
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('failed to load ' + src)); };
      img.src = src;
    });
  }

  // Grade one image into an offscreen canvas at the panel's pixel size.
  function gradedCanvas(img, w, h, gradeKey) {
    var c = document.createElement('canvas');
    c.width = Math.max(2, Math.round(w));
    c.height = Math.max(2, Math.round(h));
    var x = c.getContext('2d');
    var g = GRADES[gradeKey] || GRADES.original;
    x.filter = g.filter;
    x.drawImage(img, 0, 0, c.width, c.height);
    x.filter = 'none';
    if (gradeKey === 'sunset') {
      var grad = x.createLinearGradient(0, 0, c.width, c.height);
      grad.addColorStop(0, 'rgba(255,122,26,0.20)');
      grad.addColorStop(0.55, 'rgba(255,45,120,0.14)');
      grad.addColorStop(1, 'rgba(90,20,140,0.20)');
      x.globalCompositeOperation = 'soft-light';
      x.fillStyle = grad;
      x.fillRect(0, 0, c.width, c.height);
      x.globalCompositeOperation = 'source-over';
    } else if (gradeKey === 'neon') {
      var grad2 = x.createLinearGradient(0, 0, c.width, c.height);
      grad2.addColorStop(0, 'rgba(150,40,255,0.22)');
      grad2.addColorStop(0.5, 'rgba(255,45,150,0.10)');
      grad2.addColorStop(1, 'rgba(0,220,255,0.18)');
      x.globalCompositeOperation = 'overlay';
      x.fillStyle = grad2;
      x.fillRect(0, 0, c.width, c.height);
      x.globalCompositeOperation = 'source-over';
    }
    // Vignette (both grades; subtle on original).
    var v = x.createRadialGradient(
      c.width / 2, c.height / 2, Math.min(c.width, c.height) * 0.35,
      c.width / 2, c.height / 2, Math.max(c.width, c.height) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, gradeKey === 'original' ? 'rgba(0,0,0,0.10)' : 'rgba(10,0,30,0.22)');
    x.fillStyle = v;
    x.fillRect(0, 0, c.width, c.height);
    return c;
  }

  // Cover-fit draw of img into rect, centred on focal point (fx, fy 0..1), zoom >= 1.
  function drawCoverFit(ctx, img, rx, ry, rw, rh, fx, fy, zoom) {
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;
    var scale = Math.max(rw / iw, rh / ih) * zoom;
    var dw = iw * scale;
    var dh = ih * scale;
    var cx = rx + rw / 2 + (0.5 - fx) * (dw - rw);
    var cy = ry + rh / 2 + (0.5 - fy) * (dh - rh);
    ctx.save();
    ctx.beginPath();
    ctx.rect(rx, ry, rw, rh);
    ctx.clip();
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.restore();
  }

  function fitFont(ctx, text, fontFamily, maxW, startPx) {
    var px = startPx;
    ctx.font = px + 'px ' + fontFamily;
    while (px > 12 && ctx.measureText(text).width > maxW) {
      px -= 2;
      ctx.font = px + 'px ' + fontFamily;
    }
    return px;
  }

  // Drawn graphic panel (no photo, no Rockstar assets): 'sun' = giant VI numeral
  // over a sunset disc; 'skyline' = night skyline + stars. Used when photos are scarce.
  function drawGraphic(ctx, cell, W, H) {
    var px = cell.x * W, py = cell.y * H, pw = cell.w * W, ph = cell.h * H;
    if (cell.kind === 'sun') {
      var bg = ctx.createLinearGradient(px, py, px + pw, py + ph);
      bg.addColorStop(0, '#ff7a1a');
      bg.addColorStop(0.5, '#ff2d78');
      bg.addColorStop(1, '#7a1fd0');
      ctx.fillStyle = bg;
      ctx.fillRect(px, py, pw, ph);
      ctx.save();
      ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
      ctx.fillStyle = 'rgba(255,244,200,0.95)';
      ctx.beginPath();
      ctx.arc(px + pw * 0.5, py + ph * 0.42, ph * 0.26, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      var size = fitFont(ctx, 'VI', "'Anton', sans-serif", pw * 0.8, ph * 0.62);
      ctx.strokeStyle = '#16042b'; ctx.lineWidth = Math.max(2, size * 0.09);
      ctx.strokeText('VI', px + pw / 2, py + ph * 0.46);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('VI', px + pw / 2, py + ph * 0.46);
      var subSize = fitFont(ctx, 'EST. 2026', "'Bebas Neue', sans-serif", pw * 0.7, ph * 0.11);
      ctx.font = subSize + "px 'Bebas Neue', sans-serif";
      ctx.fillStyle = '#ffffff';
      ctx.fillText('EST. 2026', px + pw / 2, py + ph * 0.82);
      return;
    }
    // skyline
    var bg2 = ctx.createLinearGradient(px, py, px + pw, py + ph);
    bg2.addColorStop(0, '#1a0533');
    bg2.addColorStop(1, '#3d0a6e');
    ctx.fillStyle = bg2;
    ctx.fillRect(px, py, pw, ph);
    ctx.save();
    ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    var stars = [[0.15, 0.15], [0.35, 0.10], [0.55, 0.18], [0.75, 0.10], [0.88, 0.22], [0.25, 0.28], [0.65, 0.30]];
    stars.forEach(function (s) {
      ctx.beginPath();
      ctx.arc(px + pw * s[0], py + ph * s[1], Math.max(1, ph * 0.008), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath(); ctx.arc(px + pw * 0.72, py + ph * 0.26, ph * 0.09, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(10,2,25,0.85)';
    var blocks = [0.22, 0.34, 0.18, 0.42, 0.26, 0.38, 0.20, 0.30];
    var bx = px; var bw = pw / blocks.length;
    blocks.forEach(function (bh) {
      var hgt = ph * bh;
      ctx.fillRect(bx + 1, py + ph - hgt, bw - 2, hgt);
      bx += bw;
    });
    ctx.restore();
  }

  function drawTitle(ctx, cell, W, H, caption, sub) {
    var x = cell.x, y = cell.y, w = cell.w, h = cell.h;
    var px = x * W, py = y * H, pw = w * W, ph = h * H;
    // Sunset gradient backdrop.
    var bg = ctx.createLinearGradient(px, py, px + pw, py + ph);
    bg.addColorStop(0, '#ff7a1a');
    bg.addColorStop(0.45, '#ff2d78');
    bg.addColorStop(1, '#5b14b8');
    ctx.fillStyle = bg;
    ctx.fillRect(px, py, pw, ph);
    // Sun disc + skyline silhouette behind the text (drawn shapes, not images).
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();
    var sunR = ph * 0.30;
    var sun = ctx.createRadialGradient(
      px + pw * 0.5, py + ph * 0.46, sunR * 0.1,
      px + pw * 0.5, py + ph * 0.46, sunR);
    sun.addColorStop(0, 'rgba(255,244,200,0.95)');
    sun.addColorStop(1, 'rgba(255,244,200,0)');
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(px + pw * 0.5, py + ph * 0.46, sunR, 0, Math.PI * 2);
    ctx.fill();
    // Skyline: dark building blocks along the bottom edge.
    ctx.fillStyle = 'rgba(22,4,43,0.30)';
    var blocks = [0.10, 0.16, 0.08, 0.20, 0.12, 0.18, 0.09, 0.14, 0.11, 0.17];
    var bx = px;
    var bw = pw / blocks.length;
    blocks.forEach(function (bh) {
      var hgt = ph * bh;
      ctx.fillRect(bx + 1, py + ph - hgt, bw - 2, hgt);
      bx += bw;
    });
    ctx.restore();
    // Caption: huge condensed caps, white with dark outline + warm gradient fill.
    var pad = pw * 0.06;
    var size = fitFont(ctx, caption, "'Anton', sans-serif", pw - pad * 2, ph * 0.42);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var cx = px + pw / 2;
    var cy = py + ph * (sub ? 0.42 : 0.52);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#16042b';
    ctx.lineWidth = Math.max(2, size * 0.10);
    ctx.strokeText(caption, cx, cy);
    var fg = ctx.createLinearGradient(cx, cy - size * 0.5, cx, cy + size * 0.5);
    fg.addColorStop(0, '#ffffff');
    fg.addColorStop(1, '#ffe9a8');
    ctx.fillStyle = fg;
    ctx.fillText(caption, cx, cy);
    if (sub) {
      var subSize = fitFont(ctx, sub, "'Bebas Neue', sans-serif", pw - pad * 2, ph * 0.13);
      ctx.font = subSize + "px 'Bebas Neue', sans-serif";
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(22,4,43,0.85)';
      ctx.lineWidth = Math.max(1, subSize * 0.08);
      var sy = py + ph * 0.78;
      ctx.strokeText(sub, cx, sy);
      ctx.fillText(sub, cx, sy);
    }
  }

  // Main render. opts: { photos, caption, sub, grade, sizeKey,
  //   heroTweaks: {fx, fy, zoom} (first photo cell),
  //   panelTweaks: [{fx, fy, zoom, flip}] per layout cell (Shuffle fills this) }
  function renderCover(canvas, opts) {
    var dims = SIZES[opts.sizeKey] || SIZES['1080x1080'];
    var W = dims[0], H = dims[1];
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');
    // Guard: never render a blank title.
    var caption = (opts.caption || '').trim() ? opts.caption : 'VICE CITY';
    var sub = opts.sub || '';
    var photos = opts.photos && opts.photos.length ? opts.photos : [];
    var layout = layoutFor(opts.sizeKey, photos.length);
    var gutter = Math.round(W * 0.008); // white gutters between panels
    var border = Math.round(W * 0.012); // white outer frame
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    layout.forEach(function (cell, cellIdx) {
      var px = border + cell.x * (W - border * 2);
      var py = border + cell.y * (H - border * 2);
      var pw = cell.w * (W - border * 2) - gutter;
      var ph = cell.h * (H - border * 2) - gutter;
      if (cell.type === 'title') {
        drawTitle(ctx, { x: px / W, y: py / H, w: pw / W, h: ph / H }, W, H, caption, sub);
        return;
      }
      if (cell.type === 'graphic') {
        drawGraphic(ctx, { x: px / W, y: py / H, w: pw / W, h: ph / H, kind: cell.kind }, W, H);
        ctx.strokeStyle = 'rgba(22,4,43,0.55)';
        ctx.lineWidth = Math.max(1, W * 0.002);
        ctx.strokeRect(px, py, pw, ph);
        return;
      }
      var img = photos.length ? photos[cell.photo % photos.length] : null;
      if (!img) {
        ctx.fillStyle = '#2a1245';
        ctx.fillRect(px, py, pw, ph);
        return;
      }
      // Solo photo: cycle grades across panels so the same face reads differently.
      var cellGrade = cell.grade || opts.grade;
      var flip = !!cell.flip;
      if (photos.length === 1) {
        cellGrade = ['sunset', 'neon', 'original'][cellIdx % 3];
        flip = cellIdx % 3 === 2;
      }
      // Grade at panel resolution (cap at 900px for preview speed; full res on export
      // is the same path — the graded panel is drawn cover-fit into the cell).
      var gw = Math.min(pw, 900), gh = Math.min(ph, 900);
      var graded = gradedCanvas(img, gw, gh, cellGrade);
      if (flip) {
        var fc = document.createElement('canvas');
        fc.width = graded.width; fc.height = graded.height;
        var fxc = fc.getContext('2d');
        fxc.translate(fc.width, 0); fxc.scale(-1, 1);
        fxc.drawImage(graded, 0, 0);
        graded = fc;
      }
      var fx = cell.fx, fy = cell.fy, zoom = cell.zoom;
      var tweak = opts.panelTweaks && opts.panelTweaks[cellIdx];
      if (tweak) {
        if (typeof tweak.fx === 'number') fx = tweak.fx;
        if (typeof tweak.fy === 'number') fy = tweak.fy;
        if (typeof tweak.zoom === 'number') zoom = tweak.zoom;
      }
      if (opts.heroTweaks && cell.photo === 0 && layout.indexOf(cell) === 0) {
        fx = opts.heroTweaks.fx; fy = opts.heroTweaks.fy; zoom = opts.heroTweaks.zoom;
      }
      drawCoverFit(ctx, graded, px, py, pw, ph, fx, fy, zoom);
      // Comic panel edge.
      ctx.strokeStyle = 'rgba(22,4,43,0.55)';
      ctx.lineWidth = Math.max(1, W * 0.002);
      ctx.strokeRect(px, py, pw, ph);
    });
    return canvas;
  }

  function exportPNG(opts) {
    var c = document.createElement('canvas');
    renderCover(c, opts);
    return new Promise(function (resolve) {
      c.toBlob(function (b) { resolve(b); }, 'image/png');
    });
  }

  global.ViceCover = {
    SIZES: SIZES,
    GRADES: GRADES,
    LAYOUTS: LAYOUTS,
    layoutFor: layoutFor,
    loadImage: loadImage,
    gradedCanvas: gradedCanvas,
    renderCover: renderCover,
    exportPNG: exportPNG,
  };
})(window);
