# --- Compilation ---
FROM node:22-alpine AS build
WORKDIR /app

# Installation séparée : la couche reste en cache tant que les dépendances ne changent pas.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
ENV NG_CLI_ANALYTICS=false
RUN npm run build

# --- Exécution ---
# nginx non root, écoute sur 8080.
FROM nginxinc/nginx-unprivileged:1.30-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 8080
