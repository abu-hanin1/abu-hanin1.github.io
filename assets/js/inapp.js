// Messenger, Facebook, Instagram and similar apps open links in their own browser, which isn't
// signed in to Google, so YouTube asks for a login. This sends visitors to Chrome instead.
(function () {
  const IN_APP = /FBAN|FBAV|FB_IAB|FBIOS|FB4A|Messenger|Instagram|musical_ly|BytedanceWebview|TikTok|Snapchat|LinkedInApp|Line\/|;\s*wv\)/i;

  const InApp = {
    // Returns 'android' or 'ios' inside an in-app browser, otherwise null.
    detect(ua) {
      if (!IN_APP.test(ua)) return null;
      if (/android/i.test(ua)) return 'android';
      if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
      return null;
    },

    chromeUrl(href, platform) {
      const u = new URL(href);
      // The visit was already counted in the app, so Chrome must not count it again.
      u.searchParams.set('counted', '1');
      const rest = u.host + u.pathname + u.search;
      if (platform === 'ios') return `googlechromes://${rest}`;
      // Without Chrome installed, Android comes back here marked so the page carries on normally.
      const fallback = new URL(href);
      fallback.searchParams.set('nochrome', '1');
      return `intent://${rest}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(fallback.href)};end`;
    },

    open(platform) {
      location.href = InApp.chromeUrl(location.href, platform);
    },

    // Tried once on arrival. After that the subscribe button asks again.
    autoOpen(platform) {
      try {
        if (sessionStorage.getItem('miftah_tried_chrome')) return;
        sessionStorage.setItem('miftah_tried_chrome', '1');
      } catch { return; }
      InApp.open(platform);
    },
  };

  if (typeof window !== 'undefined') window.InApp = InApp;
  if (typeof module !== 'undefined') module.exports = InApp;
})();
