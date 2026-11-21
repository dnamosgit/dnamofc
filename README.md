# Dnamo FC website (dnamofc.com)

The public Dnamo Football Club website, on Cloudflare Pages (free): static pages in `public/`
and a small server layer in `functions/` and `server/` that applies whatever has been edited in
the admin.

**There is no admin in this project.** The admin center lives in the Dnamo Foundation project and
edits both websites from one login. It saves to a shared Cloudflare D1 database (`dnamo-admin`),
and this project reads from that same database. Edits made in the admin appear here straight
away; no code push is needed.

```
Foundation project (admin + Foundation site)  ──saves──▶  D1 database "dnamo-admin"
                                                                  │
Dnamo FC project (this one, display only)  ◀──────reads───────────┘
```

## What is where

| Path | What it is |
|---|---|
| `public/*.html` | The pages as they read before anything is edited. Written by `tools/build-club.mjs`; do not edit by hand. |
| `server/club-content.js` | What every inner page says by default (words, tables, coaches). |
| `server/club.js` | Home page defaults, menu, footer, photo slots and the rules for what may be saved. |
| `server/club-pages.js` | The markup of the inner pages. |
| `tools/shell-head.html`, `tools/shell-foot.html` | The part of every page before the menu and after the content. |
| `server/render.js`, `functions/_middleware.js` | Apply what was saved in the admin to a page as it is served. |
| `server/content.js`, `server/popups.js`, `server/instagram.js` | Read saved content, live pop-ups and the Instagram gallery from the shared database. |

Anything saved in the admin overrides the defaults in these files.

## Changing wording or layout

The page definitions are needed by **both** projects (the admin edits them, this project shows them),
so these files must be identical in both:

`server/club.js`, `server/club-content.js`, `server/club-pages.js`, `server/instagram.js`,
`server/valid.js`, `server/time.js`

This project is the master. Make the change here, then:

```bash
node tools/build-club.mjs                      # regenerate the pages
# copy the changed shared file(s) into the Foundation project's server/ folder, then, in that project:
node tools/check-shared.mjs                    # confirms the two copies match
```

Push both projects. Until both are updated, the admin and this site can disagree about what a
page contains.

## Deploying on Cloudflare

1. Pages → Create → Connect to Git → this repository. Build command: none. Output directory: `public`.
2. The database binding comes from `wrangler.toml` (`DB` → `dnamo-admin`). It must be the **same**
   database the admin saves to.
3. Optional secret `INSTAGRAM_TOKEN`, only if the gallery should show Instagram posts. The site
   renews it by itself.
4. Do **not** set `ADMIN_PATH` or `SETUP_TOKEN` here. There is no admin in this project.

Every push to `main` redeploys. The database tables belong to the Foundation project (its
`migrations/` folder); this project has none.

## Run it on your computer

```bash
npm install
npm run dev        # http://localhost:8788
```

For the pages to show edits, this project must use the same local database as the admin project.
Point its local state at the Foundation project's (a folder link on Windows):

```powershell
New-Item -ItemType Junction -Path .wrangler\state -Target ..\dnamo-site\.wrangler\state
```

`.dev.vars` is optional (`INSTAGRAM_TOKEN` only; see `.dev.vars.example`).
