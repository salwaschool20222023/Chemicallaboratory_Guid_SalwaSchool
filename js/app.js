/* ============================================================
   مجلة دليل المختبر الكيميائي — منطق العارض
   ترتيب الصفحات المنطقي (من اليمين إلى اليسار كما في الكتب العربية):
     0 الغلاف · 1 فريق العمل · 2 الفهرس · 3..54 صفحات المحتوى (1–52) · 55 الغلاف الخلفي
   المكتبة تعمل من اليسار إلى اليمين، لذلك نعكس الترتيب عند تمريره لها.
   ============================================================ */
(function () {
  'use strict';

  var M = window.MAG;
  var NC = M.pages.length;          // عدد صفحات المحتوى (52)
  var N = NC + 4;                   // العدد الكلي للأوراق (56)
  var L_COVER = 0, L_TEAM = 1, L_INDEX = 2, L_BACK = N - 1;

  function $(s, r) { return (r || document).querySelector(s); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function toLib(l) { return N - 1 - l; }
  function toLogical(i) { return N - 1 - i; }
  function nOfLogical(l) { var n = l - 2; return (n >= 1 && n <= NC) ? n : 0; }   // رقم صفحة المحتوى أو 0
  function logicalOfN(n) { return n + 2; }
  function secOf(n) { for (var i = 0; i < M.sections.length; i++) { var s = M.sections[i]; if (n >= s.from && n <= s.to) return s; } return M.sections[0]; }

  var ICON_ZOOM = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M10 3a7 7 0 1 0 4.2 12.6l4.6 4.6 1.4-1.4-4.6-4.6A7 7 0 0 0 10 3zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm-1 2v2H7v2h2v2h2v-2h2V9h-2V7H9z"/></svg>';

  var imgs = {};            // رقم الصفحة -> عنصر الصورة
  var loaded = {};
  var pf = null, bookEl = null, curLogical = 0, curIdx = N - 1, started = false;

  /* ---------------- بناء الصفحات ---------------- */
  function decorSVG() {
    return '<svg class="decor" viewBox="0 0 400 540" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<g fill="none" stroke="rgba(255,255,255,.10)" stroke-width="1.4">' +
      '<polygon points="320,60 350,77 350,111 320,128 290,111 290,77"/>' +
      '<polygon points="350,111 380,128 380,162 350,179 320,162 320,128"/>' +
      '<polygon points="290,111 320,128 320,162 290,179 260,162 260,128"/>' +
      '<polygon points="70,380 100,397 100,431 70,448 40,431 40,397"/>' +
      '<polygon points="100,431 130,448 130,482 100,499 70,482 70,448"/>' +
      '<circle cx="350" cy="420" r="46"/><circle cx="350" cy="420" r="70" stroke-dasharray="3 7"/></g>' +
      '<g fill="rgba(215,122,158,.35)"><circle cx="320" cy="60" r="4"/><circle cx="380" cy="162" r="4"/><circle cx="70" cy="380" r="4"/><circle cx="350" cy="350" r="5"/></g></svg>';
  }

  function pageCover() {
    var p = el('div', 'page cover'); p.setAttribute('data-density', 'hard');
    p.innerHTML =
      '<div class="pg">' + decorSVG() +
      '<div class="cv-top"><div class="cv-logos">' +
      '<span class="logo-chip"><img src="assets/logo-moe.jpg" alt=""></span>' +
      '<span class="logo-chip"><img src="assets/logo-school.jpg" alt=""></span></div>' +
      '<div class="cv-ministry">' + esc(M.ministry) + '</div>' +
      '<div class="cv-school">' + esc(M.school) + '</div></div>' +
      '<div class="cv-main"><div class="cv-tag">' + esc(M.tagline) + '</div>' +
      '<h1>' + esc(M.title) + '</h1><div class="cv-rule"></div>' +
      '<p class="cv-topic">' + esc(M.topic) + '</p></div>' +
      '<div class="cv-bottom"><div class="cv-by">' + esc(M.credits[0].role) + '<b>' + esc(M.credits[0].name) + '</b></div>' +
      '<div class="cv-year">' + esc(M.year) + '</div></div>' +
      '<div class="stripe"><i></i><i></i><i></i><i></i></div></div>';
    return p;
  }

  function pageTeam() {
    var p = el('div', 'page team');
    var people = M.credits.map(function (c) {
      return '<div class="person"><small>' + esc(c.role) + '</small><b>' + esc(c.name) + '</b></div>';
    }).join('');
    p.innerHTML =
      '<div class="pg"><div class="logos">' +
      '<span class="logo-chip"><img src="assets/logo-moe.jpg" alt=""></span>' +
      '<span class="logo-chip"><img src="assets/logo-school.jpg" alt=""></span></div>' +
      '<div class="t-ministry">' + esc(M.ministry) + '</div>' +
      '<div class="t-school">' + esc(M.school) + '<small>' + esc(M.schoolSub) + '</small></div>' +
      '<h3>فريق العمل</h3><div class="people">' + people + '</div>' +
      '<div class="t-year">' + esc(M.year) + '</div></div>';
    return p;
  }

  function pageIndex() {
    var p = el('div', 'page idx');
    var h = '<div class="pg"><h2>فهرس المحتويات</h2><div class="idx-cols">';
    M.sections.forEach(function (s) {
      h += '<div class="idx-sec" style="background:' + s.color + '">' + esc(s.name) + '</div>';
      for (var n = s.from; n <= s.to; n++) {
        h += '<button type="button" class="idx-row" data-go="' + n + '"><span class="t">' + esc(M.pages[n - 1]) +
          '</span><span class="dots"></span><span class="n">' + n + '</span></button>';
      }
    });
    h += '</div></div>';
    p.innerHTML = h;
    return p;
  }

  function pageContent(n) {
    var s = secOf(n), title = M.pages[n - 1];
    var p = el('div', 'page');
    p.innerHTML =
      '<div class="pg content" style="--c:' + s.color + '">' +
      '<div class="hd"><div class="hd-text"><span class="chip-sec">' + esc(s.name) + '</span><h2>' + esc(title) + '</h2></div>' +
      '<button type="button" class="zoom-btn" data-zoom="' + n + '" aria-label="تكبير الصفحة ' + n + '" title="تكبير">' + ICON_ZOOM + '</button></div>' +
      '<div class="art"><img alt="' + esc(title) + '" decoding="async" data-src="pages/' + pad(n) + '.webp" data-n="' + n + '"></div>' +
      '<div class="ft"><span>' + esc(M.school) + ' · ' + esc(M.year) + '</span><span class="ft-num">' + n + '</span></div></div>';
    imgs[n] = p.querySelector('img');
    return p;
  }

  function pageBack() {
    var p = el('div', 'page back'); p.setAttribute('data-density', 'hard');
    p.innerHTML =
      '<div class="pg"><span class="logo-chip"><img src="assets/logo-school.jpg" alt=""></span>' +
      '<div class="b-school">' + esc(M.school) + '</div>' +
      '<p class="b-motto">' + esc(M.motto) + '</p>' +
      '<div class="b-year">' + esc(M.year) + '</div>' +
      '<div class="stripe"><i></i><i></i><i></i><i></i></div></div>';
    return p;
  }

  function buildPages() {
    var list = [pageCover(), pageTeam(), pageIndex()];
    for (var n = 1; n <= NC; n++) list.push(pageContent(n));
    list.push(pageBack());
    return list;                 // ترتيب منطقي
  }

  /* ---------------- تحميل الصور ---------------- */
  function loadImg(n) {
    if (!imgs[n] || loaded[n]) return;
    loaded[n] = true; imgs[n].src = imgs[n].getAttribute('data-src');
  }
  function loadNear(l, r) {
    for (var d = 0; d <= r; d++) {
      var a = nOfLogical(l + d), b = nOfLogical(l - d);
      if (a) loadImg(a); if (b) loadImg(b);
    }
  }
  function backgroundLoad() {
    var best = 0, bd = 1e9;
    for (var n = 1; n <= NC; n++) {
      if (loaded[n]) continue;
      var d = Math.abs(logicalOfN(n) - curLogical);
      if (d < bd) { bd = d; best = n; }
    }
    if (best) { loadImg(best); setTimeout(backgroundLoad, 140); }
  }

  /* ---------------- حالة الصفحة الحالية ---------------- */
  function visibleLogicals(idx) {
    var o = pf ? pf.getOrientation() : 'landscape', arr;
    if (o === 'portrait' || idx === 0 || idx === N - 1) arr = [idx];
    else arr = (idx % 2 === 1) ? [idx, idx + 1] : [idx - 1, idx];
    return arr.map(toLogical).sort(function (a, b) { return a - b; });
  }

  function labelFor(ls) {
    var nums = [], names = [];
    ls.forEach(function (l) {
      var n = nOfLogical(l);
      if (n) nums.push(n);
      else names.push(l === L_COVER ? 'الغلاف' : l === L_TEAM ? 'فريق العمل' : l === L_INDEX ? 'الفهرس' : 'الغلاف الخلفي');
    });
    var out = [];
    if (names.length) out.push(names.join(' · '));
    if (nums.length === 1) out.push('صفحة ' + nums[0] + ' من ' + NC);
    else if (nums.length > 1) out.push('الصفحتان ' + nums[0] + ' – ' + nums[nums.length - 1] + ' من ' + NC);
    return out.join(' · ');
  }

  function updateShift() {
    if (!pf || !bookEl) return;
    var o = pf.getOrientation(), s = 0;
    if (o === 'landscape') {
      var pw = pf.getBoundsRect().pageWidth;
      if (curIdx === N - 1) s = pw / 2;         // الغلاف يظهر وحده فنوسّطه
      else if (curIdx === 0) s = -pw / 2;
    }
    bookEl.style.transform = s ? 'translateX(' + s + 'px)' : '';
    bookEl.classList.toggle('portrait', o === 'portrait');
  }

  function onPage(idx) {
    curIdx = idx;
    var ls = visibleLogicals(idx);
    curLogical = ls[0];
    $('#pageLabel').textContent = labelFor(ls);
    $('#slider').value = curLogical;
    $('#btnNext').disabled = (idx === 0);
    $('#btnPrev').disabled = (idx === N - 1);
    loadNear(curLogical, 6);
    markDrawer(ls);
    updateShift();
    var n = 0; ls.forEach(function (l) { if (!n && nOfLogical(l)) n = nOfLogical(l); });
    try {
      history.replaceState(null, '', n ? '#p=' + n : (curLogical === L_COVER ? '#cover' : '#'));
    } catch (e) { }
  }

  function go(logical) {
    if (!pf) return;
    logical = Math.max(0, Math.min(N - 1, logical));
    pf.turnToPage(toLib(logical));
  }
  function goN(n) { go(logicalOfN(n)); }
  function forward() { if (pf && curIdx > 0) pf.flipPrev(); }
  function backward() { if (pf && curIdx < N - 1) pf.flipNext(); }

  /* ---------------- تشغيل المجلة ---------------- */
  function startBook(startLogical) {
    if (started) { pf.update(); go(startLogical); setTimeout(function () { pf.update(); updateShift(); }, 80); return; }
    started = true;
    bookEl = $('#book');
    var logical = buildPages();
    var libPages = logical.slice().reverse();
    libPages.forEach(function (p) { bookEl.appendChild(p); });
    libPages.forEach(function (p, i) { p.classList.add(i % 2 === 1 ? 'pl' : 'pr'); });

    curLogical = startLogical; curIdx = toLib(startLogical);
    loadNear(startLogical, 7);

    pf = new St.PageFlip(bookEl, {
      width: 550, height: 742, size: 'stretch',
      minWidth: 250, maxWidth: 760, minHeight: 340, maxHeight: 1040,
      maxShadowOpacity: 0.45, showCover: true, mobileScrollSupport: false,
      flippingTime: 800, usePortrait: true, startPage: toLib(startLogical),
      autoSize: true, drawShadow: true, swipeDistance: 24,
      clickEventForward: true, useMouseEvents: true, showPageCorners: true, startZIndex: 5
    });
    pf.loadFromHTML(libPages);
    pf.on('flip', function (e) { onPage(e.data); });
    pf.on('changeOrientation', function () { onPage(curIdx); });
    window.addEventListener('resize', function () { setTimeout(updateShift, 60); });

    setTimeout(function () {
      onPage(toLib(startLogical));
      bookEl.classList.add('ready');
      $('#loading').classList.add('done');
      setTimeout(backgroundLoad, 600);
    }, 250);

    // أزرار داخل الصفحات (الفهرس + التكبير)
    bookEl.addEventListener('click', function (e) {
      var g = e.target.closest('[data-go]'); if (g) { goN(+g.getAttribute('data-go')); return; }
      var z = e.target.closest('[data-zoom]'); if (z) { openZoom(+z.getAttribute('data-zoom')); }
    });
    bookEl.addEventListener('dblclick', function (e) {
      var im = e.target.closest('.art img'); if (im) openZoom(+im.getAttribute('data-n'));
    });
  }

  /* ---------------- الفهرس الجانبي ---------------- */
  var drawerBuilt = false;
  function norm(s) {
    var sub = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9', '⁺': '+', '⁻': '-' };
    return String(s).toLowerCase()
      .replace(/[₀-₉⁺⁻]/g, function (c) { return sub[c]; })
      .replace(/[ً-ٰٟـ]/g, '')
      .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي');
  }
  function buildDrawer() {
    if (drawerBuilt) return; drawerBuilt = true;
    var body = $('#drawerBody'), h = '';
    M.sections.forEach(function (s, si) {
      h += '<div class="dsec" data-sec="' + si + '"><i style="background:' + s.color + '"></i>' + esc(s.name) + '</div><div class="dgrid" data-sec="' + si + '">';
      for (var n = s.from; n <= s.to; n++) {
        h += '<button type="button" class="dcard" data-n="' + n + '" data-k="' + esc(norm(M.pages[n - 1] + ' ' + s.name + ' ' + n)) + '">' +
          '<span class="dthumb"><img loading="lazy" alt="" src="pages/' + pad(n) + '.webp"><span class="dnum" style="background:' + s.color + '">' + n + '</span></span>' +
          '<span class="dtitle">' + esc(M.pages[n - 1]) + '</span></button>';
      }
      h += '</div>';
    });
    h += '<div class="empty" id="noRes" hidden>لا توجد نتائج مطابقة</div>';
    body.innerHTML = h;
    body.addEventListener('click', function (e) {
      var c = e.target.closest('.dcard'); if (!c) return;
      goN(+c.getAttribute('data-n')); closeDrawer();
    });
    $('#q').addEventListener('input', function () {
      var q = norm(this.value.trim()), any = false;
      var cards = body.querySelectorAll('.dcard');
      for (var i = 0; i < cards.length; i++) {
        var ok = !q || cards[i].getAttribute('data-k').indexOf(q) > -1;
        cards[i].hidden = !ok; if (ok) any = true;
      }
      M.sections.forEach(function (s, si) {
        var vis = body.querySelectorAll('.dgrid[data-sec="' + si + '"] .dcard:not([hidden])').length > 0;
        body.querySelector('.dsec[data-sec="' + si + '"]').hidden = !vis;
        body.querySelector('.dgrid[data-sec="' + si + '"]').hidden = !vis;
      });
      $('#noRes').hidden = any;
    });
  }
  function markDrawer(ls) {
    if (!drawerBuilt) return;
    var cards = document.querySelectorAll('.dcard.cur');
    for (var i = 0; i < cards.length; i++) cards[i].classList.remove('cur');
    ls.forEach(function (l) { var n = nOfLogical(l); if (n) { var c = $('.dcard[data-n="' + n + '"]'); if (c) c.classList.add('cur'); } });
  }
  function openDrawer() {
    buildDrawer(); markDrawer(visibleLogicals(curIdx));
    $('#scrim').hidden = false; $('#drawer').classList.add('open'); $('#drawer').setAttribute('aria-hidden', 'false');
    var cur = $('.dcard.cur'); if (cur) setTimeout(function () { cur.scrollIntoView({ block: 'center' }); }, 120);
  }
  function closeDrawer() {
    $('#scrim').hidden = true; $('#drawer').classList.remove('open'); $('#drawer').setAttribute('aria-hidden', 'true');
  }

  /* ---------------- التكبير ---------------- */
  var zN = 0, zLevel = 1;
  function applyZoom() {
    $('#zImg').style.width = (zLevel * 100) + '%';
    $('#zImg').style.cursor = zLevel > 1 ? 'zoom-out' : 'zoom-in';
  }
  function showZoom(n) {
    zN = Math.max(1, Math.min(NC, n)); zLevel = 1;
    $('#zTitle').textContent = zN + ' · ' + M.pages[zN - 1];
    $('#zImg').src = 'pages/' + pad(zN) + '.webp'; $('#zImg').alt = M.pages[zN - 1];
    $('#zScroll').scrollTop = 0; $('#zScroll').scrollLeft = 0; applyZoom();
  }
  function openZoom(n) { $('#zoom').hidden = false; showZoom(n); }
  function closeZoom() { $('#zoom').hidden = true; }
  function setLevel(l) { zLevel = Math.max(1, Math.min(4, l)); applyZoom(); }

  /* ---------------- ملء الشاشة ---------------- */
  function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement; }
  function toggleFs() {
    var d = document.documentElement;
    if (fsEl()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
    else { (d.requestFullscreen || d.webkitRequestFullscreen).call(d); }
  }

  /* ---------------- الدخول إلى العارض ---------------- */
  function parseHash() {
    var m = /#p=(\d+)/.exec(location.hash);
    if (m) { var n = +m[1]; if (n >= 1 && n <= NC) return logicalOfN(n); }
    return null;
  }
  function enter(startLogical) {
    $('#landing').hidden = true; $('#viewer').hidden = false;
    var first = (startLogical == null) ? L_COVER : startLogical;
    requestAnimationFrame(function () { requestAnimationFrame(function () { startBook(first); }); });
  }

  function init() {
    $('#brandTitle').textContent = M.title;
    $('#brandSub').textContent = M.school + ' · ' + M.year;
    $('#pdfBtn').setAttribute('href', M.pdf);
    $('#slider').max = N - 1;

    $('#enterHot').addEventListener('click', function () { enter(); });
    $('#enterBtn').addEventListener('click', function () { enter(); });
    $('#homeBtn').addEventListener('click', function () {
      $('#viewer').hidden = true; $('#landing').hidden = false; closeDrawer(); closeZoom();
      try { history.replaceState(null, '', location.pathname); } catch (e) { }
    });
    $('#btnNext').addEventListener('click', forward);
    $('#btnPrev').addEventListener('click', backward);
    $('#slider').addEventListener('input', function () { go(+this.value); });
    $('#indexBtn').addEventListener('click', openDrawer);
    $('#drawerClose').addEventListener('click', closeDrawer);
    $('#scrim').addEventListener('click', closeDrawer);
    if (!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)) $('#fsBtn').hidden = true;
    $('#fsBtn').addEventListener('click', toggleFs);

    $('#zClose').addEventListener('click', closeZoom);
    $('#zIn').addEventListener('click', function () { setLevel(zLevel + 0.5); });
    $('#zOut').addEventListener('click', function () { setLevel(zLevel - 0.5); });
    $('#zFit').addEventListener('click', function () { setLevel(1); });
    $('#zNext').addEventListener('click', function () { showZoom(zN + 1); });
    $('#zPrev').addEventListener('click', function () { showZoom(zN - 1); });
    $('#zImg').addEventListener('click', function () { setLevel(zLevel > 1 ? 1 : 2.5); });

    document.addEventListener('keydown', function (e) {
      if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName) && e.target.type !== 'range') {
        if (e.key === 'Escape') closeDrawer(); return;
      }
      if ($('#viewer').hidden) { if (e.key === 'Enter') enter(); return; }
      if (!$('#zoom').hidden) {
        if (e.key === 'Escape') closeZoom();
        else if (e.key === '+' || e.key === '=') setLevel(zLevel + 0.5);
        else if (e.key === '-') setLevel(zLevel - 0.5);
        else if (e.key === 'ArrowLeft') showZoom(zN + 1);
        else if (e.key === 'ArrowRight') showZoom(zN - 1);
        return;
      }
      switch (e.key) {
        case 'ArrowLeft': case 'PageDown': forward(); e.preventDefault(); break;
        case 'ArrowRight': case 'PageUp': backward(); e.preventDefault(); break;
        case 'Home': go(L_COVER); break;
        case 'End': go(L_BACK); break;
        case 'Escape': closeDrawer(); break;
      }
    });

    var h = parseHash();
    if (h != null || location.hash === '#cover') enter(h != null ? h : L_COVER);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.__mag = { go: go, goN: goN, state: function () { return { idx: curIdx, logical: curLogical }; } };
})();
