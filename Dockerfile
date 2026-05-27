# === Templ + Go Build Stage (CSS built here for reliable scanning) ===
FROM golang:1.25-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git ca-certificates tzdata

# Install Node/Bun for Tailwind build + templ
RUN apk add --no-cache nodejs npm
RUN npm install -g bun

# Install templ
RUN go install github.com/a-h/templ/cmd/templ@latest

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build CSS after full source is available (so Tailwind can scan .templ files)
RUN bun install --frozen-lockfile
RUN bun run build:css

# Generate templ files
RUN templ generate

# Build binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /wafflerace ./cmd/server

# === Runtime ===
FROM alpine:3.21

WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata

COPY --from=builder /wafflerace /app/wafflerace
COPY --from=builder /app/web /app/web
COPY --from=builder /app/assets /app/assets

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 9090
ENTRYPOINT ["/app/wafflerace"]
