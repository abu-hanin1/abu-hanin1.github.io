// Public home page: gallery of the links marked "public".
(async function () {
  const grid = document.getElementById('grid');
  const ic = window.uiIcon;
  let posts = [];
  try { posts = await window.DB.listPublic(); }
  catch { grid.innerHTML = '<p class="muted center">تعذر تحميل المحتوى. حاول تاني.</p>'; return; }
  if (!posts.length) {
    grid.innerHTML = `<div class="empty-state">${ic('gift', 44)}<h2>المحتوى قادم قريبًا</h2></div>`;
    return;
  }
  grid.innerHTML = posts.map(p => {
    const img = window.safeImg(p.cover_url);
    return `<a class="post-card" href="link.html?s=${encodeURIComponent(p.slug)}">
      ${img ? `<img src="${window.esc(img)}" alt="" loading="lazy">` : `<div class="ph">${ic('image', 36)}</div>`}
      <span class="lock-badge">${ic('lock', 16)}</span>
      <div class="post-body"><h3 dir="auto">${window.esc(p.title)}</h3>
        <div class="post-meta"><span>${ic('eye', 15)} ${window.fmtNum(p.views)} مشاهدة</span>
        <span>${ic('unlock', 15)} ${window.fmtNum(p.unlocks)}</span></div></div></a>`;
  }).join('');
})();
