// Writes the Dnamo Football Club pages into public/.
// The words come from server/club.js and server/club-content.js, the same
// defaults the admin center uses, so the pages and the admin can never disagree.
// The <head> and footer come from tools/shell-head.html and tools/shell-foot.html.
//     node tools/build-club.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLUB } from '../server/club.js';
import { CLUB_PAGES, keyOf } from '../server/club-content.js';
import { pageMain } from '../server/club-pages.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const D = CLUB.DEFAULTS;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const CARET = '<svg class="caret" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 4.5L6 8l3.5-3.5"/></svg>';

// The page shell: everything before the menu and after the main content.
// tools/shell-head.html and tools/shell-foot.html hold {{placeholders}} that are filled below.
const TOOLS = path.dirname(fileURLToPath(import.meta.url));
const shellHead = fs.readFileSync(path.join(TOOLS, 'shell-head.html'), 'utf8');
const shellFoot = fs.readFileSync(path.join(TOOLS, 'shell-foot.html'), 'utf8');
const fill = (s, values) => s.replace(/\{\{(\w+)\}\}/g, (_, k) => {
  if (!(k in values)) throw new Error('the shell has an unknown placeholder: ' + k);
  return values[k];
});
const foot = fill(shellFoot, {
  footLinks: D.footer.links.map((l) => `<a class="nav" href="${esc(l.href)}">${esc(l.label)}</a>`).join(''),
  legal: esc(D.footer.legal),
  copyright: esc(D.footer.copyright),
  linkedin: D.footer.linkedin,
  instagram: D.footer.instagram,
});

const fileOf = (h) => h.split('#')[0].replace(/^\.\//, '') || 'index.html';

// The menu, with the same markup the server writes once it has been edited (server/render.js)
function nav(file) {
  let out = '';
  for (const it of D.header.items) {
    const here = fileOf(it.href) === file;
    const on = here || it.children.some((k) => fileOf(k.href) === file);
    const cls = on ? 'nav on' : 'nav';
    const cur = here ? ' aria-current="page"' : '';
    if (!it.children.length) { out += `\n      <a class="${cls}" href="${esc(it.href)}"${cur}>${esc(it.label)}</a>`; continue; }
    out += `\n      <div class="navdrop"><a class="${cls}" href="${esc(it.href)}"${cur}>${esc(it.label)}${CARET}</a><div class="dropmenu">`;
    for (const k of it.children) {
      const kon = !k.href.includes('#') && fileOf(k.href) === file ? ' class="on" aria-current="page"' : '';
      out += `<a href="${esc(k.href)}"${kon}>${esc(k.label)}</a>`;
    }
    out += '</div></div>';
  }
  return out + `\n      <a class="btn" href="${esc(D.header.button.href)}">${esc(D.header.button.label)}</a>`;
}

const header = (file) => `<header class="site-header">
  <div class="w">
    <a class="nav brand" href="./"><img class="brand-logo" data-slot="logo" src="${CLUB.logo}" alt="" width="40" height="40">${esc(D.identity.nameA)} <span>${esc(D.identity.nameB)}</span></a>
    <button class="nav burger" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
    <nav class="navbox" id="site-nav" aria-label="Main">${nav(file)}
    </nav>
  </div>
</header>
`;

function write(file, title, description, bodyClass, main, extraHead = '') {
  const head = fill(shellHead, { title: esc(title), description: esc(description), bodyClass: bodyClass ? ` class="${bodyClass}"` : '', extraHead });
  fs.writeFileSync(path.join(ROOT, file), head + header(file) + '\n<main>\n' + main + '</main>\n\n' + foot);
}

// --- Home -------------------------------------------------------------------
const h = D.home;
write('index.html', CLUB.title, 'Dnamo Football Club is a San Francisco youth soccer club with programs for every level, from Microsoccer to Travel teams.', 'home', `<section class="dark">
  <div class="hero2">
    <!-- Hero slideshow: the photos cross-fade in turn (script.js). More can be added in the admin; a video link there replaces them. -->
    <div class="heromedia" role="img" aria-label="Dnamo players and coaches training on pitches in San Francisco">
      <img data-slot="hero1" src="/hero-1.jpg" alt="" fetchpriority="high">
      <img data-slot="hero2" src="/hero-2.jpg" alt="">
      <img data-slot="hero3" src="/hero-3.jpg" alt="">
      <img data-slot="hero4" src="/hero-4.jpg" alt="">
    </div>
    <div class="herotx">
      <p class="kicker" data-t="home.kicker">${esc(h.kicker)}</p>
      <h1 class="h" data-t="home.headline">${esc(h.headline)}</h1>
      <p class="intro" data-t="home.intro">${esc(h.intro)}</p>
      <div class="row-wrap g16"><a class="btn" data-link="home.button1" href="${esc(h.button1.href)}">${esc(h.button1.label)}</a><a class="btn o" data-link="home.button2" href="${esc(h.button2.href)}">${esc(h.button2.label)}</a></div>
    </div>
    <span class="herocue" aria-hidden="true"></span>
  </div>
</section>

<!-- Decorative ticker of the club's programs; hidden from screen readers -->
<div class="marquee mq-dark" aria-hidden="true"><div class="mq-track" data-list="club.ticker">${h.ticker.map((w) => `<span>${esc(w)}</span>`).join('').repeat(2)}</div></div>

<section class="dark">
  <div class="w pad-l">
    <p class="eyebrow" data-t="home.levelsEyebrow">${esc(h.levelsEyebrow)}</p>
    <h2 class="h" data-t="home.levelsTitle">${esc(h.levelsTitle)}</h2>
    <div class="levels-intro" data-p="home.levelsIntro">${h.levelsIntro.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
    <div class="grid four" data-list="club.levels">${h.levels.map((l, i) => `<a class="card d" href="${esc(l.href)}"><span class="num">${String(i + 1).padStart(2, '0')}</span><h3 class="h">${esc(l.title)}</h3><p>${esc(l.text)}</p><span class="more">Explore more <span class="arr" aria-hidden="true">&rarr;</span></span></a>`).join('')}</div>
  </div>
</section>
<section class="band">
  <div class="w">
    <h2 class="h" data-t="home.joinTitle">${esc(h.joinTitle)}</h2>
    <p data-t="home.joinText">${esc(h.joinText)}</p>
    <a class="btn" data-link="home.joinButton" href="${esc(h.joinButton.href)}">${esc(h.joinButton.label)}</a>
  </div>
</section>
`);

// --- Every other page -------------------------------------------------------
for (const p of CLUB_PAGES) {
  const c = D[keyOf(p.slug)];
  write(p.slug + '.html', `${c.title} | ${CLUB.title}`, c.lead || c.title, '', pageMain(p.slug, D));
}

// --- Page not found ------------------------------------------------------------
write('404.html', 'Page not found | ' + CLUB.title, 'Page not found.', '', `<section class="w pad">
  <p class="eyebrow">404</p>
  <h1 class="h">Page not found</h1>
  <p class="lead">The page you are looking for does not exist or has moved.</p>
  <div class="row-wrap g12 club-btns"><a class="btn" href="/">Back to the home page</a><a class="btn s" href="programs.html">Our programs</a></div>
</section>
`, '\n<base href="/">\n<meta name="robots" content="noindex">');
console.log('wrote public/: index.html, 404.html and ' + CLUB_PAGES.length + ' pages');
