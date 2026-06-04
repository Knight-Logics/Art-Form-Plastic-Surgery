(function () {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Defer third-party chat until interaction (performance)
  const CHAT_SRC = document.body.dataset.chatSrc;
  let chatLoaded = false;
  function loadChat() {
    if (!CHAT_SRC || chatLoaded) return;
    chatLoaded = true;
    const s = document.createElement('script');
    s.src = CHAT_SRC;
    s.async = true;
    document.body.appendChild(s);
  }
  ['pointerdown', 'scroll', 'keydown'].forEach((ev) => {
    window.addEventListener(ev, loadChat, { once: true, passive: true });
  });
  window.addEventListener('load', () => setTimeout(loadChat, 20000), { once: true });
})();
