/* VICE CITY Cover Art Studio — app.js
   Classic script, no modules, no network. Semua render di canvas lokal.
   Artwork latar (skyline, palem, matahari) digambar prosedural — bukan aset game. */

(function () {
  "use strict";

  /* ---------------- state ---------------- */
  var state = {
    title: "VICE CITY",
    subtitle: "Welcome to the neon coast.",
    badge: "EST. 2026 \u2022 SUNSET EDITION",
    layout: "grid",
    grade: "sunset",
    saturation: 120,
    contrast: 110,
    brightness: 100,
    titleScale: 100,
    grain: true,
    frame: true,
    previewSize: "1920x1080",
    selectedPanel: 0,
    photos: [] /* {img, name} */
  };

  /* Per-panel crop state, dibuat ulang saat layout berubah. */
  var panels = [];
  var sceneCache = {}; /* grade -> canvas */

  /* ---------------- grade presets ---------------- */
  var GRADES = {
    sunset: {
      skyTop: "#2b1055", skyMid: "#ff2e88", skyLow: "#ff8a3d",
      sunCore: "#ffe259", sunEdge: "#ff7518",
      sea: "#3b1d5e", seaLine: "#ff8a3d",
      tintA: "rgba(255,46,136,0.20)", tintB: "rgba(255,138,61,0.12)",
      titleFrom: "#ffe259", titleTo: "#ff2e88",
      accent: "#ffd166", panelLine: "#ffffff"
    },
    neon: {
      skyTop: "#05001a", skyMid: "#1b0f4b", skyLow: "#7b2ff7",
      sunCore: "#2de2ff", sunEdge: "#ff2e88",
      sea: "#0a0630", seaLine: "#2de2ff",
      tintA: "rgba(45,226,255,0.16)", tintB: "rgba(255,46,136,0.18)",
      titleFrom: "#2de2ff", titleTo: "#ff2e88",
      accent: "#2de2ff", panelLine: "#eafcff"
    },
    pastel: {
      skyTop: "#7c6bb5", skyMid: "#f7a8c4", skyLow: "#ffd6a5",
      sunCore: "#fff3d6", sunEdge: "#ff9ebb",
      sea: "#5b7d8a", seaLine: "#ffd6a5",
      tintA: "rgba(255,158,187,0.16)", tintB: "rgba(125,211,252,0.12)",
      titleFrom: "#ffffff", titleTo: "#ff9ebb",
      accent: "#ffd166", panelLine: "#ffffff"
    }
  };

  /* ---------------- helpers ---------------- */
  function $(id) { return document.getElementById(id); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  /* Pseudo-random deterministik supaya scene stabil antar render. */
  function seededRandom(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function makeCanvas(w, h) {
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    return c;
  }

  /* ---------------- procedural sunset scene ---------------- */
  function drawPalm(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.strokeStyle = color; ctx.fillStyle = color;
    ctx.lineWidth = 7; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(14, -46, 30, -78); ctx.stroke();
    ctx.lineWidth = 5;
    var i, a;
    for (i = 0; i < 7; i++) {
      a = -Math.PI * (0.08 + i * 0.13);
      ctx.beginPath(); ctx.moveTo(30, -78);
      ctx.quadraticCurveTo(30 + Math.cos(a) * 52, -78 + Math.sin(a) * 34 - 16, 30 + Math.cos(a) * 74, -78 + Math.sin(a) * 44 + 14);
      ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(30, -78, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawSkyline(ctx, w, horizonY, rand, color, litColor) {
    var x = -10;
    ctx.fillStyle = color;
    while (x < w + 10) {
      var bw = 46 + rand() * 90;
      var bh = 60 + rand() * 190;
      ctx.fillRect(x, horizonY - bh, bw, bh);
      if (rand() > 0.45) { /* antena */
        ctx.fillRect(x + bw / 2 - 2, horizonY - bh - 26, 4, 26);
        ctx.fillStyle = litColor;
        ctx.beginPath(); ctx.arc(x + bw / 2, horizonY - bh - 30, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = color;
      }
      var wy, wx;
      ctx.fillStyle = litColor;
      for (wy = horizonY - bh + 12; wy < horizonY - 14; wy += 22) {
        for (wx = x + 10; wx < x + bw - 10; wx += 18) {
          if (rand() > 0.62) ctx.fillRect(wx, wy, 7, 10);
        }
      }
      ctx.fillStyle = color;
      x += bw + 4 + rand() * 14;
    }
  }

  function buildSampleScene(gradeName) {
    if (sceneCache[gradeName]) return sceneCache[gradeName];
    var g = GRADES[gradeName];
    var W = 1200, H = 800;
    var c = makeCanvas(W, H);
    var ctx = c.getContext("2d");
    var rand = seededRandom(20261121);

    /* langit */
    var sky = ctx.createLinearGradient(0, 0, 0, H * 0.62);
    sky.addColorStop(0, g.skyTop);
    sky.addColorStop(0.55, g.skyMid);
    sky.addColorStop(1, g.skyLow);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H * 0.62 + 2);

    /* matahari bergaris (synthwave sun) */
    var sunX = W * 0.62, sunY = H * 0.42, sunR = 150;
    var sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
    sunGrad.addColorStop(0, g.sunCore);
    sunGrad.addColorStop(1, g.sunEdge);
    ctx.save();
    ctx.beginPath(); ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = sunGrad;
    ctx.fillRect(sunX - sunR, sunY - sunR, sunR * 2, sunR * 2);
    ctx.fillStyle = g.skyLow;
    var sy = sunY + 6, gap = 7;
    while (sy < sunY + sunR) { ctx.fillRect(sunX - sunR, sy, sunR * 2, gap); sy += gap + 12; gap += 3; }
    ctx.restore();

    /* burung */
    ctx.strokeStyle = "rgba(20,8,40,0.85)"; ctx.lineWidth = 4; ctx.lineCap = "round";
    var b;
    for (b = 0; b < 5; b++) {
      var bx = 90 + rand() * 420, by = 70 + rand() * 130, bs = 10 + rand() * 12;
      ctx.beginPath(); ctx.moveTo(bx - bs, by); ctx.quadraticCurveTo(bx - bs / 2, by - bs * 0.7, bx, by);
      ctx.quadraticCurveTo(bx + bs / 2, by - bs * 0.7, bx + bs, by); ctx.stroke();
    }

    /* skyline jauh + dekat */
    drawSkyline(ctx, W, H * 0.62, seededRandom(77), "rgba(43,16,85,0.85)", "rgba(255,209,102,0.9)");
    drawSkyline(ctx, W, H * 0.66, seededRandom(1234), "#1c0b33", "#ffd166");

    /* laut / jalan basah */
    var sea = ctx.createLinearGradient(0, H * 0.66, 0, H);
    sea.addColorStop(0, g.sea); sea.addColorStop(1, "#0d0618");
    ctx.fillStyle = sea;
    ctx.fillRect(0, H * 0.66, W, H * 0.34);
    var i;
    ctx.fillStyle = g.seaLine;
    for (i = 0; i < 26; i++) {
      var ry = H * 0.68 + rand() * H * 0.28;
      var rw = 40 + rand() * 260;
      ctx.globalAlpha = 0.10 + rand() * 0.25;
      ctx.fillRect(W / 2 - rw / 2 + (rand() - 0.5) * 300, ry, rw, 3);
    }
    ctx.globalAlpha = 1;

    /* palem di tepi */
    drawPalm(ctx, 70, H * 0.99, 1.5, "#12081f");
    drawPalm(ctx, W - 90, H * 0.99, 1.25, "#12081f");
    drawPalm(ctx, W - 210, H * 0.99, 0.9, "#1c0b33");

    sceneCache[gradeName] = c;
    return c;
  }

  /* ---------------- layouts ---------------- */
  function layoutPanels(layout, W, H) {
    var titleH = Math.round(H * 0.205);
    var areaH = H - titleH;
    var g = Math.max(6, Math.round(Math.min(W, H) * 0.012)); /* gap */
    var pad = state.frame ? Math.round(Math.min(W, H) * 0.022) : 0;
    var x0 = pad, y0 = pad, w = W - pad * 2, h = areaH - pad;
    var rects = [];
    if (layout === "grid") {
      var cw = (w - g) / 2, ch = (h - g) / 2;
      rects = [
        { x: x0, y: y0, w: cw, h: ch },
        { x: x0 + cw + g, y: y0, w: cw, h: ch },
        { x: x0, y: y0 + ch + g, w: cw, h: ch },
        { x: x0 + cw + g, y: y0 + ch + g, w: cw, h: ch }
      ];
    } else if (layout === "hero") {
      var heroW = Math.round(w * 0.60);
      var sideW = w - heroW - g;
      var sh = (h - g * 2) / 3;
      rects = [
        { x: x0, y: y0, w: heroW, h: h },
        { x: x0 + heroW + g, y: y0, w: sideW, h: sh },
        { x: x0 + heroW + g, y: y0 + sh + g, w: sideW, h: sh },
        { x: x0 + heroW + g, y: y0 + (sh + g) * 2, w: sideW, h: sh }
      ];
    } else if (layout === "trio") {
      var tw = (w - g * 2) / 3;
      rects = [
        { x: x0, y: y0, w: tw, h: h },
        { x: x0 + tw + g, y: y0, w: tw, h: h },
        { x: x0 + (tw + g) * 2, y: y0, w: tw, h: h }
      ];
    } else { /* single */
      rects = [{ x: x0, y: y0, w: w, h: h }];
    }
    return { rects: rects, titleY: areaH, titleH: titleH, gap: g, pad: pad };
  }

  function resetPanels(count) {
    panels = [];
    var i;
    for (i = 0; i < count; i++) {
      panels.push({ photo: -1, zoom: 100, ox: 0, oy: 0, sceneCrop: i % 4 });
    }
    state.selectedPanel = 0;
  }

  /* ---------------- drawing ---------------- */
  function drawImageCover(ctx, img, r, zoom, ox, oy) {
    var iw = img.width, ih = img.height;
    var scale = Math.max(r.w / iw, r.h / ih) * (zoom / 100);
    var dw = iw * scale, dh = ih * scale;
    var dx = r.x + (r.w - dw) / 2 + (ox / 100) * r.w * 0.4;
    var dy = r.y + (r.h - dh) / 2 + (oy / 100) * r.h * 0.4;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function drawPanel(ctx, r, p, grade, forExport, index) {
    ctx.save();
    ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
    ctx.filter = "saturate(" + state.saturation + "%) contrast(" + state.contrast +
      "%) brightness(" + state.brightness + "%)";
    if (p.photo >= 0 && state.photos[p.photo]) {
      drawImageCover(ctx, state.photos[p.photo].img, r, p.zoom, p.ox, p.oy);
    } else {
      var scene = buildSampleScene(state.grade);
      /* tiap panel mengambil potongan scene yang berbeda */
      var crops = [
        { x: 0, y: 0, w: 0.62, h: 0.62 },
        { x: 0.38, y: 0, w: 0.62, h: 0.62 },
        { x: 0, y: 0.38, w: 0.62, h: 0.62 },
        { x: 0.38, y: 0.38, w: 0.62, h: 0.62 }
      ];
      var cr = crops[p.sceneCrop % 4];
      var sx = cr.x * scene.width, sy = cr.y * scene.height;
      var sw = cr.w * scene.width, sh = cr.h * scene.height;
      var scale = Math.max(r.w / sw, r.h / sh) * (p.zoom / 100);
      var dw = sw * scale, dh = sh * scale;
      ctx.drawImage(scene, sx, sy, sw, sh,
        r.x + (r.w - dw) / 2 + (p.ox / 100) * r.w * 0.3,
        r.y + (r.h - dh) / 2 + (p.oy / 100) * r.h * 0.3, dw, dh);
    }
    ctx.filter = "none";

    /* grading: sapuan warna sunset/neon di atas panel */
    var tint = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
    tint.addColorStop(0, grade.tintA);
    tint.addColorStop(1, grade.tintB);
    ctx.fillStyle = tint;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    /* bayangan bawah supaya panel terasa dalam */
    var shade = ctx.createLinearGradient(0, r.y + r.h * 0.55, 0, r.y + r.h);
    shade.addColorStop(0, "rgba(0,0,0,0)");
    shade.addColorStop(1, "rgba(10,4,24,0.38)");
    ctx.fillStyle = shade;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.restore();

    /* bingkai panel */
    ctx.save();
    ctx.strokeStyle = grade.panelLine;
    ctx.lineWidth = Math.max(2, Math.round(Math.min(r.w, r.h) * 0.008));
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = "rgba(10,4,24,0.55)";
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
    if (!forExport && index === state.selectedPanel) {
      ctx.strokeStyle = "#ffd166";
      ctx.lineWidth = 4;
      ctx.setLineDash([14, 8]);
      ctx.strokeRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawTitleBlock(ctx, W, H, lay, grade) {
    var y = lay.titleY, h = lay.titleH;
    var pad = lay.pad;
    /* pita latar judul: gradien gelap ke transparan */
    var bg = ctx.createLinearGradient(0, y, 0, H);
    bg.addColorStop(0, "rgba(13,6,24,0.0)");
    bg.addColorStop(0.35, "rgba(13,6,24,0.88)");
    bg.addColorStop(1, "#0d0618");
    ctx.fillStyle = bg;
    ctx.fillRect(0, y, W, H - y);

    var cx = W / 2;
    var titleSize = Math.round(H * 0.115 * (state.titleScale / 100));
    var fontStack = "\"Arial Black\", Impact, \"Franklin Gothic Heavy\", sans-serif";

    /* lencana kecil di atas judul */
    if (state.badge.trim()) {
      ctx.save();
      ctx.font = "700 " + Math.round(H * 0.016) + "px \"Segoe UI\", system-ui, sans-serif";
      var bw = ctx.measureText(state.badge).width + H * 0.03;
      var bh = Math.round(H * 0.032);
      var by = y + h * 0.10;
      ctx.fillStyle = grade.accent;
      roundRect(ctx, cx - bw / 2, by, bw, bh, bh / 2);
      ctx.fill();
      ctx.fillStyle = "#14082a";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(state.badge.toUpperCase(), cx, by + bh / 2 + 1);
      ctx.restore();
    }

    /* judul besar: isi gradien + outline + bayangan neon */
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = titleSize + "px " + fontStack;
    var ty = y + h * 0.56;
    var grad = ctx.createLinearGradient(0, ty - titleSize * 0.55, 0, ty + titleSize * 0.55);
    grad.addColorStop(0, grade.titleFrom);
    grad.addColorStop(0.55, "#ffffff");
    grad.addColorStop(1, grade.titleTo);
    ctx.shadowColor = grade.titleTo;
    ctx.shadowBlur = Math.round(H * 0.02);
    ctx.lineWidth = Math.max(3, Math.round(titleSize * 0.07));
    ctx.strokeStyle = "rgba(20,8,42,0.9)";
    ctx.strokeText(state.title.toUpperCase(), cx, ty);
    ctx.shadowBlur = 0;
    ctx.fillStyle = grad;
    ctx.fillText(state.title.toUpperCase(), cx, ty);
    ctx.restore();

    /* caption */
    if (state.subtitle.trim()) {
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      var subSize = Math.round(H * 0.024);
      ctx.font = "italic 700 " + subSize + "px Georgia, \"Times New Roman\", serif";
      ctx.fillStyle = "rgba(246,236,255,0.92)";
      ctx.fillText(state.subtitle, cx, y + h * 0.88);
      ctx.restore();
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawGrain(ctx, W, H) {
    var rand = seededRandom(99);
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = "#ffffff";
    var i;
    for (i = 0; i < Math.round(W * H / 2600); i++) {
      ctx.fillRect(rand() * W, rand() * H, 1.6, 1.6);
    }
    ctx.restore();
    var vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(8,2,18,0.42)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  function renderCover(ctx, W, H, forExport) {
    var grade = GRADES[state.grade];
    /* latar luar bingkai */
    ctx.fillStyle = "#0d0618";
    ctx.fillRect(0, 0, W, H);
    var lay = layoutPanels(state.layout, W, H);
    if (panels.length !== lay.rects.length) resetPanels(lay.rects.length);
    var i;
    for (i = 0; i < lay.rects.length; i++) drawPanel(ctx, lay.rects[i], panels[i], grade, forExport, i);
    drawTitleBlock(ctx, W, H, lay, grade);
    if (state.grain) drawGrain(ctx, W, H);
    if (state.frame) {
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = Math.max(3, Math.round(Math.min(W, H) * 0.006));
      ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
      ctx.restore();
    }
    return lay;
  }

  /* ---------------- preview ---------------- */
  function previewDims() {
    var parts = state.previewSize.split("x");
    return { w: parseInt(parts[0], 10), h: parseInt(parts[1], 10) };
  }

  function renderPreview() {
    var canvas = $("previewCanvas");
    var d = previewDims();
    var scale = 960 / d.w;
    canvas.width = 960;
    canvas.height = Math.round(d.h * scale);
    var ctx = canvas.getContext("2d");
    renderCover(ctx, canvas.width, canvas.height, false);
    $("stageInfo").textContent = state.photos.length > 0
      ? state.photos.length + " foto dimuat \u2022 " + state.layout + " \u2022 " + state.grade + " \u2022 pratinjau " + d.w + "\u00d7" + d.h
      : "Scene contoh aktif \u2022 tambah fotomu untuk mengganti panel \u2022 pratinjau " + d.w + "\u00d7" + d.h;
  }

  /* ---------------- export ---------------- */
  function exportCover(w, h, done) {
    var canvas = makeCanvas(w, h);
    var ctx = canvas.getContext("2d");
    try {
      renderCover(ctx, w, h, true);
    } catch (err) {
      $("exportStatus").textContent = "Gagal render " + w + "\u00d7" + h + ": " + err.message;
      if (done) done(err);
      return;
    }
    var name = "vice-city-cover-" + w + "x" + h + ".png";
    canvas.toBlob(function (blob) {
      if (!blob) {
        $("exportStatus").textContent = "Gagal membuat PNG " + w + "\u00d7" + h + ".";
        if (done) done(new Error("toBlob null"));
        return;
      }
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      $("exportStatus").textContent = "Tersimpan: " + name + " (" + blob.size + " byte).";
      if (done) done(null, { w: w, h: h, bytes: blob.size });
    }, "image/png");
  }

  function exportAll() {
    var sizes = [[1080, 1080], [1080, 1350], [1920, 1080]];
    var i = 0;
    $("exportStatus").textContent = "Mengekspor 3 ukuran\u2026";
    (function next() {
      if (i >= sizes.length) { $("exportStatus").textContent = "Selesai: 3 PNG tersimpan."; return; }
      var s = sizes[i++];
      setTimeout(function () { exportCover(s[0], s[1], function () { next(); }); }, 250);
    })();
  }

  /* ---------------- photos ---------------- */
  function loadPhotoFiles(files) {
    var list = Array.prototype.slice.call(files || []);
    list.forEach(function (file) {
      if (!file.type || file.type.indexOf("image/") !== 0) return;
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          state.photos.push({ img: img, name: file.name });
          refreshPhotoUI();
          renderPreview();
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function refreshPhotoUI() {
    var thumbs = $("photoThumbs");
    thumbs.innerHTML = "";
    var scene = document.createElement("div");
    scene.className = "thumb scene" + (state.photos.length === 0 ? " active" : "");
    scene.textContent = "SCENE";
    scene.title = "Scene contoh prosedural";
    thumbs.appendChild(scene);
    state.photos.forEach(function (p, idx) {
      var t = document.createElement("img");
      t.className = "thumb";
      t.src = p.img.src;
      t.alt = p.name;
      t.title = p.name;
      t.addEventListener("click", function () {
        if (panels[state.selectedPanel]) panels[state.selectedPanel].photo = idx;
        refreshPanelSelect();
        renderPreview();
      });
      thumbs.appendChild(t);
    });
    refreshPanelSelect();
  }

  function refreshPanelSelect() {
    var sel = $("panelPhoto");
    var current = panels[state.selectedPanel] ? panels[state.selectedPanel].photo : -1;
    sel.innerHTML = "";
    var optScene = document.createElement("option");
    optScene.value = "-1";
    optScene.textContent = "Scene contoh (prosedural)";
    sel.appendChild(optScene);
    state.photos.forEach(function (p, idx) {
      var o = document.createElement("option");
      o.value = String(idx);
      o.textContent = (idx + 1) + ". " + p.name;
      sel.appendChild(o);
    });
    sel.value = String(current);
    $("panelName").textContent = "Panel " + (state.selectedPanel + 1) + " dari " + panels.length;
  }

  function shufflePanels() {
    var i;
    for (i = 0; i < panels.length; i++) {
      if (state.photos.length > 0) panels[i].photo = Math.floor(Math.random() * state.photos.length);
      panels[i].sceneCrop = Math.floor(Math.random() * 4);
      panels[i].zoom = 100 + Math.floor(Math.random() * 40);
    }
    syncPanelControls();
    renderPreview();
  }

  /* ---------------- controls wiring ---------------- */
  function syncPanelControls() {
    var p = panels[state.selectedPanel];
    if (!p) return;
    $("zoomRange").value = p.zoom;
    $("zoomOut").textContent = p.zoom + "%";
    $("offsetXRange").value = p.ox;
    $("offsetXOut").textContent = p.ox;
    $("offsetYRange").value = p.oy;
    $("offsetYOut").textContent = p.oy;
    refreshPanelSelect();
  }

  function bindControls() {
    $("photoInput").addEventListener("change", function (e) {
      loadPhotoFiles(e.target.files);
      e.target.value = "";
    });
    $("sampleBtn").addEventListener("click", function () {
      var i;
      for (i = 0; i < panels.length; i++) panels[i].photo = -1;
      syncPanelControls();
      renderPreview();
    });
    $("clearPhotosBtn").addEventListener("click", function () {
      state.photos = [];
      var i;
      for (i = 0; i < panels.length; i++) panels[i].photo = -1;
      refreshPhotoUI();
      renderPreview();
    });
    $("layoutSelect").addEventListener("change", function (e) {
      state.layout = e.target.value;
      resetPanels(layoutPanels(state.layout, 100, 100).rects.length);
      syncPanelControls();
      renderPreview();
    });
    $("panelPhoto").addEventListener("change", function (e) {
      if (panels[state.selectedPanel]) panels[state.selectedPanel].photo = parseInt(e.target.value, 10);
      renderPreview();
    });
    $("zoomRange").addEventListener("input", function (e) {
      if (panels[state.selectedPanel]) panels[state.selectedPanel].zoom = parseInt(e.target.value, 10);
      $("zoomOut").textContent = e.target.value + "%";
      renderPreview();
    });
    $("offsetXRange").addEventListener("input", function (e) {
      if (panels[state.selectedPanel]) panels[state.selectedPanel].ox = parseInt(e.target.value, 10);
      $("offsetXOut").textContent = e.target.value;
      renderPreview();
    });
    $("offsetYRange").addEventListener("input", function (e) {
      if (panels[state.selectedPanel]) panels[state.selectedPanel].oy = parseInt(e.target.value, 10);
      $("offsetYOut").textContent = e.target.value;
      renderPreview();
    });
    $("titleInput").addEventListener("input", function (e) { state.title = e.target.value || "VICE CITY"; renderPreview(); });
    $("subtitleInput").addEventListener("input", function (e) { state.subtitle = e.target.value; renderPreview(); });
    $("badgeInput").addEventListener("input", function (e) { state.badge = e.target.value; renderPreview(); });
    $("titleSizeRange").addEventListener("input", function (e) {
      state.titleScale = parseInt(e.target.value, 10);
      $("titleSizeOut").textContent = e.target.value + "%";
      renderPreview();
    });
    var gradeBtns = document.querySelectorAll(".grade-btn");
    gradeBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        gradeBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        state.grade = btn.getAttribute("data-grade");
        renderPreview();
      });
    });
    $("saturationRange").addEventListener("input", function (e) {
      state.saturation = parseInt(e.target.value, 10);
      $("saturationOut").textContent = e.target.value + "%";
      renderPreview();
    });
    $("contrastRange").addEventListener("input", function (e) {
      state.contrast = parseInt(e.target.value, 10);
      $("contrastOut").textContent = e.target.value + "%";
      renderPreview();
    });
    $("brightnessRange").addEventListener("input", function (e) {
      state.brightness = parseInt(e.target.value, 10);
      $("brightnessOut").textContent = e.target.value + "%";
      renderPreview();
    });
    $("grainToggle").addEventListener("change", function (e) { state.grain = e.target.checked; renderPreview(); });
    $("frameToggle").addEventListener("change", function (e) { state.frame = e.target.checked; renderPreview(); });
    $("previewSize").addEventListener("change", function (e) { state.previewSize = e.target.value; renderPreview(); });
    $("exportSquare").addEventListener("click", function () { exportCover(1080, 1080); });
    $("exportPortrait").addEventListener("click", function () { exportCover(1080, 1350); });
    $("exportWide").addEventListener("click", function () { exportCover(1920, 1080); });
    $("exportAllBtn").addEventListener("click", exportAll);
    $("shuffleBtn").addEventListener("click", shufflePanels);

    /* drag & drop + klik panel */
    var zone = $("dropZone");
    zone.addEventListener("dragover", function (e) { e.preventDefault(); zone.classList.add("dragging"); });
    zone.addEventListener("dragleave", function () { zone.classList.remove("dragging"); });
    zone.addEventListener("drop", function (e) {
      e.preventDefault(); zone.classList.remove("dragging");
      loadPhotoFiles(e.dataTransfer.files);
    });
    $("previewCanvas").addEventListener("click", function (e) {
      var canvas = $("previewCanvas");
      var rect = canvas.getBoundingClientRect();
      var px = (e.clientX - rect.left) * (canvas.width / rect.width);
      var py = (e.clientY - rect.top) * (canvas.height / rect.height);
      var lay = layoutPanels(state.layout, canvas.width, canvas.height);
      var i;
      for (i = 0; i < lay.rects.length; i++) {
        var r = lay.rects[i];
        if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
          state.selectedPanel = i;
          syncPanelControls();
          renderPreview();
          return;
        }
      }
    });
  }

  /* ---------------- self-test (?selftest=1) ---------------- */
  function runSelfTest() {
    var sizes = [[1080, 1080], [1080, 1350], [1920, 1080]];
    var lines = [];
    var errors = [];
    var i;
    for (i = 0; i < sizes.length; i++) {
      var w = sizes[i][0], h = sizes[i][1];
      try {
        var c = makeCanvas(w, h);
        var ctx = c.getContext("2d");
        renderCover(ctx, w, h, true);
        if (c.width === w && c.height === h) {
          lines.push("OK " + w + "x" + h);
        } else {
          errors.push("DIM " + w + "x" + h + " got " + c.width + "x" + c.height);
        }
      } catch (err) {
        errors.push("ERR " + w + "x" + h + ": " + err.message);
      }
    }
    var result = errors.length === 0
      ? "SELFTEST PASS: " + lines.join(" | ")
      : "SELFTEST FAIL: " + lines.join(" | ") + " || " + errors.join(" | ");
    var el = $("selftest-result");
    el.textContent = result;
    document.title = result;
  }

  /* ---------------- boot ---------------- */
  function boot() {
    resetPanels(4);
    bindControls();
    refreshPhotoUI();
    syncPanelControls();
    renderPreview();
    if (window.location.search.indexOf("selftest=1") !== -1) runSelfTest();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
