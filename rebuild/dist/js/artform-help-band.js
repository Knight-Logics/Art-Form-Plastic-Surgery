/**
 * Homepage help band — play background clips when visible; pause off-screen.
 */
(function () {
  const band = document.querySelector('.artform-help-band');
  if (!band) return;

  const videos = [...band.querySelectorAll('.artform-help-band__bg-video')];
  if (!videos.length) return;

  const playAll = () => {
    videos.forEach((video) => {
      if (video instanceof HTMLVideoElement) video.play().catch(() => {});
    });
  };

  const pauseAll = () => {
    videos.forEach((video) => {
      if (video instanceof HTMLVideoElement) video.pause();
    });
  };

  if (!('IntersectionObserver' in window)) {
    playAll();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) playAll();
        else pauseAll();
      });
    },
    { threshold: 0.18 }
  );

  observer.observe(band);
})();
