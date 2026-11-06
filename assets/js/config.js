// Site settings. The two Supabase values and the Google client ID are public by design:
// they are protected by the database rules in supabase/setup.sql.
// While supabaseUrl is empty the site runs in demo mode (data stays in this browser only).
window.SITE_CONFIG = {
  siteName: 'أبو حنين القناص',
  tagline: 'كل المحتوى الحصري في مكان واحد',
  defaultChannel: '@Abu-Hanin',

  supabaseUrl: 'https://jyrcywuxqfandzerlrga.supabase.co',
  supabaseAnonKey: 'sb_publishable_4tt3LWss6QhyskTBnM7aCA_Aq4kw1c8',
  googleClientId: '',

  // Seconds a step stays on "جاري التحقق" after its button is pressed, then it completes.
  checkSeconds: 15,
};

// Outside GitHub Pages, visitors reach the database through the site's own address
// (functions/sb), for networks that can't reach it directly.
window.SITE_CONFIG.apiBase = /(^|\.)github\.io$|^localhost$|^127\./.test(location.hostname)
  ? window.SITE_CONFIG.supabaseUrl
  : `${location.origin}/sb`;
