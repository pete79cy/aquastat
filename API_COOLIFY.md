# Deploying the Aquastat API to Coolify

The API lives at `api/` in this monorepo. It's an Express 5 + Postgres + Drizzle service that exposes `/api/auth`, `/api/clubs`, `/api/athletes`, `/api/competitions`, `/api/results`, `/api/standards`.

## Architecture

```
Browser
  ↓
host nginx :443  (aquastat.pakkou.cloud)         ── existing
  ├─ /api/*  → 127.0.0.1:5510  (Aquastat API container)
  └─ /*      → 127.0.0.1:5501  (Aquastat frontend container)
  ↓
Postgres 17 (Coolify-managed database)
```

So one domain, path-based routing. The frontend keeps speaking to the same origin (no CORS preflights for production).

## Step 1 — Create the Postgres database in Coolify

1. Coolify dashboard → **+ New Resource → Database → PostgreSQL**
2. Image: `postgres:17` (or 17-alpine)
3. Database name: `aquastat`
4. Username: `aquastat`
5. Password: generate a strong one — copy it
6. **Deploy**
7. Once running, note the **internal hostname** Coolify assigns (something like `postgresql-database-xxxxx`). You'll use it in the API env vars.

## Step 2 — Create the API application

1. **+ New Resource → Application**
2. **Public Repository:** `https://github.com/pete79cy/aquastat` (same repo as frontend)
3. **Branch:** `main`
4. **Build Pack:** Dockerfile
5. **Base Directory:** `/api`  ← API lives in subfolder, same trick as the frontend
6. **Dockerfile location:** `Dockerfile`
7. **Port (Ports Exposes):** `4000`
8. **Health check path:** `/healthz`
9. **Ports Mappings:** `5510:4000` (frees the API on host port 5510 so host nginx can reverse-proxy to it)

### Environment variables

```
NODE_ENV=production
PORT=4000
LOG_LEVEL=info
DATABASE_URL=postgres://aquastat:<your-password>@<coolify-postgres-host>:5432/aquastat
JWT_SECRET=<generate-with: openssl rand -base64 48>
JWT_EXPIRES_IN=7d
CORS_ORIGINS=https://aquastat.pakkou.cloud
SEED_FEDERATION_ADMIN_EMAIL=admin@aquastat.cy
SEED_FEDERATION_ADMIN_PASSWORD=<choose-a-strong-one>
```

10. **Deploy**

## Step 3 — Run migrations + seed (one-time)

After the first successful deploy, exec into the container:

```bash
# From the Coolify Application → Terminal tab, OR via docker on the host:
docker exec -it <aquastat-api-container> sh

# Inside the container:
npm run db:migrate    # creates all 21 tables + pgcrypto extension
npm run db:seed       # creates 4 clubs, 4 users (one per role), season 2025-2026, 6 categories, 28 swim events, 3 athletes
```

The seed script is **idempotent** — re-running it skips if the federation admin already exists.

## Step 4 — Update host nginx vhost

Add `/api/*` proxying to the existing `aquastat.pakkou.cloud` vhost on the VPS:

```bash
sudo tee /etc/nginx/sites-available/aquastat.pakkou.cloud > /dev/null <<'EOF'
server {
    server_name aquastat.pakkou.cloud;

    # API — Express on port 5510
    location /api/ {
        proxy_pass http://127.0.0.1:5510;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    location = /healthz/api {
        proxy_pass http://127.0.0.1:5510/healthz;
    }

    # Frontend SPA — Vite/nginx on port 5501
    location / {
        proxy_pass http://127.0.0.1:5501;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/aquastat.pakkou.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aquastat.pakkou.cloud/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = aquastat.pakkou.cloud) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name aquastat.pakkou.cloud;
    return 404;
}
EOF

sudo nginx -t && sudo systemctl reload nginx
```

> Adjust the certificate paths if your existing vhost has different ones. Keep the existing `listen 443 ssl` block from your current file — just add the `/api/` location ahead of the catch-all `/`.

## Step 5 — Verify

```bash
# Health
curl -s https://aquastat.pakkou.cloud/healthz/api | jq
# → {"status":"ok","time":"2026-..."}

# Login
curl -s -X POST https://aquastat.pakkou.cloud/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aquastat.cy","password":"<seed-password>"}' | jq

# Returns: { "token": "...", "user": { "id":"...", "name":"Νίκος Παπαδόπουλος", "role":"federation_admin", ... } }

# Authenticated request
TOKEN="<paste-token-from-login>"
curl -s https://aquastat.pakkou.cloud/api/clubs \
  -H "Authorization: Bearer $TOKEN" | jq
# Returns: { "clubs": [ {...}, {...}, {...}, {...} ] }
```

## Demo users (seeded)

| Role | Email | Password |
|---|---|---|
| Federation Admin | `admin@aquastat.cy` | `SEED_FEDERATION_ADMIN_PASSWORD` env var |
| Club Admin | `club.admin@aquastat.cy` | `ClubAdminDemo!1` |
| Coach | `coach@aquastat.cy` | `CoachDemo!1` |
| Parent | `parent@aquastat.cy` | `ParentDemo!1` |

**Change all of these in production.** They are seed-time placeholders only.

## Endpoints currently exposed

| Method | Path | Auth | Roles |
|---|---|---|---|
| POST | `/api/auth/login` | — | any |
| POST | `/api/auth/logout` | — | any |
| GET | `/api/auth/me` | required | any |
| POST | `/api/auth/forgot-password` | — | any |
| POST | `/api/auth/reset-password` | — | any |
| GET | `/api/clubs` | required | scoped |
| GET | `/api/clubs/:id` | required | scoped |
| POST | `/api/clubs` | required | federation_admin |
| PATCH | `/api/clubs/:id` | required | federation_admin, club_admin |
| GET | `/api/athletes` | required | scoped per role |
| GET | `/api/athletes/:id` | required | with access check |
| GET | `/api/athletes/:id/results` | required | with access check |
| POST | `/api/athletes` | required | federation_admin, club_admin |
| PATCH | `/api/athletes/:id` | required | federation_admin, club_admin |
| GET | `/api/competitions` | required | any |
| GET | `/api/competitions/:id` | required | any |
| POST | `/api/competitions` | required | federation_admin, club_admin |
| PATCH | `/api/competitions/:id` | required | federation_admin, club_admin |
| POST | `/api/results/competition` | required | federation_admin, club_admin, coach |
| POST | `/api/results/training` | required | federation_admin, club_admin, coach |
| GET | `/api/results/training/athlete/:athleteId` | required | with access check |
| GET | `/api/standards` | required | any |

Full CRUD (DELETE, PATCH for results, AI extraction endpoints, document upload) comes in Stage 3b.

## Local sanity test

```bash
cd api
cp .env.example .env
# Edit .env: set DATABASE_URL=postgres://aquastat:aquastat@localhost:5432/aquastat
docker compose up -d db
npm install
npm run db:migrate
npm run db:seed
npm run dev
# Visit http://localhost:4000/healthz
```

Or end-to-end via Docker:

```bash
cd api
docker compose up --build
# Wait ~15s for db healthcheck + api start
docker compose exec api npm run db:migrate
docker compose exec api npm run db:seed
curl http://localhost:4000/healthz
```
