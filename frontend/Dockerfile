# ─────────────────────────────────────────────────────────────
# frontend/Dockerfile
# Node 20 + Vite dev server with hot reload
# ─────────────────────────────────────────────────────────────

FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source (overridden by volume mount in dev)
COPY . .

# Vite must listen on 0.0.0.0 to be accessible outside container
# --host flag enables this
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
