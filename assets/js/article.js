// Turns the plain text of an article into a designed page: headings, buttons, images and
// one-tap copy for codes. Works on text pasted as is, and on the marks the editor's tools add:
//   ## main heading      ### sub heading      > quote      - list      1. numbered list
//   `CODE`               [تطبيق: اسم الزر](https://...)    ![](https://...image)
// Everything is escaped, so nothing in the text can run as code on the page.
(function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (name, size) => (typeof window !== 'undefined' && window.uiIcon ? window.uiIcon(name, size) : '');

  const URL_RE = /https?:\/\/[^\s<>()\[\]"']+/i;
  const IMAGE_URL = /^https?:\/\/\S+\.(png|jpe?g|webp|gif|avif)(\?\S*)?$/i;
  const LIST_UL = /^[-*•●▪◦]\s+/;
  const LIST_OL = /^(\d+|[٠-٩]+)[.)\-]\s+/;
  const CODE_LABEL = /^(كود الخصم|كوبون|الكوبون|الكود|كود|الرمز|رمز|كلمة السر|كلمة المرور|الباسورد|باسورد|السيريال|سيريال|coupon|code|password|serial)\s*[:：\-–]\s*(\S.*)$/i;
  const SECTION_WORD = /^(أولا|أولًا|ثانيا|ثانيًا|ثالثا|ثالثًا|رابعا|رابعًا|خامسا|خامسًا|الخطوة|خطوة|المرحلة|الجزء|مقدمة|المقدمة|خاتمة|الخاتمة|الخلاصة|ملخص)/;
  const KINDS = { 'تطبيق': 'app', 'موقع': 'site', 'ملف': 'file' };

  function urlKind(url) {
    if (/play\.google\.com|apps\.apple\.com|\.apk(\?|$)|\.ipa(\?|$)|\.exe(\?|$)|\.msi(\?|$)/i.test(url)) return 'app';
    if (/\.(pdf|zip|rar|docx?|xlsx?|pptx?|mp3|mp4)(\?|$)|\/storage\/v1\/object\//i.test(url)) return 'file';
    return 'site';
  }
  const DEFAULT_LABEL = { app: 'تحميل التطبيق من هنا', file: 'تحميل الملف من هنا', site: 'زيارة الموقع من هنا' };
  const KIND_ICON = { app: 'download', file: 'download', site: 'external' };

  const host = url => {
    const m = url.match(/^https?:\/\/(?:www\.)?([^/?#]+)/i);
    return m ? m[1] : url;
  };
  const copyAttrs = value => `data-act="copy-text" data-copy="${esc(value)}"`;

  // Bold, links and short codes inside a sentence.
  function inline(text) {
    const re = /`([^`\n]+)`|\*\*(.+?)\*\*|\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s<>()\[\]"']+)/g;
    let out = '', last = 0, m;
    while ((m = re.exec(text))) {
      out += esc(text.slice(last, m.index));
      last = re.lastIndex;
      if (m[1]) out += `<button type="button" class="art-chip" ${copyAttrs(m[1])} title="اضغط للنسخ" dir="ltr">${esc(m[1])}${icon('copy', 14)}</button>`;
      else if (m[2]) out += `<strong>${inline(m[2])}</strong>`;
      else if (m[3]) out += `<a href="${esc(m[4])}" target="_blank" rel="noopener noreferrer">${esc(m[3])}</a>`;
      else {
        const trail = (m[5].match(/[.,،؛:!?؟]+$/) || [''])[0];
        const url = trail ? m[5].slice(0, -trail.length) : m[5];
        out += `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" dir="ltr">${esc(host(url))}</a>${esc(trail)}`;
      }
    }
    return out + esc(text.slice(last));
  }

  function button(label, url, kind) {
    const k = kind || urlKind(url);
    return `<p class="art-btn-wrap"><a class="art-btn art-btn-${k}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${icon(KIND_ICON[k], 22)}<span dir="auto">${esc(label || DEFAULT_LABEL[k])}</span></a></p>`;
  }

  function codeBlock(value, label) {
    const multi = /\n/.test(value);
    return `<div class="art-code ${multi ? 'multi' : ''}">
      <div class="art-code-text">${label ? `<small>${esc(label)}</small>` : ''}${multi ? `<pre dir="auto">${esc(value)}</pre>` : `<code dir="ltr">${esc(value)}</code>`}</div>
      <button type="button" class="art-copy" ${copyAttrs(value)}>${icon('copy', 18)}<span>نسخ</span></button></div>`;
  }

  const stripMarks = s => s.replace(/^\*\*(.+)\*\*$/, '$1').replace(/[:：]\s*$/, '').trim();

  // Returns { title, html }. The first line becomes the title when it reads like one,
  // unless the article already has its own title (label).
  function parse(text, label) {
    const lines = String(text || '').replace(/\r/g, '').split('\n');
    const out = [];
    let title = '';
    let wrote = false;
    const put = html => { out.push(html); wrote = true; };
    const nextLine = i => {
      for (let j = i + 1; j < lines.length; j++) if (lines[j].trim()) return lines[j].trim();
      return '';
    };

    const heading = (level, value, first) => {
      const clean = stripMarks(value);
      if (first && !label && !title) { title = clean; return; }
      if (first && label && clean === label) return;
      put(`<h${level} dir="auto">${inline(clean)}</h${level}>`);
    };

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i].trim();
      if (!raw) continue;
      const first = !wrote && !title;
      const prevBlank = i === 0 || !lines[i - 1].trim();

      if (/^```/.test(raw)) {
        const code = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i].trim())) code.push(lines[i++]);
        put(codeBlock(code.join('\n').trim()));
        continue;
      }
      if (/^(-{3,}|\*{3,}|_{3,}|[━─=]{3,})$/.test(raw)) { put('<hr>'); continue; }

      const md = raw.match(/^(#{1,6})\s+(.+)$/);
      if (md) {
        heading(md[1].length >= 3 ? 3 : 2, md[2], first && md[1].length === 1);
        continue;
      }

      const img = raw.match(/^!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)$/);
      if (img || IMAGE_URL.test(raw)) {
        const src = img ? img[2] : raw;
        const cap = img ? img[1] : '';
        put(`<figure><img src="${esc(src)}" alt="${esc(cap)}" loading="lazy">${cap ? `<figcaption dir="auto">${esc(cap)}</figcaption>` : ''}</figure>`);
        continue;
      }

      // A link standing on its own line becomes a button, list marker or not.
      const body = raw.replace(LIST_UL, '').replace(LIST_OL, '').replace(/^\*\*(.+)\*\*$/, '$1');
      const marked = body.match(/^\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)$/);
      if (marked) {
        const kindMatch = marked[1].match(/^(تطبيق|موقع|ملف)\s*[:：]\s*(.*)$/);
        const kind = kindMatch ? KINDS[kindMatch[1]] : '';
        put(button(kindMatch ? kindMatch[2].trim() : marked[1], marked[2], kind));
        continue;
      }
      const bare = body.match(/^(https?:\/\/\S+)$/);
      if (bare) { put(button('', bare[1])); continue; }
      const labelled = body.match(/^(.{2,80}?)\s*[:：\-–—>→⬅️👇⬇️]*\s*(https?:\/\/\S+)$/);
      if (labelled && !URL_RE.test(labelled[1])) { put(button(stripMarks(labelled[1]), labelled[2])); continue; }

      const wholeCode = raw.match(/^`([^`]+)`$/);
      if (wholeCode) { put(codeBlock(wholeCode[1])); continue; }
      const named = raw.match(CODE_LABEL);
      if (named && !URL_RE.test(named[2])) { put(codeBlock(named[2].replace(/^`|`$/g, '').trim(), named[1])); continue; }

      if (/^>\s?/.test(raw)) {
        const quote = [];
        while (i < lines.length && /^>\s?/.test(lines[i].trim())) quote.push(lines[i++].trim().replace(/^>\s?/, ''));
        i--;
        put(`<blockquote dir="auto">${quote.map(inline).join('<br>')}</blockquote>`);
        continue;
      }

      const isUl = LIST_UL.test(raw);
      const olStart = raw.match(LIST_OL);
      if (isUl || olStart) {
        const test = isUl ? LIST_UL : LIST_OL;
        const items = [];
        while (i < lines.length) {
          const cur = lines[i].trim();
          if (!cur) {
            if (test.test(nextLine(i))) { i++; continue; }
            break;
          }
          if (!test.test(cur) || URL_RE.test(cur.replace(test, '').replace(/^\[[^\]]*\]\(/, '').slice(0, 0))) break;
          const itemText = cur.replace(test, '');
          if (/^(\[[^\]]+\]\()?https?:\/\/\S+\)?$/.test(itemText)) break;
          items.push(`<li dir="auto">${inline(itemText)}</li>`);
          i++;
        }
        i--;
        if (items.length) {
          const start = olStart ? Number(olStart[1].replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))) : 1;
          put(isUl ? `<ul>${items.join('')}</ul>` : `<ol start="${start}">${items.join('')}</ol>`);
        }
        continue;
      }

      if (/^\*\*[^*]+\*\*:?$/.test(raw)) { heading(3, raw.replace(/:$/, ''), false); continue; }

      const next = nextLine(i);
      const short = raw.length <= 65 && raw.split(/\s+/).length <= 10 && !/[.،؛!?؟…,;]$/.test(raw) && !URL_RE.test(raw);
      if (short && next) {
        const bareNext = next.match(/^(https?:\/\/\S+)$/);
        if (/[:：]$/.test(raw) && bareNext && !IMAGE_URL.test(next)) {
          put(button(stripMarks(raw), bareNext[1]));
          while (lines[i + 1] !== undefined && lines[i + 1].trim() !== next) i++;
          i++;
          continue;
        }
        if (first) { heading(2, raw, true); continue; }
        if (/[:：]$/.test(raw)) { heading(3, raw, false); continue; }
        if (SECTION_WORD.test(raw) || prevBlank) { heading(2, raw, false); continue; }
      }

      put(`<p dir="auto">${inline(raw)}</p>`);
    }
    return { title, html: out.join('\n') };
  }

  // Keeps headings, links and images when pasting from a web page or a document.
  function fromHtml(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const walk = node => {
      if (node.nodeType === 3) return node.textContent.replace(/\s+/g, ' ');
      if (node.nodeType !== 1) return '';
      const tag = node.tagName.toLowerCase();
      if (['script', 'style', 'meta', 'link', 'head', 'title', 'noscript'].includes(tag)) return '';
      const kids = () => Array.from(node.childNodes).map(walk).join('');
      const block = s => `\n${s.trim()}\n`;
      switch (tag) {
        case 'br': return '\n';
        case 'h1': return `\n\n# ${kids().trim()}\n\n`;
        case 'h2': return `\n\n## ${kids().trim()}\n\n`;
        case 'h3': case 'h4': case 'h5': case 'h6': return `\n\n### ${kids().trim()}\n\n`;
        case 'strong': case 'b': { const t = kids().trim(); return t ? `**${t}**` : ''; }
        case 'code': { const t = node.textContent.trim(); return t ? `\`${t}\`` : ''; }
        case 'pre': return `\n\`\`\`\n${node.textContent.trim()}\n\`\`\`\n`;
        case 'blockquote': return `\n${kids().trim().split('\n').map(l => `> ${l}`).join('\n')}\n`;
        case 'hr': return '\n---\n';
        case 'img': { const s = node.getAttribute('src') || ''; return /^https?:/i.test(s) ? `\n![](${s})\n` : ''; }
        case 'a': {
          const href = node.getAttribute('href') || '';
          const t = kids().trim();
          if (!/^https?:/i.test(href)) return t;
          return !t || t === href ? href : `[${t}](${href})`;
        }
        case 'li': {
          const parent = node.parentElement && node.parentElement.tagName.toLowerCase();
          const n = parent === 'ol' ? `${Array.from(node.parentElement.children).indexOf(node) + 1}. ` : '- ';
          return `\n${n}${kids().trim().replace(/\n+/g, ' ')}`;
        }
        case 'p': case 'div': case 'section': case 'article': case 'ul': case 'ol': case 'tr': return block(kids());
        default: return kids();
      }
    };
    return walk(doc.body).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  const Article = { parse, fromHtml, DEFAULT_LABEL };
  if (typeof window !== 'undefined') window.Article = Article;
  if (typeof module !== 'undefined') module.exports = Article;
})();
