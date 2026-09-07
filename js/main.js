/* ============================================
   Прелоадер: золотые лучи-стрелы летят со всех
   сторон к центру экрана; каждая, долетев до
   центра, поднимает opacity Фемиды от 0 до 1 —
   образ плавно проявляется.
   ============================================ */

(function () {
  'use strict';

  var intro  = document.getElementById('intro');
  var canvas = document.getElementById('intro-canvas');
  var themis = document.getElementById('themis-img');

  if (!intro || !canvas || !themis) return;

  var ctx = canvas.getContext('2d');

  var HIDE_AFTER = window.matchMedia('(min-width: 360px) and (max-width: 430px)').matches ? 2000 : 3300;
  var COLORS       = ['#B08D57', '#D6C7B0'];     /* строго матовое золото */
  var COUNT        = 90;                         /* число лучей */
  var OPACITY_STEP = 0.016;                      /* вклад одной стрелы в проявление */
  var CENTER_R     = 40;                         /* радиус «прибытия» в центр */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var w, h, cx, cy;
  var particles = [], rafId = null, imgOpacity = 0;

  function resize() {
    w = canvas.width  = window.innerWidth;
    h = canvas.height = window.innerHeight;
    cx = w / 2;
    cy = h / 2;
  }

  /* Луч-стрела стартует со случайной стороны экрана и летит к центру */
  function spawn() {
    var side = Math.floor(Math.random() * 4), x, y;
    if (side === 0) { x = Math.random() * w; y = -20;    }   /* верх  */
    if (side === 1) { x = Math.random() * w; y = h + 20; }   /* низ   */
    if (side === 2) { x = -20;    y = Math.random() * h; }   /* лево  */
    if (side === 3) { x = w + 20; y = Math.random() * h; }   /* право */

    var dx = cx - x, dy = cy - y;
    var dist  = Math.sqrt(dx * dx + dy * dy);
    var speed = 3 + Math.random() * 4;

    return {
      x: x, y: y,
      vx: dx / dist * speed,
      vy: dy / dist * speed,
      len: 14 + Math.random() * 26,              /* длина «хвоста» луча */
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: 0.3 + Math.random() * 0.5
    };
  }

  /* Каждая стрела, долетевшая до центра, добавляет картинке немного света */
  function ignite() {
    if (imgOpacity >= 1) return;
    imgOpacity = Math.min(1, imgOpacity + OPACITY_STEP);
    themis.style.opacity = imgOpacity.toFixed(3);
  }

  function tick() {
    /* мягкие шлейфы: подтираем прошлые кадры, canvas остаётся прозрачным
       и не закрывает Фемиду, лежащую под ним */
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';

    ctx.lineCap = 'round';
    ctx.lineWidth = 1.4;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      var dx = cx - p.x, dy = cy - p.y;

      /* стрела достигла центра — гаснет и проявляет образ */
      if (dx * dx + dy * dy < CENTER_R * CENTER_R) {
        ignite();
        particles[i] = spawn();
        continue;
      }

      var k = p.len / Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      ctx.globalAlpha = p.alpha;
      ctx.strokeStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(p.x - p.vx * k, p.y - p.vy * k);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    rafId = requestAnimationFrame(tick);
  }

  function hideIntro() {
    intro.classList.add('intro--hidden');
    setTimeout(function () {
      if (rafId) cancelAnimationFrame(rafId);
      intro.remove();
    }, 800);
  }

  if (reduceMotion) {
    /* без анимации: сразу показать образ и быстро убрать прелоадер */
    themis.style.opacity = '1';
    setTimeout(hideIntro, 900);
  } else {
    resize();
    window.addEventListener('resize', resize);
    for (var i = 0; i < COUNT; i++) particles.push(spawn());
    tick();
    setTimeout(hideIntro, HIDE_AFTER);
  }
})();

/* Переключение услуг в автономной статической версии. */
(function () {
  'use strict';

  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-services-tabs] .services__tab'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('[data-services-tabs] [data-service-panel]'));

  function activateTab(id) {
    tabs.forEach(function (tab) {
      var active = tab.getAttribute('data-service-id') === id;
      tab.setAttribute('data-state', active ? 'active' : 'inactive');
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    panels.forEach(function (panel) {
      panel.setAttribute('data-state', panel.getAttribute('data-service-panel') === id ? 'active' : 'inactive');
    });
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () {
      activateTab(tab.getAttribute('data-service-id'));
    });

    tab.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      var offset = event.key === 'ArrowDown' ? 1 : -1;
      var next = tabs[(index + offset + tabs.length) % tabs.length];
      next.focus();
      activateTab(next.getAttribute('data-service-id'));
    });
  });

  var accordionItems = Array.prototype.slice.call(document.querySelectorAll('[data-services-accordion] [data-service-item]'));

  function setItemOpen(item, open) {
    var trigger = item.querySelector('[data-slot="accordion-trigger"]');
    var content = item.querySelector('[data-service-content]');
    item.setAttribute('data-state', open ? 'open' : 'closed');
    trigger.setAttribute('data-state', open ? 'open' : 'closed');
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    content.setAttribute('data-state', open ? 'open' : 'closed');
    content.hidden = !open;
  }

  accordionItems.forEach(function (item) {
    var trigger = item.querySelector('[data-slot="accordion-trigger"]');
    trigger.addEventListener('click', function () {
      var shouldOpen = trigger.getAttribute('aria-expanded') !== 'true';
      accordionItems.forEach(function (other) {
        setItemOpen(other, other === item && shouldOpen);
      });
    });
  });
})();

/* Компактное мобильное меню. */
(function () {
  'use strict';

  var toggle = document.querySelector('.header__menu-toggle');
  var menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  function setMenuOpen(open) {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    toggle.classList.toggle('header__menu-toggle--open', open);
    menu.hidden = !open;
  }

  toggle.addEventListener('click', function () {
    setMenuOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  menu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      setMenuOpen(false);
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(false);
      toggle.focus();
    }
  });

  document.addEventListener('click', function (event) {
    if (toggle.getAttribute('aria-expanded') !== 'true') return;
    if (event.target instanceof Node && !toggle.contains(event.target) && !menu.contains(event.target)) {
      setMenuOpen(false);
    }
  });

  var tabletQuery = window.matchMedia('(min-width: 48rem)');
  function closeAboveMobile(event) {
    if (event.matches) setMenuOpen(false);
  }

  if (tabletQuery.addEventListener) {
    tabletQuery.addEventListener('change', closeAboveMobile);
  } else {
    tabletQuery.addListener(closeAboveMobile);
  }
})();

/* Фактические высоты шапки и футера используются для якорных переходов
   и компоновки финального экрана. */
(function () {
  'use strict';

  var header = document.querySelector('.header');
  var footer = document.querySelector('.footer');
  if (!header) return;

  function syncEdgeHeights() {
    document.documentElement.style.setProperty(
      '--header-height',
      Math.ceil(header.getBoundingClientRect().height) + 'px'
    );

    if (footer) {
      document.documentElement.style.setProperty(
        '--footer-height',
        Math.ceil(footer.getBoundingClientRect().height) + 'px'
      );
    }
  }

  syncEdgeHeights();
  window.addEventListener('resize', syncEdgeHeights);

  if ('ResizeObserver' in window) {
    var observer = new ResizeObserver(syncEdgeHeights);
    observer.observe(header);
    if (footer) observer.observe(footer);
  }
})();

/* На узком мобильном экране контакты открываются сразу под закреплённой
   шапкой; на остальных размерах сохраняется прежняя прокрутка к футеру. */
(function () {
  'use strict';

  var contactLinks = document.querySelectorAll('a[href="#contacts"]');
  var contacts = document.getElementById('contacts');
  var headerInner = document.querySelector('.header__inner');
  var narrowMobile = window.matchMedia('(min-width: 360px) and (max-width: 430px)');
  if (!contactLinks.length) return;

  contactLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();

      if (window.history && window.history.pushState) {
        window.history.pushState(null, '', '#contacts');
      }

      var behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

      if (narrowMobile.matches && contacts) {
        window.requestAnimationFrame(function () {
          var headerHeight = headerInner ? Math.ceil(headerInner.getBoundingClientRect().height) : 0;
          document.documentElement.style.setProperty('--header-height', headerHeight + 'px');

          window.scrollTo({
            top: Math.max(0, contacts.getBoundingClientRect().top + window.scrollY - headerHeight),
            behavior: behavior
          });
        });
        return;
      }

      window.scrollTo({
        top: Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
        behavior: behavior
      });
    });
  });
})();

/* Мягкое золотистое свечение: плавное следование за мышью и короткий
   ненавязчивый отклик при касании интерактивных элементов. */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var glow = document.createElement('span');
  glow.className = 'cursor-glow';
  glow.setAttribute('aria-hidden', 'true');
  document.body.appendChild(glow);

  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var currentX = 0;
  var currentY = 0;
  var targetX = 0;
  var targetY = 0;
  var started = false;
  var frame = null;

  function renderGlow() {
    currentX += (targetX - currentX) * 0.18;
    currentY += (targetY - currentY) * 0.18;
    glow.style.transform = 'translate3d(' + currentX + 'px,' + currentY + 'px,0) translate(-50%,-50%)';

    if (Math.abs(targetX - currentX) > 0.15 || Math.abs(targetY - currentY) > 0.15) {
      frame = requestAnimationFrame(renderGlow);
    } else {
      frame = null;
    }
  }

  if (finePointer) {
    document.addEventListener('pointermove', function (event) {
      if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;

      targetX = event.clientX;
      targetY = event.clientY;

      if (!started) {
        currentX = targetX;
        currentY = targetY;
        started = true;
      }

      glow.classList.add('cursor-glow--visible');
      if (!frame) frame = requestAnimationFrame(renderGlow);
    }, { passive: true });

    document.addEventListener('pointerover', function (event) {
      if (event.target instanceof Element && event.target.closest('a, button, [role="button"], summary')) {
        glow.classList.add('cursor-glow--interactive');
      }
    }, { passive: true });

    document.addEventListener('pointerout', function (event) {
      var from = event.target instanceof Element ? event.target.closest('a, button, [role="button"], summary') : null;
      var to = event.relatedTarget instanceof Element ? event.relatedTarget.closest('a, button, [role="button"], summary') : null;
      if (from && from !== to) glow.classList.remove('cursor-glow--interactive');
    }, { passive: true });

    document.documentElement.addEventListener('mouseleave', function () {
      glow.classList.remove('cursor-glow--visible', 'cursor-glow--interactive');
    });
  }

  var narrowTouch = window.matchMedia('(min-width: 360px) and (max-width: 430px) and (pointer: coarse)');
  var touchStart = null;
  var touchMoved = false;
  var tapAnimation = null;

  function resetTouch() {
    touchStart = null;
    touchMoved = false;
  }

  function showTapGlow(x, y) {
    var position = 'translate3d(' + x + 'px,' + y + 'px,0) translate(-50%,-50%)';

    if (tapAnimation) tapAnimation.cancel();

    glow.style.display = 'block';
    glow.style.width = '5.5rem';
    glow.style.height = '5.5rem';
    glow.style.background = 'radial-gradient(circle, rgba(214, 182, 108, 0.18) 0%, rgba(182, 154, 104, 0.07) 40%, transparent 72%)';
    glow.style.transition = 'none';
    glow.style.transform = position;

    tapAnimation = glow.animate([
      { opacity: 0, transform: position + ' scale(0.72)' },
      { opacity: 0.72, transform: position + ' scale(0.88)', offset: 0.22 },
      { opacity: 0, transform: position + ' scale(1)' }
    ], {
      duration: 380,
      easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      fill: 'both'
    });

    tapAnimation.addEventListener('finish', function () {
      glow.style.display = '';
      glow.style.width = '';
      glow.style.height = '';
      glow.style.background = '';
      glow.style.opacity = '';
      glow.style.transition = '';
      glow.style.transform = '';
      tapAnimation = null;
    }, { once: true });
  }

  document.addEventListener('pointerdown', function (event) {
    if (!narrowTouch.matches || event.pointerType !== 'touch') return;

    touchStart = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      time: Date.now()
    };
    touchMoved = false;
  }, { passive: true });

  document.addEventListener('pointermove', function (event) {
    if (!touchStart || event.pointerId !== touchStart.id) return;

    if (Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y) > 10) {
      touchMoved = true;
    }
  }, { passive: true });

  document.addEventListener('pointerup', function (event) {
    if (!touchStart || event.pointerId !== touchStart.id) return;

    var isTap = !touchMoved && Date.now() - touchStart.time <= 500;
    if (isTap) showTapGlow(event.clientX, event.clientY);
    resetTouch();
  }, { passive: true });

  document.addEventListener('pointercancel', resetTouch, { passive: true });
 })();
