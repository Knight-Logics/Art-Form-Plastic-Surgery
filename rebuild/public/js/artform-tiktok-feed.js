(function initArtFormTikTokFeed() {
  var root = document.querySelector('[data-artform-tiktok]');
  if (!root) return;

  var headerEl = root.querySelector('[data-tiktok-header]');
  var gridEl = root.querySelector('[data-tiktok-grid]');

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function render(data) {
    if (!data || !Array.isArray(data.videos)) return;

    var avatar = data.avatar || '/images/social/tiktok.svg';
    var handle = escapeHtml(data.username ? '@' + data.username : '@faceplasticsurgeon');
    var followUrl = data.followUrl || 'https://www.tiktok.com/@faceplasticsurgeon';

    headerEl.innerHTML =
      '<div class="artform-tiktok__profile">' +
      '<img class="artform-tiktok__avatar" src="' +
      escapeHtml(avatar) +
      '" width="56" height="56" alt="" decoding="async" loading="lazy">' +
      '<p class="artform-tiktok__handle">' +
      handle +
      '</p>' +
      '</div>' +
      '<a class="artform-tiktok__follow" href="' +
      escapeHtml(followUrl) +
      '" target="_blank" rel="noopener noreferrer">' +
      '<img src="/images/social/tiktok.svg" width="18" height="18" alt="" aria-hidden="true">' +
      'Follow on TikTok</a>';

    gridEl.innerHTML = data.videos
      .map(function (video) {
        var url = escapeHtml(video.shareUrl || followUrl);
        var thumb = escapeHtml(video.thumb || '');
        var label = escapeHtml(video.caption || 'Watch on TikTok');
        return (
          '<a class="artform-tiktok__card" href="' +
          url +
          '" target="_blank" rel="noopener noreferrer" aria-label="' +
          label +
          '">' +
          '<span class="artform-tiktok__thumb" style="background-image:url(' +
          "'" +
          thumb +
          "'" +
          ')"></span>' +
          '<span class="artform-tiktok__play" aria-hidden="true"></span>' +
          '</a>'
        );
      })
      .join('');
  }

  fetch('/data/tiktok-feed.json?v=20260606', { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) return null;
      return response.json();
    })
    .catch(function () {
      return null;
    })
    .then(render);
})();
