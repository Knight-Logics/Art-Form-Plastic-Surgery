/**
 * Art Form live chat — Tidio (same lazy-load pattern as Knight Logics MainSite).
 * Config via <body data-chat-*> attributes set in build.mjs from data/site.json.
 */
(function () {
  var body = document.body;
  if (!body || body.dataset.chatEnabled !== 'true') return;
  if (body.dataset.chatProvider !== 'tidio') return;

  var tidioKey = body.dataset.chatTidioKey || '';
  if (!tidioKey) return;

  function forceTidioCollapsed() {
    var attempts = 0;
    var maxAttempts = 20;
    var intervalMs = 500;

    var collapseInterval = window.setInterval(function () {
      attempts += 1;
      var collapsed = false;
      var api = window.tidioChatApi;

      if (api) {
        if (typeof api.close === 'function') {
          api.close();
          collapsed = true;
        } else if (typeof api.hide === 'function') {
          api.hide();
          collapsed = true;
        }
      }

      if (!collapsed) {
        var minimizeButton = document.querySelector(
          'button[aria-label="Minimize chat widget"], button[aria-label="Close chat widget"], button[aria-label="Minimize"]'
        );
        if (minimizeButton) {
          minimizeButton.click();
          collapsed = true;
        }
      }

      if (collapsed || attempts >= maxAttempts) {
        window.clearInterval(collapseInterval);
      }
    }, intervalMs);
  }

  function initSiteChatWidget() {
    if (document.querySelector('script[data-af-chat="tidio"]')) return;

    var script = document.createElement('script');
    script.src = 'https://code.tidio.co/' + tidioKey + '.js';
    script.async = true;
    script.dataset.afChat = 'tidio';
    script.addEventListener('load', forceTidioCollapsed);
    document.body.appendChild(script);
  }

  function initSiteChatWidgetOnInteraction() {
    var events = ['mousemove', 'scroll', 'keydown', 'touchstart', 'click'];
    var handler = function () {
      events.forEach(function (eventName) {
        document.removeEventListener(eventName, handler);
      });
      initSiteChatWidget();
    };
    events.forEach(function (eventName) {
      document.addEventListener(eventName, handler, { once: true, passive: true });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSiteChatWidgetOnInteraction);
  } else {
    initSiteChatWidgetOnInteraction();
  }
})();
