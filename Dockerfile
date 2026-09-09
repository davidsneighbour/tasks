FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# The base image already ships a "node" user at uid/gid 1000, matching the default first-user
# uid/gid on most single-user Linux hosts, so it can write to the bind-mounted ./data directory
# without loosening its permissions. If your host user has a different uid/gid, run
# `usermod`/`groupmod` on "node" in a derived image, or `chown` ./data to match.

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY drizzle.config.ts ./

RUN mkdir -p /app/data && chown -R node:node /app
USER node

ENV NODE_OPTIONS=--experimental-sqlite

EXPOSE 3000
CMD ["sh", "-c", "node dist/server/db/migrate.js && node dist/server/server.js"]
