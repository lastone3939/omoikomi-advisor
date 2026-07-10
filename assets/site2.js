/* world canvas 3D network + floating image planes + hero orbit cards */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canvas = document.getElementById("world-canvas");
  if (!canvas) return;
  var ctx = null;
  try { ctx = canvas.getContext("2d", { alpha: true }); } catch (e) { return; }
  if (!ctx) return;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;
  var mouse = { x: 0, y: 0 };
  var t0 = performance.now();

  function resize() {
    W = canvas.clientWidth || window.innerWidth;
    H = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  window.addEventListener("pointermove", function (e) {
    var r = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    mouse.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  }, { passive: true });

  /* Fibonacci sphere points */
  var N = window.innerWidth < 700 ? 110 : 220;
  var pts = [];
  var golden = Math.PI * (3 - Math.sqrt(5));
  for (var i = 0; i < N; i++) {
    var y = 1 - (i / (N - 1)) * 2;
    var radius = Math.sqrt(1 - y * y);
    var theta = golden * i;
    pts.push({
      x: Math.cos(theta) * radius,
      y: y,
      z: Math.sin(theta) * radius,
      c: i % 7 === 0 ? "#E8590C" : (i % 5 === 0 ? "#C9A227" : "rgba(27,34,51,0.35)")
    });
  }

  /* floating billboard planes (abstract) */
  var planes = [];
  for (var p = 0; p < 8; p++) {
    planes.push({
      x: (Math.random() - 0.5) * 2.2,
      y: (Math.random() - 0.5) * 1.4,
      z: (Math.random() - 0.5) * 2.2,
      w: 0.35 + Math.random() * 0.25,
      h: 0.22 + Math.random() * 0.12,
      spin: Math.random() * Math.PI * 2,
      speed: 0.15 + Math.random() * 0.25
    });
  }

  function rotY(p, a) {
    var c = Math.cos(a), s = Math.sin(a);
    return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
  }
  function rotX(p, a) {
    var c = Math.cos(a), s = Math.sin(a);
    return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
  }
  function project(p, scale) {
    var f = 2.6;
    var z = p.z + 3.4;
    var k = f / z;
    return {
      x: W * 0.58 + p.x * k * scale,
      y: H * 0.48 + p.y * k * scale,
      s: k,
      z: z
    };
  }

  function drawFrame(now) {
    var t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);

    /* soft orbs */
    var g1 = ctx.createRadialGradient(W * 0.75, H * 0.25, 0, W * 0.75, H * 0.25, Math.max(W, H) * 0.35);
    g1.addColorStop(0, "rgba(201,162,39,0.10)");
    g1.addColorStop(1, "rgba(201,162,39,0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);

    var ay = t * 0.22 + mouse.x * 0.35;
    var ax = 0.25 + mouse.y * 0.2;
    var scale = Math.min(W, H) * 0.42;
    var proj = [];

    for (var i = 0; i < pts.length; i++) {
      var q = rotY(pts[i], ay);
      q = rotX(q, ax);
      var pr = project(q, scale);
      pr.c = pts[i].c;
      proj.push(pr);
    }

    /* connections */
    ctx.lineWidth = 1;
    for (var a = 0; a < proj.length; a++) {
      for (var b = a + 1; b < proj.length; b++) {
        var dx = proj[a].x - proj[b].x;
        var dy = proj[a].y - proj[b].y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 95 * 95) {
          var alpha = (1 - Math.sqrt(d2) / 95) * 0.22;
          ctx.strokeStyle = "rgba(201,162,39," + alpha + ")";
          ctx.beginPath();
          ctx.moveTo(proj[a].x, proj[a].y);
          ctx.lineTo(proj[b].x, proj[b].y);
          ctx.stroke();
        }
      }
    }

    /* points */
    for (var j = 0; j < proj.length; j++) {
      var pt = proj[j];
      var r = Math.max(1.1, 2.6 * pt.s);
      ctx.beginPath();
      ctx.fillStyle = pt.c;
      ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    /* glass planes */
    for (var k = 0; k < planes.length; k++) {
      var pl = planes[k];
      var base = {
        x: pl.x + Math.sin(t * pl.speed + pl.spin) * 0.15,
        y: pl.y + Math.cos(t * pl.speed * 0.8 + pl.spin) * 0.1,
        z: pl.z + Math.sin(t * pl.speed * 0.6) * 0.2
      };
      var r1 = rotY(base, ay * 0.8);
      r1 = rotX(r1, ax * 0.7);
      var pp = project(r1, scale);
      var pw = pl.w * pp.s * scale * 0.55;
      var ph = pl.h * pp.s * scale * 0.55;
      ctx.save();
      ctx.translate(pp.x, pp.y);
      ctx.rotate(Math.sin(t * 0.3 + pl.spin) * 0.2);
      ctx.fillStyle = "rgba(255,255,255," + (0.08 + pp.s * 0.08) + ")";
      ctx.strokeStyle = "rgba(232,89,12," + (0.12 + pp.s * 0.15) + ")";
      ctx.lineWidth = 1.2;
      roundRect(ctx, -pw / 2, -ph / 2, pw, ph, 10);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    if (!reduce) requestAnimationFrame(drawFrame);
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  if (reduce) {
    drawFrame(performance.now());
  } else {
    requestAnimationFrame(drawFrame);
  }

  /* ---- hero orbit photo cards ---- */
  var orbit = document.getElementById("hero-orbit");
  var gallery = window.__OMO_GALLERY || [];
  var picks = [
    "eQsAOnrhE4A", "jSqQ27dDR3A", "MyVnNIgfBS8", "pOUrvKX-9Rs",
    "zNI76q0LMBI", "72ln-t90Y98", "u1Gz_kTbc9g", "gpnPgXXrPwk"
  ];
  if (orbit) {
    picks.forEach(function (id, idx) {
      var el = document.createElement("div");
      el.className = "orbit-card";
      el.innerHTML = '<img src="assets/yt_' + id + '.jpg" width="1280" height="720" alt="" loading="eager">';
      orbit.appendChild(el);
    });

    var cards = orbit.querySelectorAll(".orbit-card");
    var ox = 0, oy = 0;
    var stage = document.getElementById("hero-stage");
    if (stage && !reduce) {
      stage.addEventListener("pointermove", function (e) {
        var r = stage.getBoundingClientRect();
        ox = (e.clientX - r.left) / r.width - 0.5;
        oy = (e.clientY - r.top) / r.height - 0.5;
      });
    }

    function orbitTick(now) {
      var t = now / 1000;
      var n = cards.length;
      for (var i = 0; i < n; i++) {
        var a = t * 0.35 + (i / n) * Math.PI * 2;
        var radius = 34 + (i % 2) * 8;
        var x = 50 + Math.cos(a) * radius + ox * 10;
        var y = 48 + Math.sin(a * 0.9) * (radius * 0.42) + oy * 8;
        var z = Math.sin(a) * 40;
        var s = 0.78 + (z + 40) / 120;
        var rotY = Math.cos(a) * 28 + ox * 20;
        var rotX = -oy * 16 + Math.sin(a) * 8;
        cards[i].style.left = x + "%";
        cards[i].style.top = y + "%";
        cards[i].style.transform =
          "translate(-50%,-50%) translateZ(" + z + "px) rotateY(" + rotY + "deg) rotateX(" + rotX + "deg) scale(" + s + ")";
        cards[i].style.zIndex = String(Math.round(100 + z));
        cards[i].style.opacity = String(0.55 + (z + 40) / 160);
      }
      if (!reduce) requestAnimationFrame(orbitTick);
    }
    if (reduce) {
      cards.forEach(function (c, i) {
        c.style.left = (18 + i * 12) + "%";
        c.style.top = (20 + (i % 3) * 18) + "%";
        c.style.transform = "translate(-50%,-50%)";
      });
    } else {
      requestAnimationFrame(orbitTick);
    }
  }
})();
