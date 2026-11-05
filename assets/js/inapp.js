// Messenger, Facebook, Instagram and similar apps open links in their own browser, which isn't
// signed in to Google, so YouTube asks for a login. This sends visitors to a real browser.
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
      const rest = u.host + u.pathname + u.search;
      if (platform === 'ios') return `googlechromes://${rest}`;
      return `intent://${rest}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(href)};end`;
    },

    safariUrl(href) {
      const u = new URL(href);
      return `x-safari-https://${u.host}${u.pathname}${u.search}`;
    },

    show(root, platform, onContinue) {
      const { esc, uiIcon: ic } = window;
      const href = location.href;
      const chrome = InApp.chromeUrl(href, platform);
      const menuHint = platform === 'ios'
        ? 'اضغط على النقط <b>⋯</b> في أعلى الشاشة، واختار <b>فتح في المتصفح</b>.'
        : 'اضغط على النقط <b>⋮</b> في أعلى الشاشة، واختار <b>فتح في Chrome</b>.';

      root.innerHTML = `<div class="card inapp">
        <div class="inapp-ic">${ic('external', 32)}</div>
        <h1>افتح الرابط في Chrome</h1>
        <p class="muted">المتصفح اللي جوه التطبيق بيطلب تسجيل الدخول في يوتيوب. افتح الصفحة في Chrome علشان تشترك بحسابك بسهولة.</p>
        ${platform === 'android' ? '<div class="inapp-tip">لو ظهرت رسالة <b>مغادرة التطبيق</b>، اضغط <b>متابعة</b>. دي رسالة عادية من التطبيق.</div>' : ''}
        <a class="btn primary wide" href="${esc(chrome)}">${ic('external', 20)} افتح في Chrome</a>
        ${platform === 'ios' ? `<a class="btn wide" href="${esc(InApp.safariUrl(href))}">افتح في Safari</a>` : ''}
        <div class="inapp-or"><b>الزر ما اشتغلش؟</b> ${menuHint}</div>
        <button class="btn wide" data-inapp-copy>${ic('copy', 18)} نسخ الرابط والصقه في Chrome</button>
        <button class="inapp-stay" data-inapp-stay>أكمل هنا على أي حال</button>
      </div>`;

      root.querySelector('[data-inapp-copy]').onclick = async () => {
        const ok = await window.copyText(href);
        window.toast(ok ? 'تم نسخ الرابط!' : 'تعذر النسخ', ok ? 'ok' : 'err');
      };
      root.querySelector('[data-inapp-stay]').onclick = () => {
        try { sessionStorage.setItem('miftah_stay_inapp', '1'); } catch {}
        onContinue();
      };
    },

    // Android can jump straight to Chrome. Only tried once, in case the app blocks it.
    autoOpen(platform) {
      if (platform !== 'android') return;
      try {
        if (sessionStorage.getItem('miftah_tried_chrome')) return;
        sessionStorage.setItem('miftah_tried_chrome', '1');
      } catch { return; }
      location.href = InApp.chromeUrl(location.href, platform);
    },

    stayed() {
      try { return !!sessionStorage.getItem('miftah_stay_inapp'); } catch { return false; }
    },
  };

  if (typeof window !== 'undefined') window.InApp = InApp;
  if (typeof module !== 'undefined') module.exports = InApp;
})();
