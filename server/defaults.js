// The rules every site shares for what may be saved: its name, menu, footer and photos.
// (What each site says when nothing has been changed is in server/club.js.)

import { href, link, list, text } from './valid.js';

export const MAX_EXTRA_SLIDES = 8;

// --- Validation -----------------------------------------------------------
// Each cleaner returns a tidy copy of what was sent, or throws an Error whose
// message is shown to the admin.

const CLEAN = {
  identity(v) {
    return { nameA: text(v.nameA, 40, 'The first part of the name'), nameB: text(v.nameB, 60, 'The second part of the name', false) };
  },
  header(v) {
    const items = list(v.items, 8, 'Menu links').map((it) => {
      const base = link(it, 'Menu link');
      base.children = list(it.children || [], 10, `Dropdown under "${base.label}"`).map((c) => link(c, 'Dropdown link'));
      return base;
    });
    if (!items.length) throw new Error('The menu needs at least one link.');
    const b = v.button && typeof v.button === 'object' ? v.button : {};
    const label = text(b.label, 30, 'The button label', false);
    return { items, button: { label, href: label ? href(b.href, 'The button') : '' } };
  },
  footer(v) {
    return {
      links: list(v.links, 10, 'Footer links').map((l) => link(l, 'Footer link')),
      legal: text(v.legal, 400, 'The legal line', false),
      copyright: text(v.copyright, 120, 'The copyright line', false),
      linkedin: socialUrl(v.linkedin, 'LinkedIn'),
      instagram: socialUrl(v.instagram, 'Instagram'),
    };
  },
};

// Replaced photos (one per slot) and the photos added to the home slideshow
export function photosCleaner(slots) {
  return (v) => {
    const out = {};
    for (const slot of slots) {
      const val = v[slot.id];
      if (val == null || val === '') continue;
      if (!/^\/media\/[0-9a-f]{24}$/.test(val)) throw new Error('That photo is not one uploaded here.');
      out[slot.id] = val;
    }
    // Photos added to the home slideshow, shown after the four built-in slides
    const extra = [...new Set(list(v.extra || [], MAX_EXTRA_SLIDES, 'Extra slideshow photos'))];
    for (const val of extra) if (!/^\/media\/[0-9a-f]{24}$/.test(val)) throw new Error('That photo is not one uploaded here.');
    if (extra.length) out.extra = extra;
    return out;
  };
}

// The parts every site has: its name, its menu and its footer
export const SHARED_CLEAN = { identity: CLEAN.identity, header: CLEAN.header, footer: CLEAN.footer };

function socialUrl(v, what) {
  const s = String(v == null ? '' : v).trim();
  if (!s) return '';
  if (!/^https:\/\/[^\s<>"']+$/i.test(s) || s.length > 300) throw new Error(`${what}: use the full address starting with https://`);
  return s;
}

