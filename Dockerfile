# ---------- Base ----------
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# ---------- Dependencias ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---------- Build ----------
FROM deps AS build
ARG GHL_API_BASE_URL
ARG GHL_API_VERSION
ARG GHL_API_TOKEN
ARG GHL_LOCATION_ID
ARG GHL_BLOG_ID

# Hace que las variables existan durante "astro build"
# (necesario si alguna página se prerenderiza y llama a la API de GHL)
ENV GHL_API_BASE_URL=$GHL_API_BASE_URL
ENV GHL_API_VERSION=$GHL_API_VERSION
ENV GHL_API_TOKEN=$GHL_API_TOKEN
ENV GHL_LOCATION_ID=$GHL_LOCATION_ID
ENV GHL_BLOG_ID=$GHL_BLOG_ID

COPY . .
RUN pnpm build

# ---------- Producción ----------
FROM base AS runtime
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod

COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "./dist/server/entry.mjs"]