/* 30秒フォーカス・チャレンジ — face-in-ring camera game (on-device) */
(function () {
  "use strict";

  var video = document.getElementById("lens-video");
  var canvas = document.getElementById("lens-canvas");
  var toggle = document.getElementById("lens-toggle");
  var view = document.getElementById("lens-view") || document.querySelector(".lens-view");
  var ring = document.getElementById("focus-ring");
  var verdict = document.getElementById("lens-verdict");
  var timerEl = document.getElementById("focus-timer");
  var comboEl = document.getElementById("focus-combo");
  var barFocus = document.getElementById("bar-focus");
  var barCall = document.getElementById("bar-call");
  var barList = document.getElementById("bar-list");
  var mFocus = document.getElementById("m-focus");
  var mCall = document.getElementById("m-call");
  var mList = document.getElementById("m-list");
  var resultBox = document.getElementById("focus-result");
  var finalScore = document.getElementById("final-score");
  var finalRank = document.getElementById("final-rank");
  if (!video || !canvas || !toggle) return;

  var ctx = null;
  try { ctx = canvas.getContext("2d", { willReadFrequently: true }); }
  catch (e) { try { ctx = canvas.getContext("2d"); } catch (e2) { return; } }
  if (!ctx) return;

  var stream = null;
  var running = false;
  var playing = false;
  var timeLeft = 30;
  var lockedMs = 0;
  var combo = 0;
  var bestCombo = 0;
  var callPts = 0;
  var listPts = 0;
  var score = 0;
  var lastTs = 0;
  var raf = 0;

  function setBars() {
    var focusPct = Math.min(100, Math.round((lockedMs / 30000) * 100));
    if (barFocus) barFocus.style.width = focusPct + "%";
    if (mFocus) mFocus.textContent = focusPct + "%";
    if (barCall) barCall.style.width = Math.min(100, callPts) + "%";
    if (mCall) mCall.textContent = Math.round(callPts);
    if (barList) barList.style.width = Math.min(100, listPts) + "%";
    if (mList) mList.textContent = Math.round(listPts);
    if (timerEl) timerEl.textContent = String(Math.max(0, Math.ceil(timeLeft)));
    if (comboEl) comboEl.textContent = "COMBO " + combo;
  }

  function rankFor(s) {
    if (s >= 2400) return "S — 効果までやり切れるタイプ。顧問向き。";
    if (s >= 1600) return "A — 集中力高い。AIコール実装が刺さる。";
    if (s >= 900) return "B — まずリスト戦略から並走がおすすめ。";
    if (s >= 400) return "C — 伴走前提で、仕組み化から入ろう。";
    return "D — まずは30秒、もう一回いける。";
  }

  function endGame() {
    playing = false;
    score = Math.round(lockedMs / 10 + bestCombo * 40 + callPts * 3 + listPts * 3);
    if (resultBox) resultBox.hidden = false;
    if (finalScore) finalScore.textContent = String(score);
    if (finalRank) finalRank.textContent = rankFor(score);
    if (verdict) {
      verdict.textContent =
        "集中 " + Math.round(lockedMs / 1000) + "秒 / 最大コンボ " + bestCombo +
        "。AIコール " + Math.round(callPts) + "・リスト " + Math.round(listPts) +
        "。効果が出るまでやり続ける力のデモです。";
    }
    if (toggle) toggle.textContent = "もう一回 START";
  }

  function sampleBrightCenter() {
    var vw = video.videoWidth, vh = video.videoHeight;
    if (!vw) return null;
    canvas.width = vw;
    canvas.height = vh;
    ctx.drawImage(video, 0, 0, vw, vh);
    var step = Math.max(10, Math.floor(vw / 40));
    var data = ctx.getImageData(0, 0, vw, vh).data;
    var sx = 0, sy = 0, w = 0;
    for (var y = 0; y < vh; y += step) {
      for (var x = 0; x < vw; x += step) {
        var i = (y * vw + x) * 4;
        var lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        if (lum > 120) {
          sx += x * lum;
          sy += y * lum;
          w += lum;
        }
      }
    }
    if (w <= 0) return null;
    return { x: sx / w, y: sy / w, vw: vw, vh: vh };
  }

  function drawHud(cx, cy, inside) {
    var vw = canvas.width, vh = canvas.height;
    ctx.clearRect(0, 0, vw, vh);
    // dim outside
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(0, 0, vw, vh);
    // reticle cross
    if (cx != null) {
      ctx.strokeStyle = inside ? "rgba(6,199,85,0.9)" : "rgba(232,89,12,0.85)";
      ctx.lineWidth = Math.max(2, vw * 0.004);
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(vw, vh) * 0.035, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 24, cy); ctx.lineTo(cx + 24, cy);
      ctx.moveTo(cx, cy - 24); ctx.lineTo(cx, cy + 24);
      ctx.stroke();
    }
  }

  function loop(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    var dt = Math.min(50, ts - lastTs);
    lastTs = ts;

    var pt = sampleBrightCenter();
    var inside = false;
    if (pt) {
      // mirror x because video is scaleX(-1)
      var nx = 1 - pt.x / pt.vw;
      var ny = pt.y / pt.vh;
      var dx = nx - 0.5;
      var dy = ny - 0.48;
      var dist = Math.sqrt(dx * dx + dy * dy);
      inside = dist < 0.16;
      // canvas coords (mirrored draw on overlay matches video element CSS mirror)
      var cx = pt.x, cy = pt.y;
      drawHud(cx, cy, inside);
      if (ring) ring.classList.toggle("is-locked", inside);
    } else {
      drawHud(null, null, false);
      if (ring) ring.classList.remove("is-locked");
    }

    if (playing) {
      timeLeft -= dt / 1000;
      if (inside) {
        lockedMs += dt;
        combo += 1;
        if (combo > bestCombo) bestCombo = combo;
        callPts = Math.min(100, callPts + dt * 0.0045);
        listPts = Math.min(100, listPts + dt * 0.004);
      } else {
        combo = 0;
        callPts = Math.max(0, callPts - dt * 0.0015);
        listPts = Math.max(0, listPts - dt * 0.0012);
      }
      setBars();
      if (timeLeft <= 0) {
        timeLeft = 0;
        setBars();
        endGame();
      }
    }

    raf = requestAnimationFrame(loop);
  }

  async function startCam() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      video.srcObject = stream;
      await video.play();
      running = true;
      playing = true;
      timeLeft = 30;
      lockedMs = 0;
      combo = 0;
      bestCombo = 0;
      callPts = 0;
      listPts = 0;
      score = 0;
      lastTs = 0;
      if (resultBox) resultBox.hidden = true;
      video.classList.add("is-on");
      if (view) view.classList.add("is-live");
      toggle.textContent = "STOP";
      if (verdict) verdict.textContent = "中央の円に顔を入れてキープ！外れるとコンボが途切れます。";
      setBars();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    } catch (err) {
      if (verdict) verdict.textContent = "カメラを起動できませんでした。権限を許可するか、別ブラウザで試してください。";
      toggle.textContent = "START（カメラON）";
      running = false;
      playing = false;
    }
  }

  function stopCam() {
    playing = false;
    running = false;
    cancelAnimationFrame(raf);
    if (stream) {
      stream.getTracks().forEach(function (t) { t.stop(); });
      stream = null;
    }
    video.srcObject = null;
    video.classList.remove("is-on");
    if (view) view.classList.remove("is-live");
    toggle.textContent = "START（カメラON）";
    try { ctx.clearRect(0, 0, canvas.width, canvas.height); } catch (e) {}
  }

  toggle.addEventListener("click", function () {
    if (running) stopCam();
    else startCam();
  });
  window.addEventListener("pagehide", stopCam);
  setBars();
})();
