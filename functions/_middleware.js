// Runs in front of every request to the site.
//  - /media/<id> serves photos uploaded in the admin.
//  - Public pages pass through, with any content saved in the admin applied.
// This project has no admin of its own: the admin lives in the Foundation project and
// saves to the shared database that this project reads.
import { notFound } from '../server/assets.js';
import { savedContent, serveMedia, siteFor } from '../server/content.js';
import { activePopups } from '../server/popups.js';
import { pageFile, render } from '../server/render.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Files the admin used to keep here are never served.
  if (path === '/_adm' || path.startsWith('/_adm/')) return page(context, url, await notFound(env, url));

  const media = path.match(/^\/media\/([0-9a-f]{24})$/);
  if (media && env.DB && request.method === 'GET') {
    return (await serveMedia(context, media[1])) || page(context, url, await notFound(env, url));
  }

  // Pages are always fetched in full (never "not modified"), because saved
  // content can change what a page shows without the file itself changing.
  const last = path.split('/').pop();
  if (request.method === 'GET' && (!last.includes('.') || last.endsWith('.html'))) {
    const headers = new Headers(request.headers);
    headers.delete('If-None-Match');
    headers.delete('If-Modified-Since');
    return page(context, url, await context.next(new Request(request, { headers })));
  }
  return context.next();
}

// Apply saved admin content to an HTML response. If anything goes wrong
// (for example the database is unreachable) the original page is served.
async function page(context, url, response) {
  const { request, env } = context;
  if (request.method !== 'GET' || !env.DB) return response;
  if (!(response.headers.get('Content-Type') || '').includes('text/html')) return response;
  try {
    const site = await siteFor(env);
    if (!site) return response;
    // Pop-ups are for real pages only, never the "page not found" page.
    const [saved, popups] = await Promise.all([
      savedContent(env, site.id, site.tpl),
      response.status === 200 ? activePopups(env, site.id, pageFile(url.pathname)).catch(() => []) : [],
    ]);
    // Anything a page shows that is fetched as it is asked for (Instagram posts). A failure leaves it out.
    const live = response.status === 200 ? await site.tpl.live(env, site.id, pageFile(url.pathname), saved).catch(() => null) : null;
    return render(response, saved, url.pathname, popups, site.tpl, live);
  } catch (e) {
    console.error('render failed', e);
    return response;
  }
}
