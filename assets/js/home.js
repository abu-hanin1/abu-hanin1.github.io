// Public home page: gallery of the links marked "public".
(async function () {
  window.PAGE_STARTED = true;
  const grid = document.getElementById('grid');
  const ic = window.uiIcon;
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
  grid.innerHTML = posts.map(p => {
    const img = window.safeImg(p.cover_url);
    return `<a class="post-card ${img ? '' : 'no-img'}" href="link.html?s=${encodeURIComponent(p.slug)}">
      ${img ? `<img src="${window.esc(img)}" alt="" loading="lazy">` : ''}
      <span class="lock-badge">${ic('lock', 16)}</span>
      <div class="post-body"><h3 dir="auto">${window.esc(p.title)}</h3>
        <div class="post-meta"><span>${ic('eye', 15)} ${window.fmtNum(p.views)} مشاهدة</span>
        <span>${ic('unlock', 15)} ${window.fmtNum(p.unlocks)}</span></div></div></a>`;
  }).join('');
})();
