// Vice City Cover Maker — cover renderer (classic script, no modules).
// Turns the user's own photos into a multi-panel GTA-style poster cover:
// comic grid, bold lettering, Vice City sunset / neon grading, PNG export.
// All artwork is the user's photos plus shapes drawn here — no Rockstar
// logo, artwork or fonts. Fonts: Anton + Bebas Neue + Archivo Black (OFL).

(function (global) {
  'use strict';

  var SIZES = {
    '1080x1080': [1080, 1080],
    '1080x1350': [1080, 1350],
    '1920x1080': [1920, 1080],
  };

  // Grade: canvas filter + tint overlay + vignette strength.
  var GRADES = {
    original: {
      label: 'Original',
      filter: 'saturate(1.05) contrast(1.03)',
      overlay: null,
      overlayMode: 'soft-light',
      vignette: 0.10,
    },
    sunset: {
      label: 'Vice Sunset',
      filter: 'saturate(1.38) contrast(1.07) brightness(1.03)',
      overlay: [
        [0.0, 'rgba(255,122,26,0.20)'],
        [0.55, 'rgba(255,45,120,0.14)'],
        [1.0, 'rgba(90,20,140,0.20)'],
      ],
      overlayMode: 'soft-light',
      vignette: 0.22,
    },
    neon: {
      label: 'Neon Night',
      filter: 'saturate(1.55) contrast(1.13) brightness(0.99) hue-rotate(-12deg)',
      overlay: [
        [0.0, 'rgba(150,40,255,0.22)'],
        [0.5, 'rgba(255,45,150,0.10)'],
        [1.0, 'rgba(0,220,255,0.18)'],
      ],
      overlayMode: 'overlay',
      vignette: 0.26,
    },
  };

  var INK = '#16042b'; // deep Vice City blue, panel edges + title outline
  var PINK = '#ff2d78';
  var PURPLE = '#5b14b8';
  var ORANGE = '#ff7a1a';

  // Layouts: cells in relative coords (0..1). type 'photo' | 'title' | 'graphic'.
  // photo: index into the photos array; fx/fy focal point, zoom crop zoom.
  function photoCell(x, y, w, h, photo, fx, fy, zoom) {
    return { type: 'photo', x: x, y: y, w: w, h: h, photo: photo, fx: fx, fy: fy, zoom: zoom };
  }

  var LAYOUTS = {
    square: [
      photoCell(0.000, 0.000, 0.333, 0.333, 0, 0.50, 0.30, 1.15),
      photoCell(0.333, 0.000, 0.334, 0.333, 1, 0.50, 0.45, 1.00),
      photoCell(0.667, 0.000, 0.333, 0.333, 2, 0.50, 0.55, 1.10),
      photoCell(0.000, 0.333, 0.333, 0.334, 2, 0.25, 0.40, 1.25),
      { type: 'title', x: 0.333, y: 0.333, w: 0.334, h: 0.334 },
      photoCell(0.667, 0.333, 0.333, 0.334, 0, 0.65, 0.55, 1.30),
      photoCell(0.000, 0.667, 0.333, 0.333, 1, 0.30, 0.60, 1.20),
      photoCell(0.333, 0.667, 0.334, 0.333, 2, 0.70, 0.35, 1.15),
      photoCell(0.667, 0.667, 0.333, 0.333, 0, 0.50, 0.70, 1.35),
    ],
    // One photo: 6 photo cells + 2 drawn graphic cells so the cover is not
    // the same face 8 times.
    squareSolo: [
      photoCell(0.000, 0.000, 0.333, 0.333, 0, 0.50, 0.30, 1.15),
      photoCell(0.333, 0.000, 0.334, 0.333, 0, 0.50, 0.45, 1.60),
      { type: 'graphic', kind: 'sun', x: 0.667, y: 0.000, w: 0.333, h: 0.333 },
      photoCell(0.000, 0.333, 0.333, 0.334, 0, 0.20, 0.50, 1.90),
      { type: 'title', x: 0.333, y: 0.333, w: 0.334, h: 0.334 },
      photoCell(0.667, 0.333, 0.333, 0.334, 0, 0.70, 0.60, 1.50),
      { type: 'graphic', kind: 'skyline', x: 0.000, y: 0.667, w: 0.333, h: 0.333 },
      photoCell(0.333, 0.667, 0.334, 0.333, 0, 0.50, 0.75, 1.40),
      photoCell(0.667, 0.667, 0.333, 0.333, 0, 0.50, 0.25, 2.20),
    ],
    portrait: [
      photoCell(0.000, 0.000, 0.500, 0.250, 0, 0.50, 0.30, 1.10),
      photoCell(0.500, 0.000, 0.500, 0.250, 1, 0.50, 0.45, 1.00),
      { type: 'title', x: 0.000, y: 0.250, w: 1.000, h: 0.220 },
      photoCell(0.000, 0.470, 0.500, 0.265, 2, 0.50, 0.50, 1.05),
      photoCell(0.500, 0.470, 0.500, 0.265, 0, 0.60, 0.55, 1.25),
      photoCell(0.000, 0.735, 0.500, 0.265, 1, 0.35, 0.55, 1.20),
      photoCell(0.500, 0.735, 0.500, 0.265, 2, 0.65, 0.40, 1.20),
    ],
    landscape: [
      photoCell(0.000, 0.000, 0.250, 0.500, 0, 0.50, 0.30, 1.10),
      photoCell(0.250, 0.000, 0.250, 0.500, 1, 0.50, 0.45, 1.00),
      photoCell(0.500, 0.000, 0.250, 0.500, 2, 0.50, 0.50, 1.05),
      photoCell(0.750, 0.000, 0.250, 0.500, 0, 0.60, 0.55, 1.25),
      { type: 'title', x: 0.000, y: 0.500, w: 0.500, h: 0.500 },
      photoCell(0.500, 0.500, 0.250, 0.500, 1, 0.35, 0.55, 1.20),
      photoCell(0.750, 0.500, 0.250, 0.500, 2, 0.65, 0.40, 1.20),
    ],
  };

  function layoutFor(sizeKey, photoCount) {
    if (sizeKey === '1080x1350') return LAYOUTS.portrait;
    if (sizeKey === '1920x1080') return LAYOUTS.landscape;
    if ((photoCount || 0) < 2) return LAYOUTS.squareSolo;
    return LAYOUTS.square;
  }

  // Pixel rects for a layout: shared by renderCover and the preview hit test.
  function cellRects(sizeKey, photoCount, W, H) {
    var layout = layoutFor(sizeKey, photoCount);
    var gutter = Math.round(W * 0.008);
    var border = Math.round(W * 0.012);
    var innerW = W - border * 2;
    var innerH = H - border * 2;
    return layout.map(function (cell) {
      return {
        cell: cell,
        x: border + cell.x * innerW,
        y: border + cell.y * innerH,
        w: cell.w * innerW - gutter,
        h: cell.h * innerH - gutter,
      };
    });
  }

  // Which layout cell (index) holds point (px, py) in a W x H cover, or -1.
  function cellAt(sizeKey, photoCount, px, py, W, H) {
    var rects = cellRects(sizeKey, photoCount, W, H);
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
    }
    return -1;
  }

  // Cover-fit crop of img into a w x h offscreen canvas, centred on the
  // focal point (fx, fy 0..1), zoom >= 1, optionally mirrored.
  function cropToPanel(img, w, h, fx, fy, zoom, flip) {
    var c = document.createElement('canvas');
    c.width = Math.max(2, Math.round(w));
    c.height = Math.max(2, Math.round(h));
    var x = c.getContext('2d');
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;
    var scale = Math.max(c.width / iw, c.height / ih) * zoom;
    var dw = iw * scale;
    var dh = ih * scale;
    var cx = c.width / 2 + (0.5 - fx) * (dw - c.width);
    var cy = c.height / 2 + (0.5 - fy) * (dh - c.height);
    if (flip) {
      x.translate(c.width, 0);
      x.scale(-1, 1);
      x.drawImage(img, c.width - (cx + dw / 2), cy - dh / 2, dw, dh);
    } else {
      x.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
    }
    return c;
  }

  // Shrink the font until the text fits maxW (never below 12px).
  function fitFont(ctx, text, family, maxW, startPx) {
    var px = startPx;
    ctx.font = px + 'px ' + family;
    while (px > 12 && ctx.measureText(text).width > maxW) {
      px -= 2;
      ctx.font = px + 'px ' + family;
    }
    return px;
  }

  function panelEdge(ctx, r, W) {
    ctx.strokeStyle = 'rgba(22,4,43,0.55)';
    ctx.lineWidth = Math.max(1, W * 0.002);
    ctx.strokeRect(r.x, r.y, r.w, r.h);
  }

  function tintOverlay(ctx, r, grade) {
    if (!grade.overlay) return;
    var g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
    grade.overlay.forEach(function (stop) { g.addColorStop(stop[0], stop[1]); });
    ctx.globalCompositeOperation = grade.overlayMode;
    ctx.fillStyle = g;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.globalCompositeOperation = 'source-over';
  }

  function vignette(ctx, r, strength) {
    var v = ctx.createRadialGradient(
      r.x + r.w / 2, r.y + r.h / 2, Math.min(r.w, r.h) * 0.35,
      r.x + r.w / 2, r.y + r.h / 2, Math.max(r.w, r.h) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(10,0,30,' + strength + ')');
    ctx.fillStyle = v;
    ctx.fillRect(r.x, r.y, r.w, r.h);
  }

  function drawPhotoCell(ctx, r, img, gradeKey, tweak, W) {
    var grade = GRADES[gradeKey] || GRADES.original;
    var cropped = cropToPanel(img, r.w, r.h, tweak.fx, tweak.fy, tweak.zoom, !!tweak.flip);
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    ctx.filter = grade.filter;
    ctx.drawImage(cropped, r.x, r.y, r.w, r.h);
    ctx.filter = 'none';
    tintOverlay(ctx, r, grade);
    vignette(ctx, r, grade.vignette);
    ctx.restore();
    panelEdge(ctx, r, W);
  }

  function drawTitle(ctx, r, caption, sub) {
    var bg = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
    bg.addColorStop(0, ORANGE);
    bg.addColorStop(0.45, PINK);
    bg.addColorStop(1, PURPLE);
    ctx.fillStyle = bg;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    // Sun glow behind the letters.
    var sunR = r.h * 0.30;
    var sun = ctx.createRadialGradient(
      r.x + r.w * 0.5, r.y + r.h * 0.46, sunR * 0.1,
      r.x + r.w * 0.5, r.y + r.h * 0.46, sunR);
    sun.addColorStop(0, 'rgba(255,244,200,0.95)');
    sun.addColorStop(1, 'rgba(255,244,200,0)');
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(r.x + r.w * 0.5, r.y + r.h * 0.46, sunR, 0, Math.PI * 2);
    ctx.fill();
    // Skyline silhouette along the bottom edge.
    ctx.fillStyle = 'rgba(22,4,43,0.30)';
    var blocks = [0.10, 0.16, 0.08, 0.20, 0.12, 0.18, 0.09, 0.14, 0.11, 0.17];
    var bw = r.w / blocks.length;
    var bx = r.x;
    blocks.forEach(function (bh) {
      var hgt = r.h * bh;
      ctx.fillRect(bx + 1, r.y + r.h - hgt, bw - 2, hgt);
      bx += bw;
    });
    ctx.restore();
    // Caption: huge condensed caps, white with a dark outline.
    var pad = r.w * 0.06;
    var size = fitFont(ctx, caption, "'Anton', sans-serif", r.w - pad * 2, r.h * 0.42);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    var cx = r.x + r.w / 2;
    var cy = r.y + r.h * (sub ? 0.42 : 0.52);
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(2, size * 0.10);
    ctx.strokeText(caption, cx, cy);
    var fg = ctx.createLinearGradient(cx, cy - size * 0.5, cx, cy + size * 0.5);
    fg.addColorStop(0, '#ffffff');
    fg.addColorStop(1, '#ffe9a8');
    ctx.fillStyle = fg;
    ctx.fillText(caption, cx, cy);
    if (sub) {
      var subSize = fitFont(ctx, sub, "'Bebas Neue', sans-serif", r.w - pad * 2, r.h * 0.13);
      ctx.font = subSize + "px 'Bebas Neue', sans-serif";
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(22,4,43,0.85)';
      ctx.lineWidth = Math.max(1, subSize * 0.08);
      var sy = r.y + r.h * 0.78;
      ctx.strokeText(sub, cx, sy);
      ctx.fillText(sub, cx, sy);
    }
  }

  // Drawn graphic panel (no photo, no Rockstar assets).
  function drawGraphic(ctx, r, kind) {
    if (kind === 'sun') {
      var bg = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
      bg.addColorStop(0, ORANGE);
      bg.addColorStop(0.5, PINK);
      bg.addColorStop(1, '#7a1fd0');
      ctx.fillStyle = bg;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.save();
      ctx.beginPath();
      ctx.rect(r.x, r.y, r.w, r.h);
      ctx.clip();
      ctx.fillStyle = 'rgba(255,244,200,0.95)';
      ctx.beginPath();
      ctx.arc(r.x + r.w * 0.5, r.y + r.h * 0.42, r.h * 0.26, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      var size = fitFont(ctx, 'VI', "'Anton', sans-serif", r.w * 0.8, r.h * 0.62);
      ctx.strokeStyle = INK;
      ctx.lineWidth = Math.max(2, size * 0.09);
      ctx.strokeText('VI', r.x + r.w / 2, r.y + r.h * 0.46);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('VI', r.x + r.w / 2, r.y + r.h * 0.46);
      var subSize = fitFont(ctx, 'EST. 2026', "'Bebas Neue', sans-serif", r.w * 0.7, r.h * 0.11);
      ctx.font = subSize + "px 'Bebas Neue', sans-serif";
      ctx.fillStyle = '#ffffff';
      ctx.fillText('EST. 2026', r.x + r.w / 2, r.y + r.h * 0.82);
      return;
    }
    // 'skyline': night sky, stars, moon, building blocks.
    var night = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
    night.addColorStop(0, '#1a0533');
    night.addColorStop(1, '#3d0a6e');
    ctx.fillStyle = night;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    var stars = [[0.15, 0.15], [0.35, 0.10], [0.55, 0.18], [0.75, 0.10], [0.88, 0.22], [0.25, 0.28], [0.65, 0.30]];
    stars.forEach(function (s) {
      ctx.beginPath();
      ctx.arc(r.x + r.w * s[0], r.y + r.h * s[1], Math.max(1, r.h * 0.008), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(r.x + r.w * 0.72, r.y + r.h * 0.26, r.h * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(10,2,25,0.85)';
    var blocks = [0.22, 0.34, 0.18, 0.42, 0.26, 0.38, 0.20, 0.30];
    var bw = r.w / blocks.length;
    var bx = r.x;
    blocks.forEach(function (bh) {
      var hgt = r.h * bh;
      ctx.fillRect(bx + 1, r.y + r.h - hgt, bw - 2, hgt);
      bx += bw;
    });
    ctx.restore();
  }

  // Main render. opts: { photos, caption, sub, grade, sizeKey, tweaks }
  // tweaks: array indexed by layout position: { fx, fy, zoom, flip }.
  function renderCover(canvas, opts) {
    var size = SIZES[opts.sizeKey] || SIZES['1080x1080'];
    var W = size[0];
    var H = size[1];
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');
    // Guard: never render a blank title.
    var caption = (opts.caption || '').trim() ? opts.caption : 'VICE CITY';
    var sub = opts.sub || '';
    var photos = opts.photos && opts.photos.length ? opts.photos : [];
    var rects = cellRects(opts.sizeKey, photos.length, W, H);
    var solo = photos.length === 1;
    var soloGrades = ['sunset', 'neon', 'original'];
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    rects.forEach(function (r, i) {
      var cell = r.cell;
      if (cell.type === 'title') {
        drawTitle(ctx, r, caption, sub);
        return;
      }
      if (cell.type === 'graphic') {
        drawGraphic(ctx, r, cell.kind);
        panelEdge(ctx, r, W);
        return;
      }
      var img = photos.length ? photos[cell.photo % photos.length] : null;
      if (!img) {
        ctx.fillStyle = '#2a1245';
        ctx.fillRect(r.x, r.y, r.w, r.h);
        panelEdge(ctx, r, W);
        return;
      }
      // One photo: rotate the grade across panels and mirror one panel,
      // so the same face reads differently in every cell.
      var cellGrade = opts.grade || 'sunset';
      var autoFlip = false;
      if (solo) {
        cellGrade = soloGrades[i % 3];
        autoFlip = i % 3 === 2;
      }
      var tweak = (opts.tweaks && opts.tweaks[i]) || {};
      var fx = tweak.fx !== undefined ? tweak.fx : cell.fx;
      var fy = tweak.fy !== undefined ? tweak.fy : cell.fy;
      var zoom = tweak.zoom !== undefined ? tweak.zoom : cell.zoom;
      // User flip XORs with the solo-mode auto-flip: flipping a panel the
      // solo layout already mirrors brings it back to normal.
      var flip = (!!tweak.flip) !== autoFlip;
      drawPhotoCell(ctx, r, img, cellGrade, { fx: fx, fy: fy, zoom: zoom, flip: flip }, W);
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
    layoutFor: layoutFor,
    cellRects: cellRects,
    cellAt: cellAt,
    renderCover: renderCover,
    exportPNG: exportPNG,
  };
})(window);
