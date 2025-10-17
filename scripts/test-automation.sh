#!/bin/bash
set -e

echo "🧪 Running DiaspoMoney Test Automation..."

# Configuration
TEST_ENV="test"
MONGODB_URI="mongodb://localhost:27017/diaspomoney_test"
REDIS_URL="redis://localhost:6379"
NODE_ENV="test"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to run tests with timeout
run_test_with_timeout() {
    local test_name="$1"
    local test_command="$2"
    local timeout_seconds="$3"
    
    print_status "Running $test_name..."
    
    if timeout $timeout_seconds bash -c "$test_command"; then
        print_status "✅ $test_name passed"
        return 0
    else
        print_error "❌ $test_name failed"
        return 1
    fi
}

# Function to check service health
check_service_health() {
    local service_name="$1"
    local health_url="$2"
    local max_attempts=30
    local attempt=1
    
    print_status "Checking $service_name health..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$health_url" > /dev/null 2>&1; then
            print_status "✅ $service_name is healthy"
            return 0
        fi
        
        print_warning "Attempt $attempt/$max_attempts: $service_name not ready yet..."
        sleep 2
        ((attempt++))
    done
    
    print_error "❌ $service_name health check failed after $max_attempts attempts"
    return 1
}

# Start services for testing
print_status "Starting test services..."

# Start MongoDB
print_status "Starting MongoDB..."
docker run -d --name test-mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:7.0

# Start Redis
print_status "Starting Redis..."
docker run -d --name test-redis \
  -p 6379:6379 \
  redis:7.2-alpine

# Wait for services to be ready
check_service_health "MongoDB" "mongodb://admin:password@localhost:27017/admin"
check_service_health "Redis" "redis://localhost:6379"

# Install dependencies
print_status "Installing dependencies..."
npm ci

# Run linting
print_status "Running ESLint..."
npm run lint

# Run type checking
print_status "Running TypeScript type checking..."
npm run type-check

# Run unit tests
print_status "Running unit tests..."
run_test_with_timeout "Unit Tests" "npm run test:unit" 300

# Run integration tests
print_status "Running integration tests..."
run_test_with_timeout "Integration Tests" "npm run test:integration" 600

# Run API tests
print_status "Running API tests..."
run_test_with_timeout "API Tests" "npm run test:api" 300

# Run security tests
print_status "Running security tests..."
run_test_with_timeout "Security Tests" "npm run test:security" 300

# Run performance tests
print_status "Running performance tests..."
run_test_with_timeout "Performance Tests" "npm run test:performance" 600

# Run load tests
print_status "Running load tests..."
run_test_with_timeout "Load Tests" "npm run test:load" 900

# Run end-to-end tests
print_status "Running end-to-end tests..."
run_test_with_timeout "E2E Tests" "npm run test:e2e" 1200

# Run accessibility tests
print_status "Running accessibility tests..."
run_test_with_timeout "Accessibility Tests" "npm run test:a11y" 300

# Run visual regression tests
print_status "Running visual regression tests..."
run_test_with_timeout "Visual Tests" "npm run test:visual" 600

# Generate test coverage report
print_status "Generating test coverage report..."
npm run test:coverage

# Run mutation testing
print_status "Running mutation testing..."
run_test_with_timeout "Mutation Tests" "npm run test:mutation" 600

# Security audit
print_status "Running security audit..."
npm audit --audit-level=high

# Dependency check
print_status "Checking for vulnerable dependencies..."
npm audit --audit-level=moderate

# License check
print_status "Checking licenses..."
npm run license-check

# Bundle analysis
print_status "Analyzing bundle size..."
npm run analyze

# Lighthouse performance audit
print_status "Running Lighthouse audit..."
npm run lighthouse

# Cleanup
print_status "Cleaning up test services..."
docker stop test-mongodb test-redis
docker rm test-mongodb test-redis

print_status "🎉 All tests completed successfully!"

# Generate test report
print_status "Generating test report..."
npm run test:report

print_status "📊 Test automation completed!"
print_status "Coverage report: coverage/lcov-report/index.html"
print_status "Test results: test-results/"
print_status "Performance report: lighthouse-report.html"
