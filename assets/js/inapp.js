// Messenger, Facebook and Instagram open links in their own browser, which isn't signed in to
// Google, so YouTube asks for a login. On Android this sends visitors to Chrome instead.
// Limited to these apps: other in-app browsers and iPhones can show an error page for this
// kind of link, and the visitor is then left with nothing.
(function () {
  const IN_APP = /FBAN|FBAV|FB_IAB|FBIOS|FB4A|Messenger|Instagram/i;

  const InApp = {
    // Returns 'android' inside one of those apps on Android, otherwise null.
    detect(ua) {
      return IN_APP.test(ua) && /android/i.test(ua) ? 'android' : null;
    },

    chromeUrl(href) {
      const u = new URL(href);
      // The visit was already counted in the app, so Chrome must not count it again.
      u.searchParams.set('counted', '1');
      const rest = u.host + u.pathname + u.search;
      // Without Chrome installed, Android comes back here marked so the page carries on normally.
      const fallback = new URL(href);
      fallback.searchParams.set('nochrome', '1');
      return `intent://${rest}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(fallback.href)};end`;
    },

    open() {
      location.href = InApp.chromeUrl(location.href);
    },

    // Tried once on arrival. After that the subscribe button asks again.
    autoOpen() {
      try {
        if (sessionStorage.getItem('miftah_tried_chrome')) return;
        sessionStorage.setItem('miftah_tried_chrome', '1');
      } catch (e) { return; }
      InApp.open();
    },
  };

  if (typeof window !== 'undefined') window.InApp = InApp;
  if (typeof module !== 'undefined') module.exports = InApp;
})();
