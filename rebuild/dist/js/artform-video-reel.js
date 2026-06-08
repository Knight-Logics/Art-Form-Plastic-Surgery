/**
 * Homepage video reel — play when visible, mute + fullscreen controls.
 */
(function () {
  const root = document.querySelector('[data-artform-video-reel]');
  if (!root) return;

  const cards = [...root.querySelectorAll('.artform-video-reel__card')];

  function syncMuteButton(video, btn) {
    const muted = video.muted;
    btn.classList.toggle('is-muted', muted);
    btn.setAttribute('aria-label', muted ? 'Unmute video' : 'Mute video');
    btn.setAttribute('aria-pressed', muted ? 'true' : 'false');
  }

  function enterFullscreen(video) {
    if (video.requestFullscreen) {
      video.requestFullscreen().catch(() => {});
      return;
    }
    if (video.webkitEnterFullscreen) {
      video.webkitEnterFullscreen();
    }
  }

  const bindControl = (el, handler) => {
    el.addEventListener('click', handler);
    el.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handler(event);
      }
    });
  };

  cards.forEach((card) => {
    const video = card.querySelector('video');
    const muteBtn = card.querySelector('[data-artform-mute]');
    const fsBtn = card.querySelector('[data-artform-fs]');
    if (!(video instanceof HTMLVideoElement)) return;

    video.muted = true;
    video.defaultMuted = true;

    if (muteBtn) {
      syncMuteButton(video, muteBtn);
      bindControl(muteBtn, () => {
        video.muted = !video.muted;
        syncMuteButton(video, muteBtn);
      });
    }

    if (fsBtn) {
      bindControl(fsBtn, () => {
        if (document.fullscreenElement === video) {
          document.exitFullscreen().catch(() => {});
          return;
        }
        enterFullscreen(video);
      });
    }
  });

  const videos = cards
    .map((card) => card.querySelector('video'))
    .filter((video) => video instanceof HTMLVideoElement);

  if (!videos.length || !('IntersectionObserver' in window)) return;

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
