// Public home page: gallery of the links marked "public".
(async function () {
  window.PAGE_STARTED = true;
  const grid = document.getElementById('grid');
  const ic = window.uiIcon;
  const esc = window.esc;
  let posts = [];
  try { posts = await window.DB.listPublic(); }
  catch (e) {
    grid.innerHTML = '<div class="empty-state"><h2>تعذر الاتصال بالموقع</h2><p>تأكد من الإنترنت وحاول تاني.</p><a class="btn primary" href="">حاول تاني</a></div>';
    return;
  }
  if (!posts.length) {
    grid.innerHTML = `<div class="empty-state">${ic('gift', 44)}<h2>المحتوى قادم قريبًا</h2></div>`;
    return;
  }

  const sum = key => posts.reduce((n, p) => n + (Number(p[key]) || 0), 0);
  const stats = document.getElementById('hero-stats');
  stats.innerHTML = [
    ['gift', posts.length, 'بوست'],
    ['eye', sum('views'), 'مشاهدة'],
    ['unlock', sum('unlocks'), 'مرة فتح'],
  ].map(([icon, n, label]) => `<div class="hero-stat-item">${ic(icon, 20)}<b>${window.fmtNum(n)}</b><span>${label}</span></div>`).join('');
  stats.hidden = false;
  document.getElementById('grid-head').hidden = false;

  grid.innerHTML = posts.map(p => {
    const img = window.safeImg(p.cover_url);
    // The blurred copy fills the frame, so a picture of any shape shows whole with no empty bars.
    return `<a class="post-card ${img ? '' : 'no-img'}" href="link.html?s=${encodeURIComponent(p.slug)}">
      ${img ? `<div class="pc-media">
        <img class="pc-blur" src="${esc(img)}" alt="" aria-hidden="true" loading="lazy">
        <img class="pc-img" src="${esc(img)}" alt="" loading="lazy">
      </div>` : ''}
      <div class="post-body">
        <h3 dir="auto">${esc(p.title)}</h3>
        <div class="post-foot">
          <div class="post-meta">
            <span>${ic('eye', 16)} ${window.fmtNum(p.views)}</span>
            <span>${ic('unlock', 16)} ${window.fmtNum(p.unlocks)}</span>
          </div>
          <span class="post-cta">${ic('lock', 16)} افتح المحتوى</span>
        </div>
      </div></a>`;
  }).join('');
})();
