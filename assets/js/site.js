/* =====================================================================
   site.js : petits comportements communs à toutes les pages.
   Chargé par _partials/after-body.html. Aucune dépendance.
   ===================================================================== */
(function () {
  "use strict";

  /* 1. Bouton de langue : pointe vers la même page dans l'autre langue.
        Les pages FR sont à la racine, les pages EN sous /en/, avec les
        mêmes noms de fichiers. Le site est servi à la racine du domaine
        (acidybee.github.io, ou localhost avec quarto preview). */
  function langSwitch() {
    var path = location.pathname.replace(/^\//, "") || "index.html";
    if (/\/$/.test(path)) path += "index.html";
    var isEn = path.indexOf("en/") === 0;
    var fr = "/" + (isEn ? path.slice(3) : path), en = "/" + (isEn ? path : "en/" + path);
    document.querySelectorAll(".navbar .nav-link").forEach(function (a) {
      var t = a.textContent.trim();
      if (t !== "EN" && t !== "FR") return;
      a.href = (t === "FR" ? fr : en) + location.hash;
      a.setAttribute("hreflang", t.toLowerCase());
      var current = (t === "EN") === isEn;
      a.classList.toggle("lang-current", current);
      if (current) a.setAttribute("aria-current", "true");
    });
  }

  /* 2. Bouton « Copier l'adresse » (page Contact) */
  function copyMail() {
    var btn = document.getElementById("copy-mail"), mail = document.getElementById("email");
    if (!btn || !mail) return;
    var toast = document.createElement("div"); toast.className = "toast"; toast.hidden = true;
    document.body.appendChild(toast);
    var timer;
    function show(msg) { toast.textContent = msg; toast.hidden = false; clearTimeout(timer); timer = setTimeout(function () { toast.hidden = true; }, 2200); }
    btn.addEventListener("click", function () {
      var ok = function () { show(btn.dataset.done); };
      var fail = function () {
        var r = document.createRange(); r.selectNodeContents(mail);
        var s = getSelection(); s.removeAllRanges(); s.addRange(r); show(btn.dataset.fail);
      };
      try { navigator.clipboard.writeText(mail.textContent.trim()).then(ok, fail); } catch (e) { fail(); }
    });
  }

  /* 3. Filtres par domaine sur la page Projets.
        Les cartes portent data-domain (voir _partials/project-card.ejs) ;
        les puces sont générées ici à partir des domaines présents. */
  function projectFilters() {
    var box = document.querySelector("[data-filters]");
    if (!box) return;
    var cards = Array.prototype.slice.call(document.querySelectorAll(".pcard[data-domain]"));
    // domaines présents, dans l'ordre donné par data-order (projects.qmd)
    var order = (box.dataset.order || "").split(" "), labels = {}, chips = [["all", box.dataset.all]];
    cards.forEach(function (c) { labels[c.dataset.domain] = c.dataset.domainLabel; });
    Object.keys(labels).sort(function (a, b) {
      var ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    }).forEach(function (d) { chips.push([d, labels[d]]); });
    box.innerHTML = chips.map(function (c, i) {
      return '<button type="button" class="chip" data-f="' + c[0] + '" aria-pressed="' + (i === 0) + '">' + c[1] + "</button>";
    }).join("");
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-f]"); if (!b) return;
      box.querySelectorAll(".chip").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      cards.forEach(function (c) { c.hidden = !(b.dataset.f === "all" || c.dataset.domain === b.dataset.f); });
    });
  }

  /* 4. Logo : l'image du logo est remplacée par le même SVG « en ligne »,
        pour qu'il prenne les couleurs du thème actif (var(--honey)) et la
        police IBM Plex Mono. Sans JavaScript, l'image reste affichée. */
  function inlineLogo() {
    var img = document.querySelector(".navbar-logo");
    if (!img) return;
    var NS = "http://www.w3.org/2000/svg";
    var wrap = document.createElement("span");
    wrap.className = "navbar-logo navbar-logo-svg";
    wrap.innerHTML = '<svg width="38" height="42" viewBox="0 0 38 42" aria-hidden="true" xmlns="' + NS + '">' +
      '<path d="M19 1.5 36 11.25v19.5L19 40.5 2 30.75v-19.5z" fill="var(--honey)"/>' +
      '<path d="M19 9.5 29 15.25v11.5L19 32.5 9 26.75v-11.5z" fill="none" stroke="var(--on-honey)" stroke-width="2"/>' +
      '<text x="19" y="24.6" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="8.5" font-weight="600" fill="var(--on-honey)">ab</text></svg>';
    img.replaceWith(wrap);
  }

  /* 5. Interrupteur clair / sombre : rôle et état pour les lecteurs d'écran */
  function themeSwitch() {
    var t = document.querySelector(".quarto-color-scheme-toggle");
    if (!t) return;
    var isEn = location.pathname.indexOf("/en/") === 0;
    t.setAttribute("role", "switch");
    t.setAttribute("aria-label", isEn ? "Dark mode" : "Mode sombre");
    t.title = isEn ? "Switch light / dark mode" : "Basculer mode clair / sombre";
    var sync = function () { t.setAttribute("aria-checked", String(document.body.classList.contains("quarto-dark"))); };
    sync();
    new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  langSwitch(); copyMail(); projectFilters(); inlineLogo(); themeSwitch();
})();
