/* nav / reveal / counters / tilt / marquee / cinema / photowall / cursor / magnetic */
(function () {
  "use strict";

  var reduce = false;
  try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  var isTouch = false;
  try { isTouch = matchMedia("(hover: none), (pointer: coarse)").matches; } catch (e) {}

  /* ---- gallery data (all local assets) ---- */
  var GALLERY = [["-L-J8DqwMZk", "AI予想に100万"], ["04PHLFx8nYc", "総集編30分"], ["72ln-t90Y98", "AIコール TELEMO"], ["Akzv7BblMzk", "AIでなんでもつくれる？"], ["AqcEeAHJo8c", "バカラは人生"], ["Bx300Ta7a8E", "朝礼公開 その2"], ["C_ujFPtS0pA", "1日Vlog"], ["CiSVtr20PMg", "AIコールってなあに？"], ["E2KvTtptb7Y", "優勝1億を狙う"], ["EgH5b_ea6U8", "本当にやめます"], ["Gn0Sm-N9wIc", "WIN5キャリー"], ["GvPydKl2Qp0", "暇を極めた先"], ["Hmz2eBaZvBg", "一日社員"], ["IZS2DvoygWw", "タイミー全ツッパ"], ["MyVnNIgfBS8", "最強営業リスト"], ["NnSlIuSldTQ", "AIを楽しもう"], ["PDRNAq7RNvc", "100億円の勝負"], ["Q1ydGCm90R8", "謎めいた一日"], ["YINy5jM1p7M", "林先生と重大発表"], ["bKFFro3UTsw", "JOPT Crown優勝"], ["dC-UoCnsa2Q", "嫁にバレず韓国"], ["eQsAOnrhE4A", "今1番熱い研修"], ["ecYuFiMU9V0", "WSOP挑戦"], ["ejj5vM8OgUA", "ゼロイチ研修"], ["fCMn8YOFfBw", "高松宮WIN5"], ["fenmCOzaygE", "大井100万オールイン"], ["ftcX4PmRTLs", "借金について"], ["gpnPgXXrPwk", "韓国バカラ"], ["hvu3eqy0t8s", "有馬・人生最後"], ["j6dt3zbPjfE", "運命の戦い"], ["jSqQ27dDR3A", "AIベンチャー朝礼"], ["kLgv4W24Mpc", "AI導入補助金"], ["lfYpEJ56Otg", "池袋キャバ嬢"], ["mZOsCFBQ_N4", "全東信"], ["oJy-n3DqK98", "追徴3900万"], ["pOUrvKX-9Rs", "社長の休日密着"], ["ps4AE8tPDC0", "高尾山とAI"], ["qPGOwvSbgBw", "天皇賞AI予想"], ["qSnFoc6bJ7g", "借金1億密着"], ["qqoMZgLkcdI", "怪しいAI競馬"], ["rFNZJKSlZmE", "娘のお願い"], ["rGcaQwiQIJo", "フィリピンバカラ"], ["ss1IFQqav-8", "競艇WIN5"], ["u1Gz_kTbc9g", "20億溶かした人生"], ["zNI76q0LMBI", "LasoneData 納品"], ["zxo9AzVyKPI", "離婚することになりました"]];

  function ytThumb(id) { return "assets/yt_" + id + ".jpg"; }
  function ytUrl(id) { return "https://www.youtube.com/watch?v=" + id; }

  /* ---- nav ---- */
  var nav = document.getElementById("site-nav");
  function onScrollNav() {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", (window.scrollY || 0) > 18);
  }
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();
  if ((window.innerWidth || 1200) <= 860) document.body.classList.add("has-mobile-bar");

  /* ---- reveal ---- */
  var reveals = document.querySelectorAll(".reveal");
  if (reduce) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else if ("IntersectionObserver" in window) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          rio.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { rio.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---- counters ---- */
  function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
  function animateCount(el) {
    var staticVal = el.getAttribute("data-static");
    if (staticVal != null) { el.textContent = staticVal; return; }
    var target = parseFloat(el.getAttribute("data-count") || "0");
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1600, start = performance.now();
    function frame(now) {
      var t = Math.min(1, (now - start) / dur);
      el.textContent = (target * easeOutExpo(t)).toFixed(decimals) + suffix;
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var counterSec = document.getElementById("counters");
  if (counterSec) {
    var counted = false;
    if ("IntersectionObserver" in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !counted) {
            counted = true;
            counterSec.querySelectorAll(".counter-num").forEach(animateCount);
            cio.disconnect();
          }
        });
      }, { threshold: 0.35 });
      cio.observe(counterSec);
    } else {
      counterSec.querySelectorAll(".counter-num").forEach(animateCount);
    }
  }

  /* ---- timeline ---- */
  var path = document.getElementById("timeline-path");
  var nodes = document.querySelectorAll(".timeline-node");
  function timelineTick() {
    if (!path) return;
    var wrap = path.closest(".timeline-wrap");
    if (!wrap) return;
    var rect = wrap.getBoundingClientRect();
    var vh = window.innerHeight || 800;
    var total = rect.height + vh * 0.4;
    var prog = Math.min(1, Math.max(0, (vh * 0.55 - rect.top) / total * 1.4));
    var len = path.getTotalLength ? path.getTotalLength() : 1200;
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len * (1 - prog));
    nodes.forEach(function (n, i) {
      n.classList.toggle("is-on", prog > (i + 0.35) / (nodes.length + 0.5) || reduce);
    });
  }
  window.addEventListener("scroll", timelineTick, { passive: true });
  timelineTick();
  // numbered story steps fade
  document.querySelectorAll(".story-step").forEach(function(el,i){ el.style.transitionDelay=(i*0.05)+"s"; });

  /* ---- tilt ---- */
  function bindTilt(el) {
    if (reduce || isTouch) return;
    var max = 8;
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = "perspective(900px) rotateY(" + (px * max * 2) + "deg) rotateX(" + (-py * max * 2) + "deg)";
    });
    el.addEventListener("pointerleave", function () { el.style.transform = ""; });
  }
  document.querySelectorAll(".tilt-card").forEach(bindTilt);

  /* ---- marquee ---- */
  function fillMarquee(row, items) {
    if (!row) return;
    var frag = document.createDocumentFragment();
    function make(set) {
      set.forEach(function (it) {
        var a = document.createElement("a");
        a.className = "mq-item";
        a.href = ytUrl(it[0]);
        a.target = "_blank";
        a.rel = "noopener";
        a.innerHTML = '<img src="' + ytThumb(it[0]) + '" width="1280" height="720" alt="" loading="lazy"><span>' + it[1] + "</span>";
        frag.appendChild(a);
      });
    }
    make(items); make(items);
    row.appendChild(frag);
  }
  var half = Math.ceil(GALLERY.length / 2);
  fillMarquee(document.getElementById("marquee-row-1"), GALLERY.slice(0, half));
  fillMarquee(document.getElementById("marquee-row-2"), GALLERY.slice(half));

  /* ---- cinema ---- */
  var cinema = document.getElementById("cinema-track");
  if (cinema) {
    [
      ["assets/pro_call.jpg", "AIコール開発", "#pillars"],
      ["assets/pro_data.jpg", "AI営業リスト戦略", "#pillars"],
      ["assets/pro_meeting.jpg", "伴走の会議", "#pillars"],
      ["assets/pro_focus.jpg", "効果までやり続ける", "#guarantee"]
    ].forEach(function (it) {
      var a = document.createElement("a");
      a.className = "cinema-card cinema-pro";
      a.href = it[2];
      a.innerHTML = '<img src="' + it[0] + '" width="1280" height="720" alt="" loading="lazy"><figcaption>' + it[1] + "</figcaption>";
      cinema.appendChild(a);
    });
    GALLERY.forEach(function (it) {
      var a = document.createElement("a");
      a.className = "cinema-card";
      a.href = ytUrl(it[0]);
      a.target = "_blank";
      a.rel = "noopener";
      a.innerHTML = '<img src="' + ytThumb(it[0]) + '" width="1280" height="720" alt="" loading="lazy"><figcaption>' + it[1] + "</figcaption>";
      cinema.appendChild(a);
    });
  }

  /* ---- photo wall: pro first + field stills ---- */
  var wall = document.getElementById("photo-wall");
  if (wall) {
    var PRO = [
      ["assets/pro_meeting.jpg", "経営会議・伴走", "#pillars"],
      ["assets/pro_call.jpg", "AIコール開発", "#pillars"],
      ["assets/pro_data.jpg", "AI営業リスト戦略", "#pillars"],
      ["assets/pro_laptop.jpg", "数字と戦略", "#pillars"],
      ["assets/pro_strategy.jpg", "戦略ワーク", "#pillars"],
      ["assets/pro_sales.jpg", "提案・プレゼン", "#services"],
      ["assets/pro_handshake.jpg", "信頼と契約", "#hub"],
      ["assets/pro_team.jpg", "チーム実装", "#pillars"],
      ["assets/pro_office.jpg", "実務の現場", "#story"],
      ["assets/pro_focus.jpg", "効果まで伴走", "#guarantee"]
    ];
    PRO.forEach(function (it, idx) {
      var a = document.createElement("a");
      a.className = "wall-cell wall-pro" + (idx < 3 ? " wall-lg" : "");
      a.href = it[2];
      a.innerHTML = '<img src="' + it[0] + '" width="1280" height="720" alt="' + it[1] + '" loading="lazy"><span>' + it[1] + "</span>";
      wall.appendChild(a);
    });
    GALLERY.forEach(function (it, idx) {
      var a = document.createElement("a");
      a.className = "wall-cell" + (idx % 9 === 0 ? " wall-tall" : "");
      a.href = ytUrl(it[0]);
      a.target = "_blank";
      a.rel = "noopener";
      a.innerHTML = '<img src="' + ytThumb(it[0]) + '" width="1280" height="720" alt="' + it[1] + '" loading="lazy"><span>' + it[1] + "</span>";
      wall.appendChild(a);
    });
    [["assets/avatar_yt.jpg","ラスワン"],["assets/avatar_x.jpg","プロフィール"]].forEach(function (av) {
      var d = document.createElement("div");
      d.className = "wall-cell wall-avatar";
      d.innerHTML = '<img src="' + av[0] + '" width="800" height="800" alt="' + av[1] + '" loading="lazy"><span>' + av[1] + "</span>";
      wall.appendChild(d);
    });
  }

  /* ---- magnetic ---- */
  if (!reduce && !isTouch) {
    document.querySelectorAll(".mag").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        btn.style.transform = "translate(" + ((e.clientX - (r.left + r.width / 2)) * 0.18) + "px," + ((e.clientY - (r.top + r.height / 2)) * 0.22) + "px)";
      });
      btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
    });
  }

  /* ---- cursor ---- */
  var cur = document.getElementById("cursor");
  var ring = document.getElementById("cursor-ring");
  if (!reduce && !isTouch && cur && ring) {
    document.body.classList.add("cursor-on");
    var mx = 0, my = 0, rx = 0, ry = 0;
    window.addEventListener("pointermove", function (e) {
      mx = e.clientX; my = e.clientY;
      cur.style.left = mx + "px"; cur.style.top = my + "px";
    }, { passive: true });
    (function ringLoop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.left = rx + "px"; ring.style.top = ry + "px";
      requestAnimationFrame(ringLoop);
    })();
    document.querySelectorAll("a, button, .tilt-card, .cinema-card, .mq-item, .wall-cell").forEach(function (el) {
      el.addEventListener("pointerenter", function () { document.body.classList.add("cursor-hover"); });
      el.addEventListener("pointerleave", function () { document.body.classList.remove("cursor-hover"); });
    });
  }

  window.__OMO_GALLERY = GALLERY;
})();
