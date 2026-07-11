# Waypoint

A self-hosted, single-user bookmark manager in the spirit of Raindrop.io: nested collections, tags, full-text search, custom favicons/cover images, automatic metadata fetch, a browser extension + bookmarklet for one-click saving, and import from a browser/Raindrop bookmarks export. No login, no multi-tenancy — it's yours alone.

## Stack

Next.js (App Router, TypeScript) + Prisma + Postgres, one container, a `/data` volume for uploaded/fetched images. No separate backend.

## Quick start

```bash
docker compose up -d --build
```

Open `http://<host>:8745`. The database schema migrates automatically on first boot, and an API token for the browser extension is generated automatically — find it any time under **Settings**.

## Features

- **Collections** — nested folders with drag-and-drop reordering and re-parenting (drag onto a folder to nest, near its top/bottom edge to reorder).
- **Bookmarks** — adding a URL auto-fetches its title, description, favicon, and `og:image` cover, all downloaded and stored locally (never hotlinked) so bookmarks survive the source site changing or disappearing.
- **Custom favicons/covers** — override the auto-fetched favicon or cover image any time from the bookmark's edit drawer.
- **Tags + full-text search** — tag bookmarks freely; search covers title, description, URL, and notes via Postgres full-text search.
- **Browser extension** — a Manifest V3 extension (`extension/`) for one-click saving from the toolbar, with a collection picker and tags.
- **Bookmarklet** — a drag-to-bookmarks-bar link for saving without installing anything.
- **Import** — upload a Netscape Bookmark File (the `.html` export Chrome, Firefox, and Raindrop all produce); folder structure and embedded favicons are preserved.

## Browser extension setup

1. `cd extension && npm install && npm run build`
2. Open `chrome://extensions`, enable Developer mode
3. Click **Load unpacked**, select `extension/dist`
4. Open the extension's options page and enter your Waypoint URL and the API token from **Settings**

## API

| Method | Path | Purpose |
|---|---|---|
| GET, POST | `/api/collections` | List / create collections |
| PATCH, DELETE | `/api/collections/{id}` | Rename, re-parent, or delete a collection |
| POST | `/api/collections/reorder` | Persist a drag-and-drop reorder/re-parent |
| GET, POST | `/api/bookmarks` | List (`?collectionId=`, `?unsorted=true`, `?tag=`) / create a bookmark |
| GET, PATCH, DELETE | `/api/bookmarks/{id}` | Read, edit, or delete a bookmark |
| POST | `/api/bookmarks/{id}/image` | Upload a custom favicon or cover (`type=favicon\|cover`, `file=`) |
| GET | `/api/search` | Full-text search (`?q=`, `?collectionId=`, `?tag=`) |
| GET | `/api/tags` | List all tags |
| GET, POST | `/api/settings/token` | View / regenerate the extension API token |
| POST | `/api/import` | Import a Netscape Bookmark File (`file=`, optional `parentId=`) |
| POST | `/api/extension/save` | Bearer-token-protected save, used by the extension/bookmarklet |
| GET | `/api/extension/collections`, `/api/extension/tags` | Bearer-token-protected reads for the extension popup |

## Version control and updates

### One-time: publish to GitHub

```bash
git init
git add .
git commit -m "Initial Waypoint"
git branch -M main
git remote add origin git@github.com:<you>/waypoint.git
git push -u origin main
```

### Tier 1: pull and rebuild on the box

```bash
chmod +x update.sh   # once
./update.sh          # git pull --ff-only + docker compose up -d --build + prune
```

### Tier 2: build in CI, pull the image

`.github/workflows/build.yml` builds on every push to `main` and pushes to GHCR. On the host:

1. Push to `main` — GitHub Actions publishes `ghcr.io/<you>/waypoint:latest`
2. Deploy with `docker-compose.ghcr.yml` (set `<youruser>` first, `docker login ghcr.io` once if private)
3. Update: `docker compose -f docker-compose.ghcr.yml pull && docker compose -f docker-compose.ghcr.yml up -d`

## Local development

1. Clone and open in VS Code
2. Run Postgres however you like and set `DATABASE_URL` in `.env` (see `docker-compose.yml` for the expected shape)
3. `npm install && npx prisma migrate dev && npm run dev` → open `http://localhost:3000`
4. Commit and push; deploy with `./update.sh` on the server

## Third-party assets

Some collection icons use [Twemoji](https://github.com/jdecked/twemoji) graphics, © Twitter, Inc and other contributors, licensed under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/).
