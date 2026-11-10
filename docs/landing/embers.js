/* The ember field: runes rise like sparks from a forge, in three depths.
 * Near runes are larger and faster; far ones dim and slow. The pointer is a
 * lamp: runes close to it brighten and drift aside. Scrolling moves near
 * runes more than far ones. The field calms below the hero so reading is
 * quiet, and flares briefly when the page seals something (xrune:flare). */
(function () {
  var cv = document.getElementById('embers');
  if (!cv || !cv.getContext) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ctx = cv.getContext('2d');
  var NAMES = Object.keys(XRUNE.RUNES);
  var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  var W = 0, H = 0, parts = [], bokeh = [], sprites = {}, flares = [];
  var mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999, on: false };
  var lastScroll = window.scrollY, scrollDelta = 0, calm = 1;

  function rand(a, b) { return a + Math.random() * (b - a); }

  /* one pre-rendered sprite per rune and size bucket, glow baked in */
  function sprite(name, px) {
    var key = name + '|' + px;
    if (sprites[key]) return sprites[key];
    var pad = Math.ceil(px * 0.7), w = Math.ceil(px * 0.75) + pad * 2, h = Math.ceil(px * 1.1) + pad * 2;
    var c = document.createElement('canvas');
    c.width = Math.ceil(w * DPR); c.height = Math.ceil(h * DPR);
    var g = c.getContext('2d');
    g.scale(DPR, DPR);
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = 'rgba(240, 206, 128, 1)';
    g.shadowColor = 'rgba(255, 190, 90, .9)';
    g.shadowBlur = px * 0.45;
    g.lineWidth = Math.max(1, px * 0.085);
    XRUNE.trace(g, name, w / 2, h / 2, px);
    g.stroke();
    g.shadowBlur = 0;
    g.strokeStyle = 'rgba(255, 244, 214, .9)';
    g.lineWidth = Math.max(.6, px * 0.04);
    g.stroke();
    return (sprites[key] = { c: c, w: w, h: h });
  }

  /* a soft disc, rendered once per radius and colour */
  function disc(r, col) {
    var key = 'disc|' + r + '|' + col;
    if (sprites[key]) return sprites[key];
    var s = r * 2, c = document.createElement('canvas');
    c.width = c.height = s;
    var g = c.getContext('2d'), gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, 'rgba(' + col + ',1)');
    gr.addColorStop(1, 'rgba(' + col + ',0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, s, s);
    return (sprites[key] = c);
  }
  var WARM = '230, 180, 100', COOL = '120, 150, 200', LAMP = '240, 196, 120';

  function spawn(p, initial) {
    var z = Math.pow(Math.random(), 1.6) * 0.75 + 0.25;
    p.z = z;
    p.size = Math.round(6 + z * 16);
    p.name = NAMES[(Math.random() * NAMES.length) | 0];
    p.x = rand(-20, W + 20);
    p.y = initial ? rand(0, H) : H + rand(20, 120);
    p.vy = -(10 + z * 30) * rand(.8, 1.2);
    p.amp = rand(6, 26) * z;
    p.freq = rand(.15, .45);
    p.phase = rand(0, 6.28);
    p.rot = rand(-.5, .5);
    p.vr = rand(-.25, .25);
    p.base = 0.05 + z * 0.24;
    p.flare = 0;
    p.ox = 0;
    return p;
  }

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.ceil(W * DPR); cv.height = Math.ceil(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var n = Math.max(22, Math.min(78, Math.round(W * H / 21000)));
    while (parts.length < n) parts.push(spawn({}, true));
    parts.length = n;
    bokeh = [];
    for (var i = 0; i < 7; i++) {
      bokeh.push({ x: rand(0, W), y: rand(0, H), r: Math.round(rand(70, 190)), a: rand(.02, .045), vx: rand(-5, 5), vy: rand(-4, 2), col: Math.random() < .3 ? COOL : WARM });
    }
  }

  function draw(dt, t) {
    ctx.clearRect(0, 0, W, H);

    // the field calms as the reader leaves the hero
    var target = Math.max(0.38, 1 - window.scrollY / (H * 1.2));
    calm += (target - calm) * Math.min(1, dt * 2);

    // slow bokeh discs: candle haze, a few cool ones for depth
    for (var b = 0; b < bokeh.length; b++) {
      var o = bokeh[b];
      o.x += o.vx * dt; o.y += o.vy * dt;
      if (o.x < -o.r) o.x = W + o.r; if (o.x > W + o.r) o.x = -o.r;
      if (o.y < -o.r) o.y = H + o.r; if (o.y > H + o.r) o.y = -o.r;
      ctx.globalAlpha = o.a * calm;
      ctx.drawImage(disc(o.r, o.col), o.x - o.r, o.y - o.r);
    }

    // the lamp
    mouse.sx += (mouse.x - mouse.sx) * Math.min(1, dt * 6);
    mouse.sy += (mouse.y - mouse.sy) * Math.min(1, dt * 6);
    if (mouse.on) {
      ctx.globalAlpha = 0.07;
      ctx.drawImage(disc(280, LAMP), mouse.sx - 280, mouse.sy - 280);
    }
    ctx.globalAlpha = 1;

    // flares decay
    for (var f = flares.length - 1; f >= 0; f--) { flares[f].life -= dt; if (flares[f].life <= 0) flares.splice(f, 1); }

    var sd = scrollDelta; scrollDelta = 0;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      p.y += p.vy * dt - sd * p.z * 0.35;
      p.phase += p.freq * dt * 6.28;
      p.rot += p.vr * dt;
      var x = p.x + Math.sin(p.phase) * p.amp + p.ox;
      if (p.y < -60) { spawn(p, false); continue; }
      if (p.y > H + 140) { p.y = -50; }

      var glow = 1;
      if (mouse.on) {
        var dx = x - mouse.sx, dy = p.y - mouse.sy, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 200) {
          var k = 1 - d / 200;
          glow += k * 2.4;
          p.ox += (dx / (d || 1)) * k * k * 70 * dt;
        }
      }
      p.ox *= Math.pow(0.5, dt);
      for (var q = 0; q < flares.length; q++) {
        var fl = flares[q], fx = x - fl.x, fy = p.y - fl.y, fd = Math.sqrt(fx * fx + fy * fy);
        if (fd < fl.r) glow += (1 - fd / fl.r) * 2.2 * (fl.life / fl.max);
      }
      if (Math.random() < dt * 0.03) p.flare = 1;
      p.flare = Math.max(0, p.flare - dt * 0.8);

      // fade in from the bottom edge and out near the top
      var edge = Math.min(1, (H - p.y + 60) / 160, (p.y + 60) / 220);
      var a = p.base * edge * (calm * 0.85 + 0.15) * glow + p.flare * 0.35;
      if (a <= 0.004) continue;
      var s = sprite(p.name, p.size);
      ctx.globalAlpha = Math.min(1, a);
      ctx.save();
      ctx.translate(x, p.y);
      ctx.rotate(p.rot);
      ctx.drawImage(s.c, -s.w / 2, -s.h / 2, s.w, s.h);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  resize();
  window.addEventListener('resize', function () {
    clearTimeout(resize.t);
    resize.t = setTimeout(function () { resize(); if (reduce) draw(0, 0); }, 120);
  });
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (!mouse.on) { mouse.sx = mouse.x; mouse.sy = mouse.y; mouse.on = true; }
  }, { passive: true });
  document.addEventListener('pointerleave', function () { mouse.on = false; });
  window.addEventListener('scroll', function () {
    var y = window.scrollY; scrollDelta += y - lastScroll; lastScroll = y;
  }, { passive: true });
  window.addEventListener('xrune:flare', function (e) {
    var d = e.detail || {};
    flares.push({ x: d.x || W / 2, y: d.y || H / 2, r: d.r || 260, life: 1.4, max: 1.4 });
  });

  // decoration only: the first frame waits for the browser, never the page load
  if (reduce) { requestAnimationFrame(function () { draw(0, 0); }); return; }
  var last = 0;
  requestAnimationFrame(function frame(now) {
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
    if (!document.hidden) draw(dt, now / 1000);
    requestAnimationFrame(frame);
  });
})();
