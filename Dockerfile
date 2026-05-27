# === Templ + Go Build Stage (CSS built here for reliable scanning) ===
FROM golang:1.25-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git ca-certificates tzdata

# Install Node/Bun for Tailwind build + templ
RUN apk add --no-cache nodejs npm
RUN npm install -g bun

# Install templ
RUN go install github.com/a-h/templ/cmd/templ@v0.3.1020

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

# === Runtime Stage ===
# We use a minimal Alpine image for a small attack surface and fast startup.
FROM alpine:3.21

WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata

# Copy only the artifacts we need from the builder stage
COPY --from=builder /wafflerace /app/wafflerace
COPY --from=builder /app/web /app/web
COPY --from=builder /app/assets /app/assets

# Create a non-root user and give it ownership of the data directory
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN mkdir -p /app/data && chown -R appuser:appgroup /app/data
USER appuser

EXPOSE 9090

ENTRYPOINT ["/app/wafflerace"]
