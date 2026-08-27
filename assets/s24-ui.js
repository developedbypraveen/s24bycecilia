/**
 * S24 UI helpers — fade sliders (top bar + hero)
 */
(function () {
  function initFadeSlider(root) {
    if (root.dataset.s24Ready) return;
    root.dataset.s24Ready = 'true';
    const slides = Array.from(root.querySelectorAll('[data-s24-slide]'));
    if (slides.length < 2) return;

    const interval = Number(root.dataset.interval || 4000);
    let index = 0;

    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === 0);
    });

    if (!interval) return;

    setInterval(() => {
      slides[index].classList.remove('is-active');
      index = (index + 1) % slides.length;
      slides[index].classList.add('is-active');
    }, interval);
  }

  function initHeroSlider(root) {
    if (root.dataset.s24Ready) return;
    root.dataset.s24Ready = 'true';
    const slides = Array.from(root.querySelectorAll('[data-s24-hero-slide]'));
    if (!slides.length) return;

    const dots = Array.from(root.querySelectorAll('[data-s24-hero-dot]'));
    const prev = root.querySelector('[data-s24-hero-prev]');
    const next = root.querySelector('[data-s24-hero-next]');
    const interval = Number(root.dataset.interval || 6000);
    let index = 0;
    let timer;

    function go(nextIndex) {
      slides[index].classList.remove('is-active');
      if (dots[index]) dots[index].classList.remove('is-active');
      index = (nextIndex + slides.length) % slides.length;
      slides[index].classList.add('is-active');
      if (dots[index]) dots[index].classList.add('is-active');
    }

    function start() {
      if (slides.length < 2) return;
      stop();
      timer = setInterval(() => go(index + 1), interval);
    }

    function stop() {
      if (timer) clearInterval(timer);
    }

    prev && prev.addEventListener('click', () => {
      go(index - 1);
      start();
    });
    next && next.addEventListener('click', () => {
      go(index + 1);
      start();
    });
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        go(i);
        start();
      });
    });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    start();
  }

  function initCustomFit() {
    const panels = document.querySelectorAll('[data-s24-custom-fit]');
    if (!panels.length) return;

    function selectedSizeIsCustom() {
      const checked = document.querySelector(
        'variant-selects input[type="radio"]:checked, variant-radios input[type="radio"]:checked'
      );
      if (checked && String(checked.value).toLowerCase().trim() === 'custom') return true;

      const selects = document.querySelectorAll('variant-selects select, .product-form__input select');
      for (const sel of selects) {
        const label = (sel.getAttribute('name') || sel.id || '').toLowerCase();
        const optText = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : '';
        if (
          String(sel.value).toLowerCase().trim() === 'custom' ||
          (label.includes('option') && String(optText).toLowerCase().trim() === 'custom')
        ) {
          return true;
        }
      }

      const fieldsets = document.querySelectorAll('fieldset.product-form__input');
      for (const fs of fieldsets) {
        const legend = fs.querySelector('legend');
        if (!legend) continue;
        if (!/size/i.test(legend.textContent || '')) continue;
        const c = fs.querySelector('input:checked');
        if (c && String(c.value).toLowerCase().trim() === 'custom') return true;
      }
      return false;
    }

    function getVisibleCustomFields(form) {
      const fields = [];
      panels.forEach((panel) => {
        if (panel.hidden) return;
        panel.querySelectorAll('[data-s24-custom-field]').forEach((field) => {
          if (field.disabled || field.type === 'hidden') return;
          if (form && field.form && field.form !== form) return;
          fields.push(field);
        });
      });
      return fields;
    }

    function clearFieldErrors(fields) {
      fields.forEach((field) => {
        field.classList.remove('is-error');
        field.removeAttribute('aria-invalid');
      });
      panels.forEach((panel) => {
        const err = panel.querySelector('[data-s24-custom-error]');
        if (err) {
          err.hidden = true;
          err.textContent = '';
        }
      });
    }

    function sync() {
      const isCustom = selectedSizeIsCustom();
      panels.forEach((panel) => {
        panel.hidden = !isCustom;
        panel.querySelectorAll('[data-s24-custom-field]').forEach((field) => {
          field.disabled = !isCustom;
          if (isCustom && field.type !== 'hidden') {
            field.required = true;
            field.setAttribute('aria-required', 'true');
          } else {
            field.required = false;
            field.removeAttribute('aria-required');
            field.classList.remove('is-error');
            field.removeAttribute('aria-invalid');
            if (field.type !== 'hidden') field.value = '';
          }
        });
        const err = panel.querySelector('[data-s24-custom-error]');
        if (err && !isCustom) {
          err.hidden = true;
          err.textContent = '';
        }
      });
    }

    window.s24ValidateCustomFit = function (form) {
      if (!selectedSizeIsCustom()) {
        return { ok: true };
      }

      const fields = getVisibleCustomFields(form);
      clearFieldErrors(fields);

      const empty = fields.filter((field) => !String(field.value || '').trim());
      if (!empty.length) {
        return { ok: true };
      }

      empty.forEach((field) => {
        field.classList.add('is-error');
        field.setAttribute('aria-invalid', 'true');
      });

      const message = 'Please fill in all custom measurement fields before adding to cart.';
      panels.forEach((panel) => {
        if (panel.hidden) return;
        const err = panel.querySelector('[data-s24-custom-error]');
        if (err) {
          err.hidden = false;
          err.textContent = message;
        }
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });

      empty[0].focus();
      return { ok: false, message };
    };

    document.addEventListener('change', (e) => {
      if (
        e.target.matches(
          'variant-selects input, variant-radios input, variant-selects select, .product-form__input input, .product-form__input select'
        )
      ) {
        sync();
      }
    });

    document.addEventListener('input', (e) => {
      if (!e.target.matches('[data-s24-custom-field]')) return;
      e.target.classList.remove('is-error');
      e.target.removeAttribute('aria-invalid');
      const panel = e.target.closest('[data-s24-custom-fit]');
      const err = panel && panel.querySelector('[data-s24-custom-error]');
      if (err) {
        const stillEmpty = getVisibleCustomFields().some((field) => !String(field.value || '').trim());
        if (!stillEmpty) {
          err.hidden = true;
          err.textContent = '';
        }
      }
    });

    document.addEventListener('variant:change', sync);
    sync();
  }

  function initCardRotate(root) {
    const slides = Array.from(root.querySelectorAll('[data-s24-card-rotate-img]'));
    const bars = Array.from(root.querySelectorAll('[data-s24-card-bar]'));
    if (slides.length < 2) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const interval = Number(root.getAttribute('data-interval') || 3200);
    root.style.setProperty('--s24-card-interval', `${interval}ms`);

    let index = 0;
    let timer = null;
    let animating = false;

    const clearSlideState = (slide) => {
      slide.classList.remove('is-active', 'is-leaving', 'is-prep');
      slide.style.removeProperty('transform');
      slide.style.removeProperty('transition');
    };

    const setBars = (activeIndex) => {
      bars.forEach((bar, i) => {
        bar.classList.remove('is-active', 'is-done', 'is-paused');
        const fill = bar.querySelector('.s24-card-auto__bar-fill');
        if (fill) {
          fill.style.animation = 'none';
          void fill.offsetWidth;
          fill.style.animation = '';
        }
        if (i < activeIndex) bar.classList.add('is-done');
        if (i === activeIndex) bar.classList.add('is-active');
      });
    };

    const goTo = (nextIndex) => {
      if (animating || nextIndex === index) return;
      animating = true;

      const current = slides[index];
      const next = slides[nextIndex];

      // Park next just off the right edge (no transition), then slide in
      next.classList.remove('is-active', 'is-leaving');
      next.classList.add('is-prep');
      void next.offsetWidth;

      current.classList.remove('is-active');
      current.classList.add('is-leaving');

      next.classList.remove('is-prep');
      next.classList.add('is-active');

      window.setTimeout(() => {
        clearSlideState(current);
        // Keep only the active class on the visible slide
        slides.forEach((slide, i) => {
          if (i !== nextIndex) clearSlideState(slide);
        });
        next.classList.add('is-active');
        animating = false;
      }, 580);

      index = nextIndex;
      setBars(index);
    };

    const tick = () => {
      goTo((index + 1) % slides.length);
    };

    // Ensure a clean start
    slides.forEach((slide, i) => {
      clearSlideState(slide);
      if (i === 0) slide.classList.add('is-active');
    });
    setBars(0);
    timer = window.setInterval(tick, interval);

    root.addEventListener(
      'mouseenter',
      () => {
        if (timer) {
          window.clearInterval(timer);
          timer = null;
        }
        const active = bars[index];
        if (active) active.classList.add('is-paused');
      },
      { passive: true }
    );

    root.addEventListener(
      'mouseleave',
      () => {
        bars.forEach((bar) => bar.classList.remove('is-paused'));
        if (!timer) {
          setBars(index);
          timer = window.setInterval(tick, interval);
        }
      },
      { passive: true }
    );
  }

  function initSaleSlider(root) {
    const track = root.querySelector('[data-s24-sale-track]');
    const items = Array.from(root.querySelectorAll('[data-s24-sale-item]'));
    const prev = root.querySelector('[data-s24-sale-prev]');
    const next = root.querySelector('[data-s24-sale-next]');
    if (!track || items.length === 0) return;

    const gap = 12;
    let index = 0;
    const desktopVisible = Math.max(1, parseInt(root.dataset.visible, 10) || 4);
    let visible = desktopVisible;

    const measure = () => {
      const viewport = root.querySelector('.s24-sale__viewport');
      if (!viewport) return;
      visible = window.matchMedia('(min-width: 750px)').matches
        ? desktopVisible
        : Math.min(desktopVisible, 2);
      const width = (viewport.clientWidth - gap * (visible - 1)) / visible;
      items.forEach((item) => {
        item.style.flex = `0 0 ${width}px`;
        item.style.width = `${width}px`;
        item.style.maxWidth = `${width}px`;
      });
      const maxIndex = Math.max(0, items.length - visible);
      if (index > maxIndex) index = maxIndex;
      track.style.transform = `translate3d(-${index * (width + gap)}px, 0, 0)`;
      if (prev) prev.disabled = index <= 0;
      if (next) next.disabled = index >= maxIndex;
    };

    const go = (dir) => {
      const maxIndex = Math.max(0, items.length - visible);
      index = Math.min(maxIndex, Math.max(0, index + dir));
      measure();
    };

    if (prev) prev.addEventListener('click', () => go(-1));
    if (next) next.addEventListener('click', () => go(1));
    window.addEventListener('resize', measure);
    measure();
  }

  function initPopular(root) {
    const tabs = Array.from(root.querySelectorAll('[data-s24-pop-tab]'));
    const panels = Array.from(root.querySelectorAll('[data-s24-pop-panel]'));
    const prev = root.querySelector('[data-s24-pop-prev]');
    const next = root.querySelector('[data-s24-pop-next]');
    const gap = 16;
    let index = 0;
    let visible = 5;

    const activePanel = () => root.querySelector('.s24-pop__panel.is-active');

    const measure = () => {
      const panel = activePanel();
      if (!panel) return;
      const viewport = panel.querySelector('.s24-pop__viewport');
      const track = panel.querySelector('[data-s24-pop-track]');
      const items = Array.from(panel.querySelectorAll('[data-s24-pop-item]'));
      if (!viewport || !track || items.length === 0) return;

      visible = window.matchMedia('(min-width: 990px)').matches
        ? 5
        : window.matchMedia('(min-width: 750px)').matches
          ? 3
          : 2;

      const width = (viewport.clientWidth - gap * (visible - 1)) / visible;
      items.forEach((item) => {
        item.style.flex = `0 0 ${width}px`;
        item.style.width = `${width}px`;
        item.style.maxWidth = `${width}px`;
      });

      const maxIndex = Math.max(0, items.length - visible);
      if (index > maxIndex) index = maxIndex;
      track.style.transform = `translate3d(-${index * (width + gap)}px, 0, 0)`;
      if (prev) prev.disabled = index <= 0;
      if (next) next.disabled = index >= maxIndex || items.length <= visible;
    };

    const go = (dir) => {
      const panel = activePanel();
      if (!panel) return;
      const items = panel.querySelectorAll('[data-s24-pop-item]');
      const maxIndex = Math.max(0, items.length - visible);
      index = Math.min(maxIndex, Math.max(0, index + dir));
      measure();
    };

    const activate = (tabIndex) => {
      tabs.forEach((tab, i) => {
        const on = i === tabIndex;
        tab.classList.toggle('is-active', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panels.forEach((panel, i) => {
        const on = i === tabIndex;
        panel.classList.toggle('is-active', on);
        if (on) panel.removeAttribute('hidden');
        else panel.setAttribute('hidden', '');
      });
      index = 0;
      measure();
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => activate(i));
    });
    if (prev) prev.addEventListener('click', () => go(-1));
    if (next) next.addEventListener('click', () => go(1));
    window.addEventListener('resize', measure);
    measure();
  }

  function initPdpTabs(root) {
    const tabs = Array.from(root.querySelectorAll('[data-s24-pdp-tab]'));
    const panels = Array.from(root.querySelectorAll('.s24-pdp-tabs__panel'));
    if (tabs.length === 0 || panels.length === 0) return;

    const activate = (key) => {
      tabs.forEach((tab) => {
        const isActive = tab.dataset.s24PdpTab === key;
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      panels.forEach((panel) => {
        const isActive = panel.id.includes(`-${key}-`);
        panel.classList.toggle('is-active', isActive);
        panel.hidden = !isActive;
      });
    };

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => activate(tab.dataset.s24PdpTab));
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-s24-fade]').forEach(initFadeSlider);
    document.querySelectorAll('[data-s24-hero]').forEach(initHeroSlider);
    document.querySelectorAll('[data-s24-card-rotate]').forEach(initCardRotate);
    document.querySelectorAll('[data-s24-sale-slider]').forEach(initSaleSlider);
    document.querySelectorAll('[data-s24-popular]').forEach(initPopular);
    document.querySelectorAll('[data-s24-pdp-tabs]').forEach(initPdpTabs);
    initCustomFit();

    const backTop = document.querySelector('[data-s24-back-top]');
    if (backTop) {
      const onScroll = () => {
        backTop.classList.toggle('is-visible', window.scrollY > 480);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      backTop.addEventListener('click', (event) => {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  });
})();
