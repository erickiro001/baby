.PHONY: dev build run clean

# Start with hot-reload (requires air)
dev:
	air -c .air.toml

# Build binary
build:
	go build -o ./tmp/server ./cmd/server

# Run directly (no hot-reload)
run:
	go run ./cmd/server

# Clean build artifacts
clean:
	rm -rf ./tmp ./data
