/*
  "Cookie settings" link handler. Any element with [data-cookie-settings]
  clears the stored consent choice and the analytics cookies, then reloads
  (or goes to data-cookie-redirect) so the cookie banner asks again.
  Withdrawing consent has to be as easy as giving it.
*/
(function () {
  if (window.__cookieSettingsInit) return; // this site's bundler can run scripts twice
  window.__cookieSettingsInit = true;

  var ANALYTICS_COOKIES = /^(_ga|_gid|_gat|_clck|_clsk)/;

  function expireCookie(name) {
    var host = location.hostname;
    var parts = host.split('.');
    var domains = ['', host, '.' + host];
    if (parts.length > 2) domains.push('.' + parts.slice(-2).join('.'));
    domains.forEach(function (d) {
      document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : '');
    });
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-cookie-settings]');
    if (!el) return;
    e.preventDefault();
    try { localStorage.removeItem('cookie_consent'); } catch (err) {}
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (ANALYTICS_COOKIES.test(name)) expireCookie(name);
    });
    var target = el.getAttribute('data-cookie-redirect');
    if (target) location.href = target; else location.reload();
  });
})();
