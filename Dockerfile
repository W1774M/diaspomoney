###############################
# STAGE 1: Builder
###############################
FROM node:20-alpine AS builder

# Install system deps
RUN apk add --no-cache python3 make g++ git libc6-compat

WORKDIR /app

# Enable pnpm from package.json
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack install

# Install dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy app files
COPY . .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

###############################
# STAGE 2: Runner
###############################
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Enable pnpm
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack install && pnpm fetch

# Install production deps
RUN pnpm install --prod --offline --ignore-scripts

# Copy build output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

CMD ["pnpm", "start"]
