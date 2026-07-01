# syntax=docker/dockerfile:1.7
#
# IMES 前端静态站点（nginx SPA，对齐 neoWebSchool Dockerfile-test）
# 构建前 inject-version 写入版本号，Vite 输出 imesassetsv2/{semver}-{buildId}/

FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.31.0 --activate

ENV NODE_OPTIONS=--max-old-space-size=6144
ENV CI=true

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY web/package.json web/
COPY api/package.json api/
RUN --mount=type=cache,id=imes-pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY web/ web/

ARG VITE_API_URL
ARG VITE_APP_VENDOR
ARG VITE_APP_LICENSEE
ARG VITE_APP_PRODUCT_NAME
ARG VITE_BASE_URL

ENV VITE_API_URL=$VITE_API_URL \
    VITE_APP_VENDOR=$VITE_APP_VENDOR \
    VITE_APP_LICENSEE=$VITE_APP_LICENSEE \
    VITE_APP_PRODUCT_NAME=$VITE_APP_PRODUCT_NAME

RUN pnpm -C web build

FROM nginx:alpine AS runner

ARG NGINX_CONF=nginx.spa.conf
COPY ${NGINX_CONF} /etc/nginx/conf.d/default.conf
COPY --from=builder /app/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
