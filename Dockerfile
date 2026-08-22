FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.3 --activate
WORKDIR /app

FROM base AS builder
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm prisma generate
ENV DATABASE_URL="file:./build-placeholder.db"
ENV SPOTIFY_CLIENT_ID="build-placeholder"
ENV SPOTIFY_CLIENT_SECRET="build-placeholder"
ENV GENIUS_ACCESS_TOKEN="build-placeholder"
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
# The rickroll fallback game reads these three files straight off disk at
# request time (src/app/api/games/[date]/route.ts), so they have to ship even
# though the rest of src/ (and the other test fixtures) don't.
COPY --from=builder /app/src/app/api/lib/test/fixtures/data/spotify/tracks/NEVER_GONNA_GIVE_YOU_UP.json ./src/app/api/lib/test/fixtures/data/spotify/tracks/NEVER_GONNA_GIVE_YOU_UP.json
COPY --from=builder /app/src/app/api/lib/test/fixtures/data/genius/lyrics/NEVER_GONNA_GIVE_YOU_UP.txt ./src/app/api/lib/test/fixtures/data/genius/lyrics/NEVER_GONNA_GIVE_YOU_UP.txt
COPY --from=builder /app/src/app/api/lib/test/fixtures/data/genius/search/NEVER_GONNA_GIVE_YOU_UP.json ./src/app/api/lib/test/fixtures/data/genius/search/NEVER_GONNA_GIVE_YOU_UP.json
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["pnpm", "start"]
