FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-lock.yaml package.json ./

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Serve the built application
FROM node:22-alpine AS serve
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["serve", "-s", ".", "-l", "3000"]