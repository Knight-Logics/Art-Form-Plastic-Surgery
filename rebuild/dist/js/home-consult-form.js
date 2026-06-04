/**
 * Homepage hero consultation form — prefill + redirect to booking page.
 */
(function () {
  const root = document.querySelector('.artform-consult-form');
  const form = root?.querySelector('.artform-consult-form__form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      sessionStorage.setItem('artform_consult_prefill', JSON.stringify(data));
    } catch (_) {
      /* ignore */
    }
    root.classList.add('is-submitted');
    const thanks = root.querySelector('.artform-consult-form__thanks');
    if (thanks) thanks.hidden = false;

    const params = new URLSearchParams({ from: 'hero' });
    if (data.name) params.set('name', data.name);
    if (data.phone) params.set('phone', data.phone);
    if (data.email) params.set('email', data.email);

    window.setTimeout(() => {
      window.location.href = `/book-consultation/?${params.toString()}`;
    }, 600);
  });
})();
