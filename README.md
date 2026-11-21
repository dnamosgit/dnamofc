# Dnamo FC website (dnamofc.com)

The Dnamo Football Club website and the admin center that edits it. It runs on
Cloudflare Pages (free): static pages in `public/`, a small server layer in
`functions/` and `server/`, and a Cloudflare D1 database for admin accounts and
everything edited in the admin.

- **Public site:** home page, tryouts, about (coaches and gallery), age groups, fees,
  resources, eight programs, six camps and contact.
- **Admin center:** at a secret address only you know. Edit every page, the coaches,
  photos, menu and footer, and pop-ups. Edits go live immediately; no code push needed.
- **Instagram gallery:** the gallery can show the latest Instagram posts.

## Set it up on Cloudflare (once)

1. **Database.** It is already created (`dnamofc-admin`, id in `wrangler.toml`) and its tables are
   in place. To set it up again from scratch (a different Cloudflare account):
   ```bash
   npm install
   npx wrangler login
   npx wrangler d1 create dnamofc-admin   # paste the id it prints into wrangler.toml
   npm run db:remote                      # create the tables
   ```
2. **Create the Pages project.** In the Cloudflare dashboard: Workers & Pages → Create →
   Pages → Connect to Git → choose this repository. Build command: leave empty.
   Build output directory: `public`.
3. **Add the D1 binding.** Project → Settings → Bindings → add a D1 database binding named `DB`
   pointing at `dnamofc-admin` (production).
4. **Add secrets.** Project → Settings → Variables and Secrets → add as type *Secret*:
   - `ADMIN_PATH`: the secret address of the admin, at least 8 letters and numbers, for
     example `desk-7f3k29xq`. The admin is then at `https://<your site>/desk-7f3k29xq/`.
   - `SETUP_TOKEN`: a one-time setup code, at least 16 characters.
   - `INSTAGRAM_TOKEN` (optional): an Instagram access token, only if the gallery should
     show Instagram posts. The site renews it by itself.

   Type these yourself and keep them private. Never put them in the repository.
5. **Redeploy**, open `https://<your site>/<ADMIN_PATH>/`, and create the owner account with
   the setup code. After that the setup screen never appears again.
6. **dnamofc.com.** When ready, add the domain under the project's Custom domains and update
   the DNS as Cloudflare says. The current site on that domain keeps working until then.

Every push to `main` redeploys automatically.

## Run it on your computer

Copy `.dev.vars.example` to `.dev.vars` (it is ignored by git) and put in test values, then:

```bash
npm run db:local
npm run dev        # http://localhost:8788
```

Admin: `http://localhost:8788/<ADMIN_PATH>/`.

## How it is organised

| Path | What it is |
|---|---|
| `public/*.html` | The pages as they read before anything is edited. Written by `tools/build-club.mjs`; do not edit by hand. |
| `server/club-content.js` | What every inner page says by default (the words, tables, coaches). |
| `server/club.js` | The home page defaults, menu, footer, photo slots and the rules for what may be saved. |
| `server/club-pages.js` | The markup of the inner pages. |
| `tools/shell-head.html`, `tools/shell-foot.html` | The part of every page before the menu and after the content. |
| `server/render.js`, `functions/_middleware.js` | Apply what was saved in the admin to a page as it is served. |
| `public/_adm/` | The admin center (served only under `ADMIN_PATH`). |
| `migrations/` | Database tables. |

To change default wording or add a page, edit `server/club-content.js`, then run

```bash
node tools/build-club.mjs
```

and commit the regenerated pages. Anything saved in the admin overrides these defaults.

## Notes

- `public/styles.css` and `public/script.js` still contain some styling and code carried over from
  a sister site that this project no longer uses. It is harmless and can be trimmed later.
- The Sites screen in the admin can also add *pop-ups only* sites: other websites that show
  pop-ups made here by loading one script line.
