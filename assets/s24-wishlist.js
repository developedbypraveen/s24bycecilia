/**
 * S24 wishlist — stored in the browser, works without an app.
 * Keys: product handles in localStorage `s24-wishlist`.
 */
(function () {
  const KEY = 's24-wishlist';

  function read() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function write(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
    document.dispatchEvent(new CustomEvent('s24:wishlist:update', { detail: { list } }));
  }

  function has(handle) {
    return read().includes(handle);
  }

  function toggle(handle) {
    if (!handle) return;
    const list = read();
    const i = list.indexOf(handle);
    if (i >= 0) list.splice(i, 1);
    else list.push(handle);
    write(list);
    return list.includes(handle);
  }

  function updateCount() {
    const count = read().length;
    document.querySelectorAll('[data-s24-wishlist-count]').forEach((el) => {
      el.textContent = String(count);
      el.hidden = false;
    });
    document.querySelectorAll('[data-s24-wishlist-toggle]').forEach((btn) => {
      const handle = btn.getAttribute('data-handle');
      btn.classList.toggle('is-active', has(handle));
      btn.setAttribute('aria-pressed', has(handle) ? 'true' : 'false');
    });
  }

  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-s24-wishlist-toggle]');
    if (!btn) return;
    event.preventDefault();
    event.stopPropagation();
    toggle(btn.getAttribute('data-handle'));
    updateCount();
  });

  document.addEventListener('s24:wishlist:update', updateCount);
  document.addEventListener('DOMContentLoaded', updateCount);
  window.S24Wishlist = { read, write, has, toggle };
})();
