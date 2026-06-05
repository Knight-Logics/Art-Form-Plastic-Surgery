/**
 * IntakeQ booking widget — same embed as live /book-consultation/ page.
 */
(function () {
  if (!document.getElementById('intakeq') || window.__artformIntakeqLoaded) return;
  window.__artformIntakeqLoaded = true;
  window.intakeq = '664a4b89055c03a01d0b6a80';
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.src = 'https://intakeq.com/js/widget.min.js?1';
  document.head.appendChild(script);
})();
