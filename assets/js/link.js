// Visitor page: walks through the steps, verifies, and reveals the locked content.
(function () {
  const C = window.SITE_CONFIG;
  const root = document.getElementById('app');
  const slug = new URLSearchParams(location.search).get('s') || '';
  const PASS_KEY = 'miftah_pass';
  const doneKey = `miftah_done_${slug}`;
  const openedKey = `miftah_opened_${slug}`;

  let post = null;
  const state = { done: new Set(), clicked: new Set(), msg: {}, busy: null, items: null, unlocking: false };
  const pendingKey = `miftah_pending_${slug}`;
  // stepId -> time its button was pressed. Saved because phones often reload
  // this tab while the visitor is away in the YouTube app.
  const away = {};
  const timers = {};

  const render = () => {
    root.innerHTML = window.renderLinkCard(post, state);
    document.body.style.cssText = window.bgStyle(post);
  };

  const message = (title, text) => {
    root.innerHTML = `<div class="empty-state card">${window.uiIcon('lock', 44)}<h1>${window.esc(title)}</h1><p>${window.esc(text)}</p>
      <a class="btn primary" href="index.html">الصفحة الرئيسية</a></div>`;
  };

  const saveDone = () => {
    // Verified steps are re-confirmed by the server, so only click steps are remembered here.
    const ids = post.steps.filter(s => !s.verify && state.done.has(s.id)).map(s => s.id);
    window.store.set(doneKey, ids);
  };

  async function loadGis() {
    if (window.google?.accounts?.oauth2) return;
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.onload = res; s.onerror = () => rej(new Error('gis'));
      document.head.appendChild(s);
    });
  }

  function googleToken() {
    return new Promise((res, rej) => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: C.googleClientId,
        scope: 'https://www.googleapis.com/auth/youtube.readonly',
        callback: r => (r.access_token ? res(r.access_token) : rej(new Error('denied'))),
        error_callback: () => rej(new Error('denied')),
      });
      client.requestAccessToken();
    });
  }

  function applyVerified(res) {
    if (res.pass) window.store.set(PASS_KEY, res.pass);
    (res.verified || []).forEach(id => { state.done.add(id); delete state.msg[id]; });
  }

  async function verify(id) {
    state.busy = id; delete state.msg[id]; render();
    try {
      let token;
      if (window.DB.isDemo) {
        // Demo stand-in for Google: counts as subscribed only after pressing the subscribe button.
        token = state.clicked.has(id) ? 'demo-yes' : 'demo-no';
      } else {
        await loadGis();
        token = await googleToken();
      }
      const res = await window.DB.unlock(slug, { token, pass: window.store.get(PASS_KEY, null) });
      applyVerified(res);
      if (!state.done.has(id)) {
        state.msg[id] = res.reason === 'google_error'
          ? { kind: 'err', text: 'تعذر التأكد من يوتيوب. تأكد إنك وافقت على صلاحية يوتيوب وحاول تاني.' }
          : { kind: 'err', text: 'الحساب ده مش مشترك في القناة لسه. اضغط زر الاشتراك الأول، أو اختار الحساب المشترك.' };
      } else if (!window.DB.isDemo) {
        window.google.accounts.oauth2.revoke(token, () => {});
      }
    } catch (e) {
      state.msg[id] = { kind: 'err', text: e.message === 'denied'
        ? 'لازم تختار حساب جوجل وتوافق علشان نتأكد من الاشتراك.'
        : 'حصلت مشكلة في الاتصال. حاول تاني.' };
    }
    state.busy = null;
    render();
  }

  function openStep(id) {
    const step = post.steps.find(s => s.id === id);
    const url = window.safeUrl(window.stepUrl(step));
    if (!url) return;
    window.open(url, '_blank', 'noopener');
    state.clicked.add(id);
    if (!step.verify && !state.done.has(id)) {
      away[id] = Date.now();
      clearTimeout(timers[id]);
      delete timers[id];
      window.store.set(pendingKey, away);
    }
    delete state.msg[id];
    render();
  }

  function finishStep(id) {
    delete away[id];
    delete timers[id];
    delete state.msg[id];
    window.store.set(pendingKey, away);
    state.done.add(id);
    saveDone();
    if (post.steps.every(s => state.done.has(s.id))) celebrate();
    render();
  }

  // Runs when the visitor comes back to this tab.
  function onReturn() {
    if (document.hidden) return;
    const wait = (C.minAwaySeconds || 3) * 1000;
    let changed = false;
    Object.keys(away).forEach(id => {
      if (timers[id]) return;
      const left = wait - (Date.now() - away[id]);
      if (left <= 0) { finishStep(id); return; }
      state.msg[id] = { kind: 'info', text: 'جاري تأكيد الخطوة...' };
      timers[id] = setTimeout(() => finishStep(id), left);
      changed = true;
    });
    if (changed) render();
  }

  function celebrate() {
    const box = document.createElement('div');
    box.className = 'burst'; box.setAttribute('aria-hidden', 'true');
    const accent = post.theme?.accent || '#10e08a';
    box.innerHTML = Array.from({ length: 36 }, (_, i) => {
      const a = (i / 36) * 360, d = 90 + (i * 37) % 170;
      return `<i style="--a:${a}deg;--d:${d}px;--c:${i % 3 ? accent : '#fff'}"></i>`;
    }).join('');
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 1300);
  }

  async function unlock() {
    state.unlocking = true; render();
    try {
      const first = !window.store.get(openedKey, false);
      const res = await window.DB.unlock(slug, { pass: window.store.get(PASS_KEY, null), count: first });
      if (res.ok) {
        if (first) { post.unlocks = (post.unlocks || 0) + 1; window.store.set(openedKey, true); }
        state.items = res.items || [];
        celebrate();
      } else if (res.reason === 'expired') {
        message('انتهت صلاحية الرابط', 'الرابط ده مبقاش متاح.'); return;
      } else {
        (res.missing || []).forEach(id => {
          state.done.delete(id);
          state.msg[id] = { kind: 'err', text: 'لازم نتأكد من اشتراكك الأول.' };
        });
      }
    } catch {
      window.toast('حصلت مشكلة في الاتصال. حاول تاني.', 'err');
    }
    state.unlocking = false;
    render();
  }

  // Downloads inside the page so the visitor sees exactly how far it got.
  async function downloadFile(card, item) {
    if (card.dataset.busy) return;
    card.dataset.busy = '1';
    const text = card.querySelector('[data-dl-text]');
    const btn = card.querySelector('[data-dl-btn]');
    const bar = card.querySelector('[data-dl-bar]');
    const original = text.textContent;
    const originalBtn = btn.innerHTML;
    const show = (done, total) => {
      const p = window.progressInfo('جاري التحميل', done, total);
      text.textContent = p.text;
      btn.textContent = p.pct === null ? `${(done / 1048576).toFixed(1)} ميجا` : `${p.pct}%`;
      bar.firstElementChild.style.width = p.pct === null ? '100%' : `${p.pct}%`;
      bar.classList.toggle('unknown', p.pct === null);
    };
    try {
      if (item.value.startsWith('data:')) { card.removeAttribute('data-act'); card.click(); return; }
      bar.hidden = false;
      show(0, 0);
      const res = await fetch(item.value);
      if (!res.ok || !res.body) throw new Error('download');
      const total = Number(res.headers.get('content-length')) || 0;
      const reader = res.body.getReader();
      const chunks = [];
      let done = 0;
      for (;;) {
        const { done: finished, value } = await reader.read();
        if (finished) break;
        chunks.push(value);
        done += value.length;
        show(done, total);
      }
      const url = URL.createObjectURL(new Blob(chunks, { type: res.headers.get('content-type') || 'application/octet-stream' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = item.fileName || 'file';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      text.textContent = 'تم التحميل! هتلاقي الملف في التنزيلات.';
      btn.innerHTML = `${window.uiIcon('check', 18)} تم`;
      setTimeout(() => { text.textContent = original; btn.innerHTML = originalBtn; bar.hidden = true; }, 5000);
    } catch {
      // Direct link as a fallback, so the visitor still gets the file.
      text.textContent = original;
      btn.innerHTML = originalBtn;
      bar.hidden = true;
      window.open(card.href, '_blank', 'noopener');
    } finally {
      delete card.dataset.busy;
    }
  }

  root.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act, id = b.dataset.id;
    if (act === 'download') {
      e.preventDefault();
      downloadFile(b, state.items.find(x => x.id === id));
      return;
    }
    if (act === 'open') openStep(id);
    else if (act === 'verify') verify(id);
    else if (act === 'unlock') unlock();
    else if (act === 'copy') {
      const it = state.items.find(x => x.id === id);
      const ok = await window.copyText(it ? it.value : '');
      window.toast(ok ? 'تم النسخ!' : 'تعذر النسخ', ok ? 'ok' : 'err');
    } else if (act === 'share') {
      const shortUrl = new URL(encodeURIComponent(slug), new URL('./', location.href)).href;
      const data = { title: post.title, url: shortUrl };
      if (navigator.share) { try { await navigator.share(data); } catch {} }
      else { await window.copyText(shortUrl); window.toast('تم نسخ الرابط!', 'ok'); }
    }
  });

  document.addEventListener('visibilitychange', onReturn);
  window.addEventListener('focus', onReturn);

  async function countView() {
    const key = `miftah_view_${slug}`;
    const last = window.store.get(key, 0);
    if (Date.now() - last < 6 * 3600 * 1000) return;
    window.store.set(key, Date.now());
    post.views = (post.views || 0) + 1;
    try { await window.DB.registerView(slug); } catch {}
  }

  (async function init() {
    if (!slug) return message('الرابط غير صحيح', 'تأكد من الرابط وحاول تاني.');
    try { post = await window.DB.getPost(slug); }
    catch { return message('تعذر تحميل الصفحة', 'تأكد من اتصالك بالإنترنت وحاول تاني.'); }
    if (!post) return message('الرابط غير موجود', 'يمكن يكون اتمسح أو الرابط فيه خطأ.');
    if (post.expired) return message('انتهت صلاحية الرابط', 'الرابط ده مبقاش متاح.');

    document.title = `${post.title} | ${C.siteName}`;
    post.steps = post.steps || [];
    window.store.get(doneKey, []).forEach(id => {
      if (post.steps.some(s => s.id === id && !s.verify)) state.done.add(id);
    });

    const pending = window.store.get(pendingKey, {});
    Object.keys(pending).forEach(id => {
      if (post.steps.some(s => s.id === id && !s.verify) && !state.done.has(id)) away[id] = pending[id];
    });

    await countView();

    // Someone already verified before: the lock opens with no extra steps.
    const pass = window.store.get(PASS_KEY, null);
    if (pass && post.steps.some(s => s.verify)) {
      try { applyVerified(await window.DB.unlock(slug, { pass })); } catch {}
    }
    render();
    onReturn();
  })();
})();
