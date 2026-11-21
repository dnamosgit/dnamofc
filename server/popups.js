// Pop-ups: the ones that are live for a page. (They are made and edited in the admin.)
import { now } from './time.js';

const MAX_SHOWN = 5;          // at most this many are sent to a page; the visitor sees one

// Public: the pop-ups that are on, inside their dates and meant for this page.
// Only what a visitor's browser needs is returned.
export async function activePopups(env, siteId, page) {
  const t = now();
  const rows = (await env.DB.prepare(
    `SELECT id, data FROM popups WHERE site_id = ? AND enabled = 1
       AND (starts_at IS NULL OR starts_at <= ?) AND (ends_at IS NULL OR ends_at > ?)
     ORDER BY id DESC`).bind(siteId, t, t).all()).results;
  const out = [];
  for (const r of rows) {
    let d;
    try { d = JSON.parse(r.data); } catch (e) { continue; }
    if (d.pages !== 'all' && !(Array.isArray(d.pages) && d.pages.includes(page))) continue;
    out.push({ id: r.id, title: d.title, text: d.text, image: d.image, label: d.label || '', layout: d.layout || 'card', button: d.button, frequency: d.frequency, delay: d.delay });
    if (out.length >= MAX_SHOWN) break;
  }
  return out;
}
