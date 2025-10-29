# Makefile for CryptoMate Docker operations

.PHONY: help build build-test run run-prod test test-all clean logs shell push pull

# Default target
help:
	@echo "CryptoMate Docker Commands:"
	@echo "  make build         - Build production Docker image"
	@echo "  make build-test    - Build testing Docker image"
	@echo "  make run           - Run development environment"
	@echo "  make run-prod      - Run production environment"
	@echo "  make test          - Run tests in Docker"
	@echo "  make test-all      - Run all tests with quality checks"
	@echo "  make clean         - Clean up Docker resources"
	@echo "  make logs          - Show container logs"
	@echo "  make shell         - Open shell in container"
	@echo "  make push          - Push image to registry"
	@echo "  make pull          - Pull latest image"

# Build production image
build:
	@echo "🔨 Building production image..."
	@docker build -t cryptomate:latest -f Dockerfile --target production .
	@echo "✅ Production image built successfully!"

# Build test image
build-test:
	@echo "🔨 Building test image..."
	@docker build -t cryptomate:test -f Dockerfile.test .
	@echo "✅ Test image built successfully!"

# Run development environment
run:
	@echo "🚀 Starting development environment..."
	@docker-compose up -d cryptomate-dev
	@echo "✅ Development environment is running!"
	@echo "📝 View logs: docker-compose logs -f cryptomate-dev"

# Run production environment
run-prod:
	@echo "🚀 Starting production environment..."
	@docker-compose -f docker-compose.prod.yml up -d
	@echo "✅ Production environment is running!"
	@echo "📝 View logs: docker-compose -f docker-compose.prod.yml logs -f"

# Run tests
test:
	@echo "🧪 Running tests..."
	@docker-compose -f docker-compose.test.yml up --exit-code-from test-runner
	@echo "✅ Tests completed!"

# Run all tests with quality checks
test-all:
	@echo "🧪 Running comprehensive tests..."
	@docker-compose -f docker-compose.test.yml --profile quality --profile security up --exit-code-from test-runner
	@echo "✅ All tests and checks completed!"

# Clean up Docker resources
clean:
	@echo "🧹 Cleaning up Docker resources..."
	@docker-compose down -v --remove-orphans
	@docker-compose -f docker-compose.prod.yml down -v --remove-orphans
	@docker-compose -f docker-compose.test.yml down -v --remove-orphans
	@docker rmi cryptomate:latest cryptomate:test 2>/dev/null || true
	@echo "✅ Cleanup completed!"

# Show logs
logs:
	@docker-compose logs -f --tail=100

# Open shell in container
shell:
	@docker-compose exec cryptomate-dev /bin/sh

# Push image to registry (configure registry first)
push:
	@echo "📤 Pushing image to registry..."
	@docker tag cryptomate:latest ${DOCKER_REGISTRY}/cryptomate:latest
	@docker push ${DOCKER_REGISTRY}/cryptomate:latest
	@echo "✅ Image pushed successfully!"

# Pull latest image
pull:
	@echo "📥 Pulling latest image..."
	@docker pull ${DOCKER_REGISTRY}/cryptomate:latest
	@docker tag ${DOCKER_REGISTRY}/cryptomate:latest cryptomate:latest
	@echo "✅ Image pulled successfully!"

# Development shortcuts
dev: run logs
prod: run-prod
stop:
	@docker-compose down
	@docker-compose -f docker-compose.prod.yml down

# CI/CD targets
ci-test:
	@docker-compose -f docker-compose.test.yml up --build --exit-code-from test-runner

ci-build:
	@docker build --cache-from cryptomate:latest -t cryptomate:${VERSION:-latest} -f Dockerfile --target production .

# Docker image size analysis
size:
	@docker images cryptomate --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
	@echo ""
	@echo "📊 Layer analysis:"
	@docker history cryptomate:latest --human --format "table {{.CreatedBy}}\t{{.Size}}"