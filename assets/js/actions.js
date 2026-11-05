// Catalog of the actions a visitor can be asked to do before unlocking.
window.PLATFORMS = {
  youtube:    { name: 'يوتيوب',     color: '#E62117', fg: '#fff', cat: 'video' },
  twitch:     { name: 'تويتش',      color: '#9146FF', fg: '#fff', cat: 'video' },
  kick:       { name: 'كيك',        color: '#53FC18', fg: '#06210a', cat: 'video' },
  facebook:   { name: 'فيسبوك',     color: '#1877F2', fg: '#fff', cat: 'social' },
  instagram:  { name: 'إنستجرام',   color: '#D6287F', fg: '#fff', cat: 'social' },
  tiktok:     { name: 'تيك توك',    color: '#111317', fg: '#fff', cat: 'social' },
  x:          { name: 'X / تويتر',  color: '#111317', fg: '#fff', cat: 'social' },
  threads:    { name: 'ثريدز',      color: '#111317', fg: '#fff', cat: 'social' },
  snapchat:   { name: 'سناب شات',   color: '#FFFC00', fg: '#111', cat: 'social' },
  pinterest:  { name: 'بنترست',     color: '#E60023', fg: '#fff', cat: 'social' },
  telegram:   { name: 'تيليجرام',   color: '#229ED9', fg: '#fff', cat: 'messaging' },
  whatsapp:   { name: 'واتساب',     color: '#128C4B', fg: '#fff', cat: 'messaging' },
  discord:    { name: 'ديسكورد',    color: '#5865F2', fg: '#fff', cat: 'messaging' },
  spotify:    { name: 'سبوتيفاي',   color: '#1DB954', fg: '#06210f', cat: 'music' },
  soundcloud: { name: 'ساوند كلاود', color: '#FF5500', fg: '#fff', cat: 'music' },
  steam:      { name: 'ستيم',       color: '#1B2838', fg: '#fff', cat: 'games' },
  roblox:     { name: 'روبلوكس',    color: '#2B2D31', fg: '#fff', cat: 'games' },
  github:     { name: 'جيت هاب',    color: '#24292F', fg: '#fff', cat: 'other' },
  web:        { name: 'موقع',       color: '#2A3038', fg: '#fff', cat: 'other', noBrand: true },
};

window.ACTION_CATEGORIES = [
  ['all', 'الكل'], ['video', 'فيديو'], ['social', 'اجتماعي'], ['messaging', 'المراسلة'],
  ['music', 'موسيقى'], ['games', 'ألعاب'], ['other', 'أخرى'],
];

// input: 'handle' accepts @name or a URL. 'url' needs a full URL.
window.ACTIONS = [
  { id: 'yt_subscribe', p: 'youtube', label: 'اشترك في القناة', verb: 'اشترك في', input: 'handle', popular: true, verifiable: true },
  { id: 'yt_bell', p: 'youtube', label: 'اشترك وفعّل الإشعارات', verb: 'اشترك وفعّل الجرس في', input: 'handle', verifiable: true },
  { id: 'yt_like', p: 'youtube', label: 'أعجب بالفيديو', verb: 'أعجب بالفيديو', input: 'url', popular: true },
  { id: 'yt_comment', p: 'youtube', label: 'علّق على الفيديو', verb: 'علّق على الفيديو', input: 'url', popular: true },
  { id: 'yt_like_comment', p: 'youtube', label: 'أعجب بالفيديو وعلّق عليه', verb: 'أعجب بالفيديو وعلّق عليه', input: 'url' },
  { id: 'yt_watch', p: 'youtube', label: 'شاهد الفيديو', verb: 'شاهد الفيديو', input: 'url', popular: true },
  { id: 'yt_share', p: 'youtube', label: 'شارك الفيديو', verb: 'شارك الفيديو', input: 'url' },

  { id: 'fb_follow', p: 'facebook', label: 'تابع الصفحة', verb: 'تابع صفحة', input: 'handle', popular: true },
  { id: 'fb_like', p: 'facebook', label: 'أعجب بالمنشور', verb: 'أعجب بالمنشور', input: 'url' },
  { id: 'fb_comment', p: 'facebook', label: 'علّق على المنشور', verb: 'علّق على المنشور', input: 'url' },
  { id: 'fb_share', p: 'facebook', label: 'شارك المنشور', verb: 'شارك المنشور', input: 'url' },
  { id: 'fb_group', p: 'facebook', label: 'انضم إلى الجروب', verb: 'انضم إلى الجروب', input: 'url' },

  { id: 'ig_follow', p: 'instagram', label: 'تابع الحساب', verb: 'تابع', input: 'handle', popular: true },
  { id: 'ig_like', p: 'instagram', label: 'أعجب بالمنشور', verb: 'أعجب بالمنشور', input: 'url' },
  { id: 'ig_comment', p: 'instagram', label: 'علّق على المنشور', verb: 'علّق على المنشور', input: 'url' },
  { id: 'ig_audio', p: 'instagram', label: 'استخدم هذا الصوت', verb: 'استخدم هذا الصوت', input: 'url' },

  { id: 'tt_follow', p: 'tiktok', label: 'تابع الحساب', verb: 'تابع', input: 'handle', popular: true },
  { id: 'tt_like', p: 'tiktok', label: 'أعجب بالفيديو', verb: 'أعجب بالفيديو', input: 'url' },
  { id: 'tt_comment', p: 'tiktok', label: 'علّق على الفيديو', verb: 'علّق على الفيديو', input: 'url' },
  { id: 'tt_share', p: 'tiktok', label: 'شارك الفيديو', verb: 'شارك الفيديو', input: 'url' },

  { id: 'x_follow', p: 'x', label: 'تابع الحساب', verb: 'تابع', input: 'handle', popular: true },
  { id: 'x_like', p: 'x', label: 'أعجب بالمنشور', verb: 'أعجب بالمنشور', input: 'url' },
  { id: 'x_reply', p: 'x', label: 'رد على المنشور', verb: 'رد على المنشور', input: 'url' },
  { id: 'x_repost', p: 'x', label: 'أعد نشر المنشور', verb: 'أعد نشر المنشور', input: 'url' },

  { id: 'th_follow', p: 'threads', label: 'تابع الحساب', verb: 'تابع', input: 'handle' },
  { id: 'sc_add', p: 'snapchat', label: 'أضف الحساب', verb: 'أضف', input: 'handle' },
  { id: 'pin_follow', p: 'pinterest', label: 'تابع الحساب', verb: 'تابع', input: 'handle' },

  { id: 'tw_follow', p: 'twitch', label: 'تابع القناة', verb: 'تابع', input: 'handle' },
  { id: 'kick_follow', p: 'kick', label: 'تابع القناة', verb: 'تابع', input: 'handle' },

  { id: 'tg_join', p: 'telegram', label: 'انضم إلى القناة', verb: 'انضم إلى', input: 'handle', popular: true },
  { id: 'wa_channel', p: 'whatsapp', label: 'انضم إلى القناة', verb: 'انضم إلى قناة واتساب', input: 'url', popular: true },
  { id: 'wa_group', p: 'whatsapp', label: 'انضم إلى الجروب', verb: 'انضم إلى جروب واتساب', input: 'url' },
  { id: 'dc_join', p: 'discord', label: 'انضم إلى السيرفر', verb: 'انضم إلى سيرفر ديسكورد', input: 'url', popular: true },

  { id: 'sp_follow', p: 'spotify', label: 'تابع الفنان', verb: 'تابع على سبوتيفاي', input: 'url' },
  { id: 'sp_save', p: 'spotify', label: 'احفظ الأغنية', verb: 'احفظ الأغنية', input: 'url' },
  { id: 'sc_follow', p: 'soundcloud', label: 'تابع الحساب', verb: 'تابع', input: 'handle' },

  { id: 'st_wishlist', p: 'steam', label: 'أضف اللعبة للمفضلة', verb: 'أضف اللعبة للمفضلة', input: 'url' },
  { id: 'rb_join', p: 'roblox', label: 'انضم إلى الجروب', verb: 'انضم إلى الجروب', input: 'url' },

  { id: 'gh_follow', p: 'github', label: 'تابع الحساب', verb: 'تابع', input: 'handle' },
  { id: 'gh_star', p: 'github', label: 'ضع نجمة للمشروع', verb: 'ضع نجمة للمشروع', input: 'url' },
  { id: 'web_visit', p: 'web', label: 'زر صفحة', verb: 'زر الصفحة', input: 'url', popular: true },
];

(function () {
  const PROFILE = {
    youtube: h => `https://www.youtube.com/@${h}`,
    facebook: h => `https://www.facebook.com/${h}`,
    instagram: h => `https://www.instagram.com/${h}`,
    tiktok: h => `https://www.tiktok.com/@${h}`,
    x: h => `https://x.com/${h}`,
    threads: h => `https://www.threads.net/@${h}`,
    snapchat: h => `https://www.snapchat.com/add/${h}`,
    pinterest: h => `https://www.pinterest.com/${h}`,
    twitch: h => `https://www.twitch.tv/${h}`,
    kick: h => `https://kick.com/${h}`,
    telegram: h => `https://t.me/${h}`,
    soundcloud: h => `https://soundcloud.com/${h}`,
    github: h => `https://github.com/${h}`,
  };

  window.getAction = id => window.ACTIONS.find(a => a.id === id);

  const isUrl = v => /^https?:\/\//i.test(v);

  // Where the step button sends the visitor.
  window.stepUrl = function (step) {
    const a = window.getAction(step.action);
    const target = String(step.target || '').trim();
    if (!a || !target) return '';
    let url;
    if (isUrl(target)) url = target;
    else if (a.input === 'handle' && PROFILE[a.p]) {
      if (a.p === 'youtube' && /^UC[\w-]{22}$/.test(target)) url = `https://www.youtube.com/channel/${target}`;
      else url = PROFILE[a.p](encodeURIComponent(target.replace(/^@/, '')));
    } else url = 'https://' + target;
    // Opens YouTube's own "confirm subscribe" dialog.
    if (a.verifiable && !url.includes('sub_confirmation')) {
      url += (url.includes('?') ? '&' : '?') + 'sub_confirmation=1';
    }
    return url;
  };

  // Button text, e.g. "اشترك في @Abu-Hanin".
  window.stepText = function (step) {
    const a = window.getAction(step.action);
    if (!a) return step.label || '';
    if (step.label) return step.label;
    if (a.input !== 'handle') return a.verb;
    let t = String(step.target || '').trim();
    if (isUrl(t)) {
      const m = t.match(/@[^/?#]+/) || t.match(/\/([^/?#]+)\/?(?:[?#].*)?$/);
      t = m ? decodeURIComponent(m[1] || m[0]) : '';
      if (t && t[0] !== '@' && m[0][0] !== '@') t = '@' + t;
    } else if (t && t[0] !== '@') t = '@' + t;
    return t ? { verb: a.verb, target: t } : a.verb;
  };

  window.brandIcon = function (platform, size) {
    const s = size ? `style="--s:${size}px"` : '';
    if (window.PLATFORMS[platform] && window.PLATFORMS[platform].noBrand) return window.uiIcon('link', size || 20);
    return `<span class="brand-ic" ${s} data-brand="${platform}" aria-hidden="true"></span>`;
  };
})();
