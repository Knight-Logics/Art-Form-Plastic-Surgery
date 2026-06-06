/**
 * Resolve root-absolute asset URLs on GitHub Pages project sites.
 */
(function () {
  function detectBase() {
    if (typeof window.__ARTFORM_BASE__ === 'string') {
      var configured = window.__ARTFORM_BASE__;
      return configured ? (configured.endsWith('/') ? configured : configured + '/') : '/';
    }
    var host = window.location.hostname || '';
    if (host.endsWith('github.io')) {
      var parts = (window.location.pathname || '/').split('/').filter(Boolean);
      if (parts.length) {
        return '/' + parts[0] + '/';
      }
    }
    return '/';
  }

  window.artformBase = detectBase();
  window.artformAsset = function (path) {
    var p = String(path || '');
    if (/^https?:\/\//i.test(p) || p.startsWith('data:')) {
      return p;
    }
    return window.artformBase + p.replace(/^\//, '');
  };
})();
