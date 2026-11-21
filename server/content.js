// Reading a site's saved content and its uploaded photos from the shared database.
// The admin (in the Foundation project) writes them; this project only displays them.
import { CLUB } from './club.js';

// The site this project shows: the Dnamo Football Club site in the shared database,
// as { id, tpl }, or null when it has not been set up.
export async function siteFor(env) {
  const row = await env.DB.prepare("SELECT id FROM sites WHERE kind = 'full' AND template = 'club' ORDER BY id LIMIT 1").first();
  return row ? { id: row.id, tpl: CLUB } : null;
}

// Only what has been saved, as { key: value }. Unsaved keys are absent.
export async function savedContent(env, siteId, tpl) {
  const rows = (await env.DB.prepare('SELECT key, value FROM content WHERE site_id = ?').bind(siteId).all()).results;
  const out = {};
  for (const r of rows) {
    if (!tpl.KEYS.includes(r.key)) continue;
    try { out[r.key] = JSON.parse(r.value); } catch (e) { /* ignore a damaged row; the default shows */ }
  }
  return out;
}

// Public: /media/<id>. Ids are random and files never change, so they cache forever.
export async function serveMedia(context, id) {
  const { request, env } = context;
  const cache = caches.default;
  const hit = await cache.match(request);
  if (hit) return hit;
  const row = await env.DB.prepare('SELECT type, data FROM media WHERE id = ?').bind(id).first();
  if (!row) return null;
  const bytes = row.data instanceof ArrayBuffer ? row.data : new Uint8Array(row.data);
  const res = new Response(bytes, { headers: {
    'Content-Type': row.type,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'",
  } });
  context.waitUntil(cache.put(request, res.clone()));
  return res;
}
