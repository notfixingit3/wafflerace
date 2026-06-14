# Stage 1: Build
FROM golang:1.22-alpine AS build

WORKDIR /app

# Install git for module dependencies if needed
RUN apk --no-cache add git

# Cache module downloads
COPY go.mod go.sum ./
RUN go mod download

# Build the binary
COPY . .
RUN go build -o server ./cmd

# Stage 2: Runtime
FROM alpine:latest

WORKDIR /app

# CA certificates for HTTPS calls
RUN apk --no-cache add ca-certificates

COPY --from=build /app/server /app/server

EXPOSE 8080

CMD ["/app/server"]