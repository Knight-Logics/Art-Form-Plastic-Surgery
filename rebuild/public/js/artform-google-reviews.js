(function initArtFormGoogleReviews() {
  var root = document.querySelector('.artform-greviews');
  if (!root) {
    return;
  }

  var track = root.querySelector('[data-afg-track]');
  var prev = root.querySelector('[data-afg-prev]');
  var next = root.querySelector('[data-afg-next]');
  var summaryEl = root.querySelector('[data-afg-summary]');
  var tabs = root.querySelectorAll('[data-afg-tab]');

  if (!track || !prev || !next) {
    return;
  }

  var AVATAR_COLORS = ['#1e6b2e', '#c0392b', '#1a56c4', '#7c3aed', '#0f766e', '#b45309'];
  var OWNER_NAME = 'Art Form Plastic Surgery';
  var allReviews = [];
  var activeFilter = 'all';
  var pageIndex = 0;

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

    if (hasReply(review)) {
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

  function perView() {
    if (window.innerWidth < 760) {
      return 1;
    }
    if (window.innerWidth < 960) {
      return 2;
    }
    return 3;
  }

  function trackGap() {
    return 12;
  }

  function pageCount() {
    var cards = track.children.length;
    return Math.max(1, Math.ceil(cards / perView()));
  }

  function updateCarousel() {
    var cards = track.children;
    var pages = pageCount();
    if (pageIndex > pages - 1) {
      pageIndex = pages - 1;
    }
    if (pageIndex < 0) {
      pageIndex = 0;
    }
    var sample = cards[0];
    var gap = trackGap();
    var width = sample ? sample.getBoundingClientRect().width : 0;
    var offset = pageIndex * (width + gap) * perView();
    track.style.transform = 'translateX(' + -offset + 'px)';
    prev.disabled = pageIndex === 0;
    next.disabled = pageIndex === pages - 1;
  }

  function renderTrack() {
    var visible = filterReviews(allReviews);
    track.innerHTML = visible.map(cardMarkup).join('');
    pageIndex = 0;
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
    window.addEventListener('resize', updateCarousel);
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
    return fetch('/data/google-reviews.json?v=20260605', { cache: 'no-store' })
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
