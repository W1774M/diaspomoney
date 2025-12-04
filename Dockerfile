###############################
# STAGE 1: Builder
###############################
FROM node:20-alpine AS builder

# Build arguments (shared across all envs)
ARG ENV=dev
ARG NODE_ENV=development
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_API_URL=http://localhost:3000/api
ARG USE_LOCAL_BUILD=false

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml ./

# Initialize pnpm
RUN corepack enable && \
    corepack prepare pnpm@8.6.12 --activate && \
    pnpm install --frozen-lockfile

# Copy remaining files
COPY . .

# Set environment variables
ENV NODE_ENV=$NODE_ENV \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_TELEMETRY_DISABLED=1 \
    ENV=$ENV

# Build the application (unless using local build)
RUN if [ "$USE_LOCAL_BUILD" != "true" ]; then \
      pnpm run build; \
    fi

###############################
# STAGE 2: Runner
###############################
FROM node:20-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache libc6-compat

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 nextjs -G nodejs

# Install pnpm
RUN corepack enable && \
    corepack prepare pnpm@8.6.12 --activate

# Set working directory
WORKDIR /app

# Copy production dependencies
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
RUN corepack enable && \
    corepack prepare pnpm@8.6.12 --activate && \
    pnpm install --force --ignore-scripts

# Copy built assets from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

# Runtime environment
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1 \
    ENV=$ENV

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Expose port and run
EXPOSE 3000
CMD ["node", "server.js"]
