/**
 * Static contact / appointment forms — prefill booking page on submit.
 */
(function () {
  const forms = document.querySelectorAll('.artform-contact-form__form');
  if (!forms.length) return;

  forms.forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const root = form.closest('.artform-contact-form');
      const data = Object.fromEntries(new FormData(form).entries());

      try {
        sessionStorage.setItem('artform_consult_prefill', JSON.stringify(data));
      } catch (_) {
        /* ignore */
      }

      if (root) {
        root.classList.add('is-submitted');
        const thanks = root.querySelector('.artform-contact-form__thanks');
        if (thanks) thanks.hidden = false;
      }

      const params = new URLSearchParams({ from: form.dataset.source || 'contact' });
      const first = data.first || '';
      const last = data.last || '';
      const name = data.name || [first, last].filter(Boolean).join(' ').trim();
      if (name) params.set('name', name);
      if (data.phone) params.set('phone', data.phone);
      if (data.email) params.set('email', data.email);
      if (data.message) params.set('message', data.message);

      window.setTimeout(() => {
        window.location.href = `/book-consultation/?${params.toString()}`;
      }, 650);
    });
  });
})();
