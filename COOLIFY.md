# Deploying Aquastat to Coolify

This deploys the **Stage 1 frontend preview** (static SPA, mock data, no backend yet) using a multi-stage Docker build: Node 22 to build the Vite bundle, nginx 1.27 to serve it.

## Files added for deployment

| File | Purpose |
|---|---|
| `app/Dockerfile` | Multi-stage build: `node:22-alpine` → `nginx:1.27-alpine`. Health check baked in. |
| `app/nginx.conf` | SPA fallback (`try_files $uri /index.html`), gzip, cache headers, CSP for Google Fonts, `/healthz` endpoint. |
| `app/.dockerignore` | Excludes `node_modules`, `dist`, `.git` from build context. |
| `app/docker-compose.yml` | Optional — local production sanity check before pushing. |
| `.gitignore` | Standard ignores at repo root. |

## Step 1 — Get the code into a git repo

You don't have a git repo yet. From the project root:

```bash
cd "C:\Users\pete_\Claude app\Aquastat"
git init
git add .
git commit -m "Aquastat Stage 1 — frontend preview + Coolify deploy"
```

Then push to GitHub / GitLab / Gitea (whichever Coolify pulls from). Example:

```bash
git branch -M main
git remote add origin git@github.com:<you>/aquastat.git
git push -u origin main
```

> **Note:** The `stitch_ui_review/` folder is `.gitignore`d (reference assets only — not needed for deploy). Remove that line from `.gitignore` if you want it tracked.

## Step 2 — Create the application in Coolify

In your Coolify dashboard:

1. **+ New Resource → Application**
2. Source: choose your Git provider, pick the `aquastat` repo, branch `main`
3. **Build Pack:** `Dockerfile`
4. **Base Directory:** `/app`  ← critical, because the Dockerfile lives in the `app/` subfolder
5. **Dockerfile location:** `Dockerfile` (relative to Base Directory)
6. **Port (exposed):** `80`
7. **Health check path:** `/healthz`
8. Click **Deploy**

The first build takes 60–120 seconds (npm ci + vite build). Subsequent builds reuse the npm layer if `package-lock.json` is unchanged.

## Step 3 — Domain & HTTPS

In Coolify, on the application page:

1. **Domains** → add your domain (e.g. `aquastat.example.com`)
2. Coolify provisions Let's Encrypt automatically once DNS points to the server
3. Force HTTPS: on

## Step 4 — Verify

After deploy completes:

```bash
curl -I https://aquastat.example.com/healthz
# Should return: HTTP/2 200 + Content-Type: text/plain

curl -I https://aquastat.example.com/coach
# Should return: HTTP/2 200 + serves index.html (SPA fallback)
```

Open in browser:
- `/` redirects to `/login`
- Pick a demo role → routes to that role's dashboard
- Locale switcher (EL/EN) works
- Resize window: < 1024px shows mobile bottom nav, ≥ 1024px shows desktop sidebar

## Local sanity check before pushing

If you want to verify the Docker image locally first:

```bash
cd app
docker compose up --build
# Visit http://localhost:8080
```

This builds the same image Coolify will build and serves it on port 8080.

## Future: when you add the backend

Once Phase 1 backend (Node/Express + Postgres per PDR §17) is built, you'll add to Coolify:

1. **PostgreSQL** as a separate Coolify Resource (managed database)
2. **API application** as a second Coolify Application pointing at `api/` subfolder with its own Dockerfile
3. **Reverse proxy / routing:** either
   - Same domain, path-based: `aquastat.example.com/api/*` → API, everything else → frontend (configured in Coolify's reverse proxy / Traefik labels)
   - Or subdomain: `api.aquastat.example.com` for API, `aquastat.example.com` for frontend
4. Frontend reads `VITE_API_URL` at build time — pass it as a Coolify build-time env var, baked into the bundle

For now, Stage 1 is fully self-contained — mock data lives in `app/src/lib/mockData.ts`. No env vars, no secrets, no external services.

## Troubleshooting

**Build fails: "Cannot find module @/lib/..."**
→ Coolify build needs the full repo. Check Base Directory is `/app`, not `/`.

**404 on direct navigation to `/coach`**
→ nginx SPA fallback should handle this. If it's failing, check `nginx.conf` was copied correctly in the Dockerfile. The `RUN` build step would have errored otherwise.

**Fonts not loading**
→ Browser blocks Google Fonts due to CSP. The provided `nginx.conf` whitelists `fonts.googleapis.com` and `fonts.gstatic.com`. If you change the CSP, keep those entries.

**Container starts but health check fails**
→ Coolify defaults sometimes target the wrong port. Confirm port `80` in the Coolify Application config matches `EXPOSE 80` in the Dockerfile.
