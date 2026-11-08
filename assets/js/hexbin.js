/* =====================================================================
   hexbin.js : carte hexbin interactive des points d'apport volontaire
   (PAV) de Grenoble-Alpes Métropole, page d'accueil.

   Données : /data/pav_web.json, produit par le pipeline R / Python
   https://github.com/AcidyBee/pav-grenoble-hexbin
   Chaque point : [x Lambert-93 (m), y Lambert-93 (m), indice du type, indice de la commune]

   Utilisation dans une page :
     <figure class="hexcard" data-hexbin data-src="/data/pav_web.json" data-lang="fr"> … </figure>
   Le script remplit les éléments [data-hex="…"] contenus dans la figure.
   ===================================================================== */
(function () {
  "use strict";

  var STR = {
    fr: { all: "Tous les flux", filter: "Type de flux", unit1: "conteneur", unitN: "conteneurs", cells: "hexagones",
          aria: "Hexbin des points d'apport volontaire de Grenoble-Alpes Métropole", locale: "fr-FR" },
    en: { all: "All streams", filter: "Waste stream", unit1: "container", unitN: "containers", cells: "hexagons",
          aria: "Hexbin of recycling drop-off points in the Grenoble-Alpes metropolitan area", locale: "en-GB" }
  };

  /* ---------- Calcul : regroupement en hexagones ---------- */

  // Emprise des points, avec une marge de 900 m
  function extent(pts) {
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    pts.forEach(function (p) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    var m = 900;
    return { x0: x0 - m, x1: x1 + m, y0: y0 - m, y1: y1 + m };
  }

  // Hexagones « pointe en haut », largeur entre côtés opposés = hex_largeur_m (1 km).
  // L'origine de la grille est calée sur des kilomètres ronds (Lambert-93) :
  // le résultat ne dépend pas de l'emprise affichée (effet MAUP maîtrisé).
  function bins(data, ext, code) {
    var R = data.hex_largeur_m / Math.sqrt(3);
    var ox = Math.floor((ext.x0 + 900) / 1000) * 1000 - 1000;
    var oy = Math.ceil((ext.y1 - 900) / 1000) * 1000 + 1000;
    var ti = code === "ALL" ? -1 : data.types.findIndex(function (t) { return t.code === code; });
    var map = new Map();
    data.pts.forEach(function (p) {
      if (ti >= 0 && p[2] !== ti) return;
      var x = p[0] - ox, y = oy - p[1];
      // coordonnées axiales fractionnaires puis arrondi « cubique »
      var fq = (Math.sqrt(3) / 3 * x - y / 3) / R, fr = (2 / 3 * y) / R, fs = -fq - fr;
      var q = Math.round(fq), r = Math.round(fr), s = Math.round(fs);
      var dq = Math.abs(q - fq), dr = Math.abs(r - fr), ds = Math.abs(s - fs);
      if (dq > dr && dq > ds) q = -r - s; else if (dr > ds) r = -q - s;
      var k = q + "," + r, b = map.get(k);
      if (!b) { b = { q: q, r: r, n: 0, c: {} }; map.set(k, b); }
      b.n++; b.c[p[3]] = (b.c[p[3]] || 0) + 1;
    });
    var dx = ox - ext.x0, dy = ext.y1 - oy, cells = [];
    map.forEach(function (b) {
      var top = Object.keys(b.c).sort(function (u, v) { return b.c[v] - b.c[u]; })[0];
      cells.push({ x: dx + R * Math.sqrt(3) * (b.q + b.r / 2), y: dy + R * 1.5 * b.r, n: b.n, com: data.communes[+top] || "" });
    });
    return { R: R, cells: cells };
  }

  /* ---------- Dessin ---------- */

  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function toRgb(c) {
    if (c.charAt(0) === "#") { c = c.slice(1); return [0, 2, 4].map(function (i) { return parseInt(c.slice(i, i + 2), 16); }); }
    return (c.match(/\d+/g) || [0, 0, 0]).slice(0, 3).map(Number);
  }
  function mix(a, b, t) { var A = toRgb(a), B = toRgb(b); return "rgb(" + A.map(function (v, i) { return Math.round(v + (B[i] - v) * t); }).join(",") + ")"; }
  function hexPath(ctx, x, y, r) {
    ctx.beginPath();
    for (var i = 0; i < 6; i++) { var a = Math.PI / 180 * (60 * i - 30); ctx[i ? "lineTo" : "moveTo"](x + r * Math.cos(a), y + r * Math.sin(a)); }
    ctx.closePath();
  }

  function init(fig) {
    var lang = fig.dataset.lang === "en" ? "en" : "fr", S = STR[lang];
    var fmt = function (n) { return n.toLocaleString(S.locale); };
    var $ = function (name) { return fig.querySelector('[data-hex="' + name + '"]'); };
    var cv = $("canvas"), tip = $("tip"), chips = $("chips");

    fetch(fig.dataset.src).then(function (r) { return r.json(); }).then(function (data) {
      var ext = extent(data.pts), cache = {}, sel = "ALL", state = null, anim = 0;
      var get = function (c) { return cache[c] || (cache[c] = bins(data, ext, c)); };

      // Puces de filtre
      var items = [["ALL", S.all, data.pts.length]].concat(data.types.map(function (t) { return [t.code, t[lang], t.n]; }));
      chips.setAttribute("aria-label", S.filter);
      chips.innerHTML = items.map(function (it) {
        return '<button type="button" class="hchip" data-pav="' + it[0] + '" aria-pressed="' + (it[0] === sel) + '"><span>' + it[1] + "</span><b>" + fmt(it[2]) + "</b></button>";
      }).join("");
      chips.addEventListener("click", function (e) {
        var b = e.target.closest("[data-pav]"); if (!b) return;
        sel = b.dataset.pav;
        chips.querySelectorAll(".hchip").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        draw(true);
      });

      function draw(animate) {
        var W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
        var dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        var ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var wm = ext.x1 - ext.x0, hm = ext.y1 - ext.y0, k = Math.min(W / wm, H / hm), ox = (W - wm * k) / 2, oy = (H - hm * k) / 2;
        var cur = get(sel), rpx = cur.R * k * .93;
        var toPx = function (c) { return { px: ox + c.x * k, py: oy + c.y * k, n: c.n, com: c.com }; };
        var cells = cur.cells.map(toPx).sort(function (a, b) { return a.py - b.py; });
        var ghost = sel === "ALL" ? [] : get("ALL").cells.map(toPx);
        var max = Math.max.apply(null, cells.map(function (c) { return c.n; }));
        var total = cells.reduce(function (a, c) { return a + c.n; }, 0);
        state = { cells: cells, rpx: rpx };
        $("max").textContent = fmt(max);
        $("sum").textContent = fmt(total) + " " + (total > 1 ? S.unitN : S.unit1) + " · " + fmt(cells.length) + " " + S.cells;
        var label = sel === "ALL" ? S.all : data.types.find(function (t) { return t.code === sel; })[lang];
        cv.setAttribute("aria-label", S.aria + " : " + label + ", " + fmt(total) + " " + S.unitN);
        var lo = cssVar("--hex-lo"), hi = cssVar("--hex-hi"), line = cssVar("--line");
        var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, dur = (animate && !reduce) ? 550 : 0, t0 = performance.now();
        cancelAnimationFrame(anim);
        (function frame(now) {
          var pr = dur ? Math.min(1, (now - t0) / dur) : 1;
          ctx.clearRect(0, 0, W, H); ctx.strokeStyle = line; ctx.lineWidth = 1;
          ghost.forEach(function (g) { hexPath(ctx, g.px, g.py, rpx); ctx.stroke(); });
          var shown = Math.ceil(cells.length * pr);
          for (var i = 0; i < shown; i++) {
            var c = cells[i];
            ctx.fillStyle = mix(lo, hi, Math.sqrt((c.n - 1) / Math.max(1, max - 1)));
            hexPath(ctx, c.px, c.py, rpx); ctx.fill();
          }
          if (pr < 1) anim = requestAnimationFrame(frame);
        })(t0);
      }

      // Infobulle au survol / toucher
      function hover(e) {
        if (!state) return;
        var b = cv.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top, best = null, bd = Infinity;
        state.cells.forEach(function (c) { var d = (c.px - x) * (c.px - x) + (c.py - y) * (c.py - y); if (d < bd) { bd = d; best = c; } });
        if (best && bd < state.rpx * state.rpx * 1.2) {
          tip.hidden = false; tip.style.left = best.px + "px"; tip.style.top = best.py + "px";
          tip.textContent = fmt(best.n) + " " + (best.n > 1 ? S.unitN : S.unit1) + " · " + best.com;
        } else tip.hidden = true;
      }
      cv.addEventListener("pointermove", hover);
      cv.addEventListener("pointerdown", hover);
      cv.addEventListener("pointerleave", function () { tip.hidden = true; });

      // Redessiner : redimensionnement, changement de thème clair/sombre
      var rz; addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { draw(false); }, 120); });
      matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () { draw(false); });
      new MutationObserver(function () { setTimeout(function () { draw(false); }, 50); })
        .observe(document.body, { attributes: true, attributeFilter: ["class"] });

      draw(true);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { draw(false); });
    }).catch(function (err) {
      $("sum").textContent = "⚠ " + err.message;
    });
  }

  document.querySelectorAll("[data-hexbin]").forEach(init);
})();
