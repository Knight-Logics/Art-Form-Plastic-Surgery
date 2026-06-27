(function initArtFormGoogleReviews() {
  var root = document.querySelector('.artform-greviews');
  if (!root) {
    return;
  }

  var viewport = root.querySelector('.artform-greviews__viewport');
  var track = root.querySelector('[data-afg-track]');
  var prev = root.querySelector('[data-afg-prev]');
  var next = root.querySelector('[data-afg-next]');
  var summaryEl = root.querySelector('[data-afg-summary]');
  var tabs = root.querySelectorAll('[data-afg-tab]');

  if (!viewport || !track || !prev || !next) {
    return;
  }

  var AVATAR_COLORS = ['#1e6b2e', '#c0392b', '#1a56c4', '#7c3aed', '#0f766e', '#b45309'];
  var OWNER_NAME = 'Art Form Plastic Surgery';
  var allReviews = [];
  var activeFilter = 'all';
  var pageIndex = 0;
  var TRACK_GAP = 12;
  var MOBILE_MQ = window.matchMedia('(max-width: 639px)');

  function isMobileLayout() {
    return MOBILE_MQ.matches;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function initial(name) {
    var clean = String(name || '').trim();
    return clean ? clean.charAt(0).toUpperCase() : '?';
  }

  function stars(count) {
    var n = Math.max(1, Math.min(5, Number(count) || 5));
    var out = '';
    for (var i = 0; i < n; i += 1) {
      out += '\u2605';
    }
    return out;
  }

  function avatarColor(name, index) {
    if (name) {
      var sum = 0;
      for (var i = 0; i < name.length; i += 1) {
        sum += name.charCodeAt(i);
      }
      return AVATAR_COLORS[sum % AVATAR_COLORS.length];
    }
    return AVATAR_COLORS[index % AVATAR_COLORS.length];
  }

  function hasReply(review) {
    return Boolean(review && review.reply && review.reply.text);
  }

  function filterReviews(list) {
    if (activeFilter === 'replied') {
      return list.filter(hasReply);
    }
    if (activeFilter === 'unreplied') {
      return list.filter(function (item) {
        return !hasReply(item);
      });
    }
    return list.slice();
  }

  function cardMarkup(review, index) {
    var name = review.name || 'Google User';
    var meta = review.meta || 'Google review';
    var bg = review.avatarColor || avatarColor(name, index);
    var starLabel = String(Number(review.stars) || 5) + ' stars';
    var textStyle = bg === '#FBBC05' ? ' style="color:#1d1c1f;"' : '';
    var replyHtml = '';

    if (hasReply(review) && !isMobileLayout()) {
      replyHtml =
        '<div class="artform-greviews__reply">' +
        '<strong>' +
        escapeHtml(OWNER_NAME) +
        '</strong>' +
        '<span class="artform-greviews__reply-date">' +
        escapeHtml(review.reply.date || '') +
        '</span>' +
        '<p>' +
        escapeHtml(review.reply.text) +
        '</p>' +
        '</div>';
    }

    return (
      '<article class="artform-greviews__card">' +
      '<div class="artform-greviews__card-head">' +
      '<span class="artform-greviews__avatar" style="background:' +
      escapeHtml(bg) +
      ';"' +
      textStyle +
      ' aria-hidden="true">' +
      escapeHtml(initial(name)) +
      '</span>' +
      '<div><h3 class="artform-greviews__name">' +
      escapeHtml(name) +
      '</h3>' +
      '<div class="artform-greviews__meta">' +
      escapeHtml(meta) +
      '</div></div></div>' +
      '<div class="artform-greviews__card-stars" role="img" aria-label="' +
      escapeHtml(starLabel) +
      '">' +
      stars(review.stars) +
      '</div>' +
      '<p class="artform-greviews__text">' +
      escapeHtml(review.text || '') +
      '</p>' +
      '<div class="artform-greviews__date">' +
      escapeHtml(review.date || '') +
      '</div>' +
      replyHtml +
      '</article>'
    );
  }

  function applySummary(payload) {
    if (!summaryEl || !payload) {
      return;
    }
    var rating = Number(payload.ratingValue || 5).toFixed(1);
    var count = Number(payload.reviewCount || 0);
    summaryEl.textContent = rating + ' \u2022 ' + count + ' reviews';
  }

  function viewportWidth() {
    var w = Math.floor(viewport.clientWidth || viewport.getBoundingClientRect().width);
    if (w > 0) {
      return w;
    }
    var carousel = root.querySelector('.artform-greviews__carousel');
    return carousel ? Math.floor(carousel.clientWidth) : 0;
  }

  /** Cards per slide — only use N columns if N cards actually fit in the viewport */
  function perView() {
    var w = viewportWidth();
    if (w < 1) {
      return 1;
    }
    if (w < 640) {
      return 1;
    }
    var minCard = 200;
    var maxCards = 3;
    var n = maxCards;
    while (n > 1) {
      if (w >= minCard * n + TRACK_GAP * (n - 1)) {
        break;
      }
      n -= 1;
    }
    return n;
  }

  function pageCount() {
    var cards = track.children.length;
    return Math.max(1, Math.ceil(cards / perView()));
  }

  function applyCardWidth(cardW) {
    viewport.style.setProperty('--afg-card-width', cardW + 'px');
    Array.prototype.forEach.call(track.children, function (card) {
      card.style.flex = '0 0 ' + cardW + 'px';
      card.style.width = cardW + 'px';
      card.style.minWidth = cardW + 'px';
      card.style.maxWidth = cardW + 'px';
    });
  }

  /** Size cards in px from the viewport — never % (breaks inside width:max-content tracks). */
  function syncCardWidths() {
    var vpW = viewportWidth();
    var n = perView();
    var gap = n > 1 ? TRACK_GAP : 0;
    var cardW = vpW > 0 ? Math.floor((vpW - gap * (n - 1)) / n) : 260;
    if (n === 1 && vpW > 0) {
      cardW = vpW;
    } else if (!isMobileLayout() && vpW >= 640) {
      cardW = Math.max(180, cardW);
    }
    applyCardWidth(cardW);
    return cardW;
  }

  function updateCarousel() {
    var pages = pageCount();
    if (pageIndex > pages - 1) {
      pageIndex = pages - 1;
    }
    if (pageIndex < 0) {
      pageIndex = 0;
    }
    var cardW = syncCardWidths();
    var n = perView();
    var gap = n > 1 ? TRACK_GAP : 0;
    var offset = pageIndex * n * (cardW + gap);
    track.style.transform = 'translateX(' + -offset + 'px)';
    prev.disabled = pageIndex === 0;
    next.disabled = pageIndex === pages - 1;
  }

  function renderTrack() {
    var visible = filterReviews(allReviews);
    track.innerHTML = visible.map(cardMarkup).join('');
    pageIndex = 0;
    updateCarousel();
    window.requestAnimationFrame(function () {
      updateCarousel();
      window.requestAnimationFrame(updateCarousel);
    });
  }

  function onLayoutChange() {
    var pages = pageCount();
    if (pageIndex > pages - 1) {
      pageIndex = pages - 1;
    }
    updateCarousel();
  }

  function bindCarousel() {
    prev.addEventListener('click', function () {
      pageIndex -= 1;
      updateCarousel();
    });
    next.addEventListener('click', function () {
      pageIndex += 1;
      updateCarousel();
    });
    window.addEventListener('resize', onLayoutChange);
    if (MOBILE_MQ.addEventListener) {
      MOBILE_MQ.addEventListener('change', function () {
        renderTrack();
      });
    } else if (MOBILE_MQ.addListener) {
      MOBILE_MQ.addListener(function () {
        renderTrack();
      });
    }
    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(onLayoutChange);
      ro.observe(viewport);
      var carousel = root.querySelector('.artform-greviews__carousel');
      if (carousel) {
        ro.observe(carousel);
      }
    }
  }

  function bindTabs() {
    Array.prototype.forEach.call(tabs, function (tab) {
      tab.addEventListener('click', function () {
        var nextFilter = tab.getAttribute('data-afg-tab') || 'all';
        if (nextFilter === activeFilter) {
          return;
        }
        activeFilter = nextFilter;
        Array.prototype.forEach.call(tabs, function (btn) {
          var on = btn === tab;
          btn.classList.toggle('is-active', on);
          btn.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        renderTrack();
      });
    });
  }

  function loadFeed() {
    var feedUrl =
      (typeof window.artformAsset === 'function' && window.artformAsset('data/google-reviews.json?v=20260606')) ||
      '/data/google-reviews.json?v=20260606';
    return fetch(feedUrl, { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) {
          return null;
        }
        return response.json();
      })
      .catch(function () {
        return null;
      });
  }

  bindCarousel();
  bindTabs();

  loadFeed().then(function (payload) {
    if (payload && Array.isArray(payload.reviews) && payload.reviews.length) {
      allReviews = payload.reviews;
      applySummary(payload);
      var maps = root.querySelector('[data-afg-maps]');
      var write = root.querySelector('[data-afg-write]');
      if (maps && payload.mapsUrl) {
        maps.href = payload.mapsUrl;
      }
      if (write && payload.writeReviewUrl) {
        write.href = payload.writeReviewUrl;
      }
    } else {
      applySummary({ ratingValue: 5, reviewCount: 102 });
    }
    renderTrack();
  });
})();
