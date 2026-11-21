// Applies saved admin content to a public page on its way to the visitor.
// The pages in /public hold the original content; only sections that have been
// saved in the admin are rewritten, so an untouched site is served as-is.

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const attr = (s) => esc(s).replace(/\n/g, '&#10;');
// Text where **double stars** mark bold
const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const get = (o, path) => path.split('.').reduce((v, k) => (v == null ? undefined : v[k]), o);

const CARET = '<svg class="caret" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 4.5L6 8l3.5-3.5"/></svg>';

// "/board" and "/board.html" are both board.html; "/" is index.html
export function pageFile(pathname) {
  const last = pathname.split('/').pop();
  if (!last) return 'index.html';
  return last.includes('.') ? last : last + '.html';
}
const fileOf = (href) => href.split('#')[0].split('?')[0].replace(/^\.?\//, '') || 'index.html';

// The main menu, with the same markup and classes the page generator writes.
function navHtml(header, page) {
  let out = '';
  for (const it of header.items) {
    const kids = it.children || [];
    const here = fileOf(it.href) === page;
    const on = here || kids.some((k) => fileOf(k.href) === page);
    const cls = on ? 'nav on' : 'nav';
    const cur = here ? ' aria-current="page"' : '';
    if (!kids.length) {
      out += `<a class="${cls}" href="${esc(it.href)}"${cur}>${esc(it.label)}</a>`;
      continue;
    }
    out += `<div class="navdrop"><a class="${cls}" href="${esc(it.href)}"${cur}>${esc(it.label)}${CARET}</a><div class="dropmenu">`;
    for (const k of kids) {
      // A link to a section of a page ("page.html#part") is never marked as the current page
      const kon = !k.href.includes('#') && fileOf(k.href) === page ? ' class="on" aria-current="page"' : '';
      out += `<a href="${esc(k.href)}"${kon}>${esc(k.label)}</a>`;
    }
    out += '</div></div>';
  }
  if (header.button && header.button.label) {
    out += `<a class="btn" href="${esc(header.button.href)}">${esc(header.button.label)}</a>`;
  }
  return out;
}

// --- Lists rebuilt from saved content ---------------------------------------
// Each returns the inner HTML for the element tagged data-list="<name>", or
// undefined when that content has not been saved (the original markup stays).

const LISTS = {
  // Dnamo Football Club home page
  'club.ticker': (c) => c.home && Array.isArray(c.home.ticker) ? c.home.ticker.map((v) => `<span>${esc(v)}</span>`).join('').repeat(2) : undefined,
  'club.levels': (c) => c.home && Array.isArray(c.home.levels) ? c.home.levels.map((l, i) =>
    `<a class="card d" href="${esc(l.href)}"><span class="num">${String(i + 1).padStart(2, '0')}</span><h3 class="h">${esc(l.title)}</h3><p>${esc(l.text)}</p><span class="more">Explore more <span class="arr" aria-hidden="true">&rarr;</span></span></a>`).join('') : undefined,
};

// The home page's background video. A YouTube or Vimeo link becomes a muted, looping
// player; anything else is treated as a video file. The first slide stays underneath
// as the picture shown while the video loads.
function videoHtml(url, poster) {
  const still = `<img src="${esc(poster)}" alt="" style="animation:none;opacity:1">`;
  const frame = (src) => `${still}<iframe src="${src}" title="Background video" allow="autoplay; encrypted-media; picture-in-picture" tabindex="-1" aria-hidden="true"></iframe>`;
  let m = url.match(/^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
  if (m) return frame(`https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&amp;mute=1&amp;loop=1&amp;playlist=${m[1]}&amp;controls=0&amp;playsinline=1&amp;rel=0&amp;disablekb=1`);
  m = url.match(/^https:\/\/(?:www\.|player\.)?vimeo\.com\/(?:video\/)?(\d+)/i);
  if (m) return frame(`https://player.vimeo.com/video/${m[1]}?background=1&amp;autoplay=1&amp;muted=1&amp;loop=1`);
  return `<video src="${esc(url)}" poster="${esc(poster)}" autoplay muted loop playsinline preload="metadata"></video>`;
}

export function render(response, saved, pathname, popups = [], tpl, live = null) {
  const { identity, header, footer, photos } = saved;
  if (!Object.keys(saved).length && !popups.length) return response;

  const rw = new HTMLRewriter();
  const page = pageFile(pathname);

  // A page drawn from saved content (the club's inner pages)
  const drawn = tpl.main(page, saved, live);
  if (drawn) rw.on('main', { element(el) { el.setInnerContent('\n' + drawn.html, { html: true }); } });
  const retitle = drawn && drawn.title && drawn.title !== drawn.was ? drawn : null;
  if (identity) {
    rw.on('a.nav.brand', { element(el) {
      // A site with a logo beside its name keeps it there
      const logo = tpl.logo ? `<img class="brand-logo" data-slot="logo" src="${esc((photos && photos.logo) || tpl.logo)}" alt="" width="40" height="40">` : '';
      el.setInnerContent(logo + esc(identity.nameA) + (identity.nameB ? ` <span>${esc(identity.nameB)}</span>` : ''), { html: true });
    } });
  }
  if (identity || retitle) {
    // The browser tab title: swap in the saved site name and initiative title.
    // The text arrives as it is written in the file (already escaped), so it is put back as HTML.
    const full = identity ? (identity.nameA + ' ' + identity.nameB).trim() : null;
    let buffer = '';
    rw.on('title', { text(t) {
      buffer += t.text;
      if (!t.lastInTextNode) { t.remove(); return; }
      let title = buffer;
      if (retitle) title = esc(retitle.title) + ' | ' + tpl.title;
      if (full) title = title.split(tpl.title).join(esc(full));
      t.replace(title, { html: true });
      buffer = '';
    } });
  }

  if (header) {
    rw.on('nav.navbox', { element(el) { el.setInnerContent(navHtml(header, page), { html: true }); } });
  }

  if (footer) {
    rw.on('nav.foot-links', { element(el) {
      el.setInnerContent(footer.links.map((l) => `<a class="nav" href="${esc(l.href)}">${esc(l.label)}</a>`).join(''), { html: true });
    } });
    rw.on('.foot .legal', { element(el) { el.setInnerContent(footer.legal); } });
    rw.on('.foot-base > span', { element(el) { el.setInnerContent(footer.copyright); } });
    const social = (url) => ({ element(el) { if (url) el.setAttribute('href', url); else el.remove(); } });
    rw.on('.soc a[aria-label$="LinkedIn"]', social(footer.linkedin));
    rw.on('.soc a[aria-label$="Instagram"]', social(footer.instagram));
  }

  if (photos && Object.keys(photos).length) {
    rw.on('img[data-slot]', { element(el) {
      const url = photos[el.getAttribute('data-slot')];
      if (url) el.setAttribute('src', url);
    } });
    if (photos.logo) {
      // browser tab icon, phone home-screen icon and the preload hint
      for (const sel of ['link[rel="icon"]', 'link[rel="apple-touch-icon"]', 'link[rel="preload"][as="image"]']) {
        rw.on(sel, { element(el) {
          el.setAttribute('href', photos.logo);
          el.removeAttribute('type');
        } });
      }
    }
  }

  if (saved.home && saved.home.video) {
    const poster = (photos && photos.hero1) || '/hero-1.jpg';
    rw.on('.heromedia', { element(el) { el.setInnerContent(videoHtml(saved.home.video, poster), { html: true }); } });
  } else if (photos && photos.extra && photos.extra.length) {
    // Photos added to the slideshow follow the built-in slides
    rw.on('.heromedia', { element(el) {
      el.append(photos.extra.map((u) => `<img data-extra src="${esc(u)}" alt="" loading="lazy">`).join(''), { html: true });
    } });
  }

  // Page content: single texts, paragraphs, buttons, and rebuilt lists
  rw.on('[data-t]', { element(el) {
    const v = get(saved, el.getAttribute('data-t'));
    if (typeof v === 'string') el.setInnerContent(v);
  } });
  rw.on('[data-p]', { element(el) {
    const v = get(saved, el.getAttribute('data-p'));
    if (Array.isArray(v)) el.setInnerContent(v.map((p) => `<p>${rich(p)}</p>`).join(''), { html: true });
  } });
  rw.on('[data-link]', { element(el) {
    const v = get(saved, el.getAttribute('data-link'));
    if (v && v.label) { el.setAttribute('href', v.href); el.setInnerContent(v.label); }
    else if (v && v.label === '') el.remove();   // a button with no label is left out
  } });
  rw.on('[data-list]', { element(el) {
    const make = LISTS[el.getAttribute('data-list')];
    const html = make && make(saved);
    if (typeof html === 'string') el.setInnerContent(html, { html: true });
  } });

  // Pop-ups that are live for this page travel with it as data; popup.js shows one.
  if (popups.length) {
    const data = JSON.stringify(popups).replace(/</g, '\\u003c');
    rw.on('body', { element(el) {
      el.append(`<script type="application/json" id="dn-popups">${data}</script><script src="/popup.js" defer></script>
`, { html: true });
    } });
  }

  const out = rw.transform(response);
  const headers = new Headers(out.headers);
  headers.delete('ETag');                     // the page no longer matches the stored file
  headers.set('Cache-Control', 'no-cache');
  return new Response(out.body, { status: out.status, headers });
}
