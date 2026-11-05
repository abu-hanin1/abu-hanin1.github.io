// Site settings. The two Supabase values and the Google client ID are public by design:
// they are protected by the database rules in supabase/setup.sql.
// While supabaseUrl is empty the site runs in demo mode (data stays in this browser only).
window.SITE_CONFIG = {
  siteName: 'مفتاح',
  tagline: 'كل المحتوى الحصري في مكان واحد',
  defaultChannel: '@Abu-Hanin',

  supabaseUrl: 'https://jyrcywuxqfandzerlrga.supabase.co',
  supabaseAnonKey: 'sb_publishable_4tt3LWss6QhyskTBnM7aCA_Aq4kw1c8',
  googleClientId: '',
};
