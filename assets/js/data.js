// Data layer: the real Supabase backend, or a browser-only demo when it isn't configured.
(function () {
  const C = window.SITE_CONFIG;
  const DEMO = !C.supabaseUrl || !C.supabaseAnonKey;

  // ---------------------------------------------------------------- helpers
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch {} },
  };
  window.store = store;

  const uid = () => (crypto.randomUUID ? crypto.randomUUID()
    : 'x'.repeat(32).replace(/x/g, () => (Math.random() * 16 | 0).toString(16)));

  window.randomSlug = () => {
    const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
    const bytes = crypto.getRandomValues(new Uint8Array(5));
    return Array.from(bytes, b => abc[b % abc.length]).join('');
  };

  // ------------------------------------------------------------------- demo
  const DK = 'miftah_demo_posts';
  const demoCover = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b3d2e"/><stop offset="1" stop-color="#0e1f4d"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/><circle cx="1040" cy="150" r="260" fill="#10e08a" opacity=".16"/><circle cx="210" cy="620" r="300" fill="#3a7bff" opacity=".2"/><g fill="none" stroke="#fff" stroke-width="34" stroke-linecap="round" stroke-linejoin="round" transform="translate(500 180)"><rect x="20" y="170" width="240" height="190" rx="36"/><path d="M70 170v-60a70 70 0 0 1 137-20"/></g></svg>`);

  function demoPosts() {
    let list = store.get(DK, null);
    if (!list) {
      list = [{
        id: uid(), slug: 'demo-pack', title: 'حزمة البرومبتات الاحترافية', status: 'public',
        description: 'كل اللي محتاجه علشان تبدأ: روابط الأدوات، كتاب PDF، وبرومبت جاهز للنسخ.',
        cover_url: 'data:image/svg+xml,' + demoCover,
        steps: [{ id: 's1', action: 'yt_subscribe', target: C.defaultChannel, verify: true }],
        theme: { bg: 'cover', accent: '#10e08a' }, expires_at: null,
        views: 2418, unlocks: 635, created_at: new Date().toISOString(),
        items: [
          { id: 'i1', type: 'url', label: 'موقع الأداة', value: 'https://example.com' },
          { id: 'i2', type: 'text', label: 'البرومبت الاحترافي', value: 'أنت خبير تسويق محترف. اكتب لي خطة محتوى لمدة 30 يومًا عن [الموضوع] تناسب [الجمهور]، مع فكرة وعنوان جذاب لكل يوم.' },
        ],
      }];
      store.set(DK, list);
    }
    return list;
  }
  const demoSave = list => {
    if (!store.set(DK, list)) throw new Error('المساحة التجريبية امتلأت. استخدم ملفًا أصغر.');
  };
  const publicShape = p => {
    const { items, id, ...rest } = p;
    return {
      ...rest,
      expired: !!(p.expires_at && new Date(p.expires_at) < new Date()),
      items_summary: (items || []).map(i => ({ type: i.type, label: i.label })),
    };
  };

  const demo = {
    async listPublic() {
      return demoPosts().filter(p => p.status === 'public' && !(p.expires_at && new Date(p.expires_at) < new Date()));
    },
    async getPost(slug) {
      const p = demoPosts().find(x => x.slug === slug && x.status !== 'draft');
      return p ? publicShape(p) : null;
    },
    async registerView(slug) {
      const list = demoPosts(); const p = list.find(x => x.slug === slug);
      if (p) { p.views++; demoSave(list); }
    },
    // Mirrors public.unlock_post in supabase/setup.sql.
    async unlock(slug, { token = null, pass = null, count = false } = {}) {
      const list = demoPosts(); const p = list.find(x => x.slug === slug && x.status !== 'draft');
      if (!p) return { ok: false, reason: 'not_found' };
      if (p.expires_at && new Date(p.expires_at) < new Date()) return { ok: false, reason: 'expired' };
      const passes = store.get('miftah_demo_passes', {});
      const verified = [], missing = [];
      let newPass = pass;
      for (const s of p.steps.filter(s => s.verify)) {
        const key = String(s.target).toLowerCase();
        if (pass && (passes[pass] || []).includes(key)) { verified.push(s.id); continue; }
        if (!token) { missing.push(s.id); continue; }
        if (token === 'demo-yes') {
          newPass = newPass || uid();
          (passes[newPass] = passes[newPass] || []).push(key);
          store.set('miftah_demo_passes', passes);
          verified.push(s.id);
        } else missing.push(s.id);
      }
      if (missing.length) {
        return { ok: false, reason: token ? 'not_subscribed' : 'needs_verification', verified, missing, pass: newPass };
      }
      if (count) { p.unlocks++; demoSave(list); }
      return { ok: true, verified, pass: newPass, items: p.items || [] };
    },
    async session() { return { user: { email: 'demo' }, isAdmin: true }; },
    async signIn() {}, async signOut() {},
    async listAll() { return demoPosts().map(({ items, ...r }) => r); },
    async getFull(id) { const p = demoPosts().find(x => x.id === id); return p ? JSON.parse(JSON.stringify(p)) : null; },
    async savePost(post) {
      const list = demoPosts();
      if (list.some(x => x.slug === post.slug && x.id !== post.id)) throw new Error('slug_taken');
      const i = list.findIndex(x => x.id === post.id);
      if (i >= 0) { list[i] = { ...list[i], ...post }; demoSave(list); return list[i]; }
      const fresh = { ...post, id: uid(), views: 0, unlocks: 0, created_at: new Date().toISOString() };
      list.unshift(fresh); demoSave(list);
      return fresh;
    },
    async deletePost(id) { demoSave(demoPosts().filter(x => x.id !== id)); },
    async upload(file) {
      if (file.size > 1.5 * 1024 * 1024) throw new Error('في الوضع التجريبي الحد الأقصى للملف 1.5 ميجا.');
      return new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = () => rej(new Error('تعذرت قراءة الملف.'));
        r.readAsDataURL(file);
      });
    },
  };

  // --------------------------------------------------------------- supabase
  async function rpc(name, args) {
    const res = await fetch(`${C.supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: { apikey: C.supabaseAnonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(args || {}),
    });
    if (!res.ok) throw new Error('rpc_failed');
    return res.json();
  }

  let client;
  const sb = () => client || (client = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey));
  const check = r => { if (r.error) throw r.error; return r.data; };

  const live = {
    listPublic: () => rpc('list_public_posts'),
    getPost: slug => rpc('get_post', { p_slug: slug }),
    registerView: slug => rpc('register_view', { p_slug: slug }),
    unlock: (slug, { token = null, pass = null, count = false } = {}) =>
      rpc('unlock_post', { p_slug: slug, p_google_token: token, p_pass: pass, p_count: count }),

    async session() {
      const { data } = await sb().auth.getSession();
      if (!data.session) return null;
      const rows = await sb().from('admins').select('user_id').eq('user_id', data.session.user.id);
      return { user: data.session.user, isAdmin: !!(rows.data && rows.data.length) };
    },
    async signIn(email, password) {
      const { error } = await sb().auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    signOut: () => sb().auth.signOut(),

    async listAll() {
      return check(await sb().from('posts').select('*').order('created_at', { ascending: false }));
    },
    async getFull(id) {
      const post = check(await sb().from('posts').select('*').eq('id', id).maybeSingle());
      if (!post) return null;
      const content = check(await sb().from('post_content').select('items').eq('post_id', id).maybeSingle());
      return { ...post, items: content ? content.items : [] };
    },
    async savePost(post) {
      const { items, id, views, unlocks, created_at, ...fields } = post;
      fields.updated_at = new Date().toISOString();
      const q = id ? sb().from('posts').update(fields).eq('id', id) : sb().from('posts').insert(fields);
      const r = await q.select().single();
      if (r.error) throw (r.error.code === '23505' ? new Error('slug_taken') : r.error);
      check(await sb().from('post_content').upsert({ post_id: r.data.id, items: items || [] }));
      return { ...r.data, items };
    },
    async deletePost(id) { check(await sb().from('posts').delete().eq('id', id)); },
    async upload(file, folder) {
      if (file.size > 50 * 1024 * 1024) throw new Error('الحد الأقصى لحجم الملف 50 ميجا.');
      const ext = (file.name.match(/\.[a-z0-9]{1,8}$/i) || [''])[0].toLowerCase();
      const path = `${folder}/${uid()}${ext}`;
      check(await sb().storage.from('media').upload(path, file, { contentType: file.type || undefined }));
      return sb().storage.from('media').getPublicUrl(path).data.publicUrl;
    },
  };

  window.DB = { isDemo: DEMO, ...(DEMO ? demo : live) };
})();
