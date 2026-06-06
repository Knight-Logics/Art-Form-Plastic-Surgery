/**
 * Blog — static Load More (reveals posts hidden at build time).
 */
(function () {
  const btn = document.querySelector('[data-artform-blog-loadmore]');
  if (!btn) return;

  const PAGE_SIZE = 6;

  btn.addEventListener('click', () => {
    const hidden = document.querySelectorAll('.jkit-post.artform-blog-post--hidden[hidden]');
    const batch = Array.from(hidden).slice(0, PAGE_SIZE);
    batch.forEach((post) => {
      post.removeAttribute('hidden');
      post.classList.remove('artform-blog-post--hidden');
      post.classList.add('artform-blog-post--revealed');
    });

    if (!document.querySelector('.jkit-post.artform-blog-post--hidden[hidden]')) {
      btn.closest('.jkit-block-pagination')?.remove();
    }
  });
})();
