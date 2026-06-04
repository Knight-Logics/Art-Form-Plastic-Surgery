/* Initialize Elementor/JKit carousels when Swiper is available */
(function () {
  function init() {
    if (typeof Swiper === 'undefined') return;
    document.querySelectorAll('.elementor-main-swiper, .swiper').forEach((el, i) => {
      if (el.swiper) return;
      try {
        new Swiper(el, {
          loop: true,
          slidesPerView: 1,
          spaceBetween: 24,
          autoplay: { delay: 5000, disableOnInteraction: false },
          pagination: { el: el.querySelector('.swiper-pagination'), clickable: true },
          navigation: {
            nextEl: el.querySelector('.swiper-button-next'),
            prevEl: el.querySelector('.swiper-button-prev'),
          },
          breakpoints: {
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          },
        });
      } catch (e) {
        console.warn('Swiper init', i, e);
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else init();
})();
