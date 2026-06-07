/**
 * Play homepage video reel clips when visible; pause when off-screen.
 */
(function () {
  const root = document.querySelector('[data-artform-video-reel]');
  if (!root || !('IntersectionObserver' in window)) return;

  const videos = [...root.querySelectorAll('video')];
  if (!videos.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (!(video instanceof HTMLVideoElement)) return;
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0.45 }
  );

  videos.forEach((video) => observer.observe(video));
})();
