# syntax=docker/dockerfile:1.7

# ─── Stage 1: build ────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Install deps first (better layer caching)
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Build
COPY . .
RUN npm run build

# ─── Stage 2: runtime (nginx) ──────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# SPA-aware nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static assets
COPY --from=build /app/dist /usr/share/nginx/html

# Coolify health check & port
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
