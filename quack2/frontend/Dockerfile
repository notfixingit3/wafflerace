# Stage 1: Build
FROM oven/bun:alpine AS build
WORKDIR /app

# Install dependencies (cached layer)
COPY package.json bun.lock ./
RUN bun install

# Build the application
COPY . .
RUN bun run build

# Stage 2: Runtime
FROM oven/bun:alpine AS runtime
WORKDIR /app

# Copy standalone output (includes server.js, .next, node_modules, package.json)
COPY --from=build /app/.next/standalone ./

# Copy static files (not included in standalone output)
COPY --from=build /app/.next/static ./.next/static

EXPOSE 3000

ENV NEXT_PUBLIC_WS_URL=ws://backend:8080/ws

CMD ["bun", "server.js"]
