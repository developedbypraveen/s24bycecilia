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

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-s24-fade]').forEach(initFadeSlider);
    document.querySelectorAll('[data-s24-hero]').forEach(initHeroSlider);
  });
})();
