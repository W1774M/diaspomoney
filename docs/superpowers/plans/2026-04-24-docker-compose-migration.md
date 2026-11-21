# Docker Compose Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Kubernetes/K3s deployment with Docker Compose stacks for global infra and DiaspoMoney runtime.

**Architecture:** Use two Compose stacks: a global infra stack with external Traefik and Portainer, and an app stack with DiaspoMoney `dev`, `rct`, `prod`, shared MongoDB, shared Redis, and Mongo Express. The app stack joins an external `traefik` Docker network but does not own Traefik.

**Tech Stack:** Docker Compose v2, Traefik labels, Portainer CE, MongoDB 7, Redis 7, Next.js 16, pnpm.

---

## File Structure

- Create `compose.infra.yml`: global server stack for Traefik, Portainer, shared `traefik` network, and persistent infra volumes.
- Replace `docker-compose.yml`: DiaspoMoney runtime stack with `app-dev`, `app-rct`, `app-prod`, shared `mongodb`, shared `redis`, and `mongo-express`.
- Keep `compose.monitoring.yml`: update only if network names need to point to external `traefik` and app network.
- Create `.env.example`: non-secret template for Compose runtime variables.
- Create `scripts/deploy-compose.sh`: build and restart one app service or all app services with Docker Compose.
- Modify `package.json`: replace deploy scripts with Compose scripts.
- Modify `docker/README.md`: document the new two-stack setup.
- Modify `README.md` or root deployment docs if they reference Kubernetes.
- Delete `k8s/`: remove all Kubernetes manifests and K8s-specific docs.
- Delete `scripts/deploy-jenkins.sh`: Jenkins is out of scope.
- Replace or delete Kubernetes-only Stripe maintenance scripts: `scripts/check-stripe-secrets.sh` and `scripts/fix-stripe-secrets.sh`.
- Review `scripts/fix-booking-payment-status.sh`: remove Kubernetes NodePort detection and prefer Compose service names or `.env` Mongo URL.
- Review `.circleci/config.yml`, `.circleci/README.md`, `Jenkinsfile`, `jenkins/README.md`, and `jenkins/INSTALL.md`: remove Kubernetes deployment paths or mark Jenkins/CircleCI deployment as retired.

---

### Task 1: Add Global Infra Compose Stack

**Files:**
- Create: `compose.infra.yml`
- Create/Modify: `.env.example`

- [ ] **Step 1: Create `compose.infra.yml`**

Add this stack for Traefik and Portainer:

```yaml
services:
  traefik:
    image: traefik:v3.2
    container_name: diaspomoney-traefik
    restart: unless-stopped
    command:
      - --api.dashboard=true
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.le.acme.email=${TRAEFIK_ACME_EMAIL}
      - --certificatesresolvers.le.acme.storage=/letsencrypt/acme.json
      - --certificatesresolvers.le.acme.httpchallenge=true
      - --certificatesresolvers.le.acme.httpchallenge.entrypoint=web
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik_letsencrypt:/letsencrypt
    networks:
      - traefik
    labels:
      - traefik.enable=true
      - traefik.http.routers.traefik.rule=Host(`${TRAEFIK_DASHBOARD_DOMAIN}`)
      - traefik.http.routers.traefik.entrypoints=websecure
      - traefik.http.routers.traefik.tls=true
      - traefik.http.routers.traefik.tls.certresolver=le
      - traefik.http.routers.traefik.service=api@internal
      - traefik.http.routers.traefik.middlewares=traefik-auth
      - traefik.http.middlewares.traefik-auth.basicauth.users=${TRAEFIK_DASHBOARD_AUTH}

  portainer:
    image: portainer/portainer-ce:latest
    container_name: diaspomoney-portainer
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
    networks:
      - traefik
    labels:
      - traefik.enable=true
      - traefik.http.routers.portainer.rule=Host(`${PORTAINER_DOMAIN}`)
      - traefik.http.routers.portainer.entrypoints=websecure
      - traefik.http.routers.portainer.tls=true
      - traefik.http.routers.portainer.tls.certresolver=le
      - traefik.http.services.portainer.loadbalancer.server.port=9000

networks:
  traefik:
    name: traefik

volumes:
  traefik_letsencrypt:
  portainer_data:
```

- [ ] **Step 2: Add infra variables to `.env.example`**

Add these non-secret placeholders:

```dotenv
TRAEFIK_ACME_EMAIL=admin@example.com
TRAEFIK_DASHBOARD_DOMAIN=dashboard.example.com
TRAEFIK_DASHBOARD_AUTH=admin:CHANGE_ME_HTPASSWD_HASH
PORTAINER_DOMAIN=portainer.example.com
```

- [ ] **Step 3: Validate infra compose**

Run:

```bash
docker compose -f compose.infra.yml --env-file .env.example config
```

Expected: the command prints normalized Compose config and exits with code `0`.

- [ ] **Step 4: Commit infra stack**

```bash
git add compose.infra.yml .env.example
git commit -m "Add Docker Compose infra stack"
```

---

### Task 2: Replace App Compose Runtime

**Files:**
- Modify: `docker-compose.yml`
- Modify: `.env.example`

- [ ] **Step 1: Replace `docker-compose.yml` with runtime services**

Use this structure:

```yaml
services:
  mongodb:
    image: mongo:7
    container_name: diaspomoney-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_INITDB_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_INITDB_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: diaspomoney
    volumes:
      - mongodb_data:/data/db
      - ./docker/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - app
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "mongodb://127.0.0.1:27017/admin", "--eval", "db.adminCommand({ ping: 1 }).ok"]
      interval: 10s
      timeout: 5s
      retries: 12

  redis:
    image: redis:7.2-alpine
    container_name: diaspomoney-redis
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes", "--requirepass", "${REDIS_PASSWORD}"]
    volumes:
      - redis_data:/data
    networks:
      - app
    healthcheck:
      test: ["CMD-SHELL", "redis-cli -a \"$${REDIS_PASSWORD}\" ping | grep PONG"]
      interval: 10s
      timeout: 5s
      retries: 12
    environment:
      REDIS_PASSWORD: ${REDIS_PASSWORD}

  app-dev:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXTAUTH_URL: https://dev.diaspomoney.fr
        APP_URL: https://dev.diaspomoney.fr
        API_URL: https://dev.diaspomoney.fr/api
        NEXT_PUBLIC_APP_URL: https://dev.diaspomoney.fr
        NEXT_PUBLIC_API_URL: https://dev.diaspomoney.fr/api
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
    image: diaspomoney:dev
    container_name: diaspomoney-app-dev
    restart: unless-stopped
    env_file:
      - .env
    environment:
      NODE_ENV: production
      PORT: 3000
      HOSTNAME: 0.0.0.0
      NEXTAUTH_URL: https://dev.diaspomoney.fr
      NEXT_PUBLIC_APP_URL: https://dev.diaspomoney.fr
      NEXT_PUBLIC_API_URL: https://dev.diaspomoney.fr/api
      MONGODB_URI: mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@mongodb:27017/diaspomoney_dev?authSource=admin
      MONGO_URL: mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@mongodb:27017/diaspomoney_dev?authSource=admin
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
    depends_on:
      mongodb:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - app
      - traefik
    labels:
      - traefik.enable=true
      - traefik.docker.network=traefik
      - traefik.http.routers.diaspomoney-dev.rule=Host(`dev.diaspomoney.fr`)
      - traefik.http.routers.diaspomoney-dev.entrypoints=websecure
      - traefik.http.routers.diaspomoney-dev.tls=true
      - traefik.http.routers.diaspomoney-dev.tls.certresolver=le
      - traefik.http.services.diaspomoney-dev.loadbalancer.server.port=3000

  app-rct:
    extends:
      service: app-dev
    image: diaspomoney:rct
    container_name: diaspomoney-app-rct
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXTAUTH_URL: https://rct.diaspomoney.fr
        APP_URL: https://rct.diaspomoney.fr
        API_URL: https://rct.diaspomoney.fr/api
        NEXT_PUBLIC_APP_URL: https://rct.diaspomoney.fr
        NEXT_PUBLIC_API_URL: https://rct.diaspomoney.fr/api
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
    environment:
      NODE_ENV: production
      PORT: 3000
      HOSTNAME: 0.0.0.0
      NEXTAUTH_URL: https://rct.diaspomoney.fr
      NEXT_PUBLIC_APP_URL: https://rct.diaspomoney.fr
      NEXT_PUBLIC_API_URL: https://rct.diaspomoney.fr/api
      MONGODB_URI: mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@mongodb:27017/diaspomoney_rct?authSource=admin
      MONGO_URL: mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@mongodb:27017/diaspomoney_rct?authSource=admin
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/1
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
    labels:
      - traefik.enable=true
      - traefik.docker.network=traefik
      - traefik.http.routers.diaspomoney-rct.rule=Host(`rct.diaspomoney.fr`)
      - traefik.http.routers.diaspomoney-rct.entrypoints=websecure
      - traefik.http.routers.diaspomoney-rct.tls=true
      - traefik.http.routers.diaspomoney-rct.tls.certresolver=le
      - traefik.http.services.diaspomoney-rct.loadbalancer.server.port=3000

  app-prod:
    extends:
      service: app-dev
    image: diaspomoney:prod
    container_name: diaspomoney-app-prod
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXTAUTH_URL: https://diaspomoney.fr
        APP_URL: https://diaspomoney.fr
        API_URL: https://diaspomoney.fr/api
        NEXT_PUBLIC_APP_URL: https://diaspomoney.fr
        NEXT_PUBLIC_API_URL: https://diaspomoney.fr/api
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_PROD}
    environment:
      NODE_ENV: production
      PORT: 3000
      HOSTNAME: 0.0.0.0
      NEXTAUTH_URL: https://diaspomoney.fr
      NEXT_PUBLIC_APP_URL: https://diaspomoney.fr
      NEXT_PUBLIC_API_URL: https://diaspomoney.fr/api
      MONGODB_URI: mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@mongodb:27017/diaspomoney?authSource=admin
      MONGO_URL: mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@mongodb:27017/diaspomoney?authSource=admin
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/2
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY_PROD}
      STRIPE_SECRET_KEY_PROD: ${STRIPE_SECRET_KEY_PROD}
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_PROD: ${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_PROD}
      STRIPE_WEBHOOK_SECRET_PROD: ${STRIPE_WEBHOOK_SECRET_PROD}
    labels:
      - traefik.enable=true
      - traefik.docker.network=traefik
      - traefik.http.routers.diaspomoney-prod.rule=Host(`diaspomoney.fr`)
      - traefik.http.routers.diaspomoney-prod.entrypoints=websecure
      - traefik.http.routers.diaspomoney-prod.tls=true
      - traefik.http.routers.diaspomoney-prod.tls.certresolver=le
      - traefik.http.services.diaspomoney-prod.loadbalancer.server.port=3000

  mongo-express:
    image: mongo-express:latest
    container_name: diaspomoney-mongo-express
    restart: unless-stopped
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: ${MONGO_INITDB_ROOT_USERNAME}
      ME_CONFIG_MONGODB_ADMINPASSWORD: ${MONGO_INITDB_ROOT_PASSWORD}
      ME_CONFIG_MONGODB_URL: mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@mongodb:27017/?authSource=admin
      ME_CONFIG_BASICAUTH_USERNAME: ${MONGO_EXPRESS_USERNAME}
      ME_CONFIG_BASICAUTH_PASSWORD: ${MONGO_EXPRESS_PASSWORD}
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - app
      - traefik
    labels:
      - traefik.enable=true
      - traefik.docker.network=traefik
      - traefik.http.routers.mongo-express.rule=Host(`${MONGO_EXPRESS_DOMAIN}`)
      - traefik.http.routers.mongo-express.entrypoints=websecure
      - traefik.http.routers.mongo-express.tls=true
      - traefik.http.routers.mongo-express.tls.certresolver=le
      - traefik.http.services.mongo-express.loadbalancer.server.port=8081

networks:
  app:
    name: diaspomoney-app
  traefik:
    external: true
    name: traefik

volumes:
  mongodb_data:
  redis_data:
```

- [ ] **Step 2: Add app variables to `.env.example`**

Append:

```dotenv
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=CHANGE_ME
REDIS_PASSWORD=CHANGE_ME
MONGO_EXPRESS_DOMAIN=mongo.example.com
MONGO_EXPRESS_USERNAME=admin
MONGO_EXPRESS_PASSWORD=CHANGE_ME

JWT_SECRET=CHANGE_ME
JWT_REFRESH_SECRET=CHANGE_ME
NEXTAUTH_SECRET=CHANGE_ME
AUTH_SECRET=CHANGE_ME
ENCRYPTION_MASTER_KEY=CHANGE_ME
ENCRYPTION_KEY=CHANGE_ME
SESSION_SECRET=CHANGE_ME

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_REPLY_TO=

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_SECRET_KEY_PROD=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_PROD=
STRIPE_WEBHOOK_SECRET_PROD=

SENTRY_DSN=
```

- [ ] **Step 3: Validate app compose**

Run:

```bash
docker compose --env-file .env.example config
```

Expected: normalized Compose config exits with code `0`. If Compose rejects `extends` with local service overrides, replace `extends` with an anchor-based YAML structure in the same file.

- [ ] **Step 4: Commit app stack**

```bash
git add docker-compose.yml .env.example
git commit -m "Replace Kubernetes runtime with Docker Compose"
```

---

### Task 3: Add Compose Deployment Script

**Files:**
- Replace: `scripts/deploy.sh`
- Create: `scripts/deploy-compose.sh`
- Modify: `package.json`

- [ ] **Step 1: Create `scripts/deploy-compose.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-}"
NO_CACHE="${2:-}"

case "$ENVIRONMENT" in
  dev|rct|prod)
    SERVICE="app-${ENVIRONMENT}"
    ;;
  all)
    SERVICE=""
    ;;
  *)
    echo "Usage: $0 <dev|rct|prod|all> [--no-cache]" >&2
    exit 1
    ;;
esac

BUILD_ARGS=()
if [[ "$NO_CACHE" == "--no-cache" || "$NO_CACHE" == "no-cache" ]]; then
  BUILD_ARGS+=(--no-cache)
fi

docker compose config >/dev/null

if [[ -n "$SERVICE" ]]; then
  docker compose build "${BUILD_ARGS[@]}" "$SERVICE"
  docker compose up -d --no-deps "$SERVICE"
  docker compose ps "$SERVICE"
else
  docker compose build "${BUILD_ARGS[@]}" app-dev app-rct app-prod
  docker compose up -d
  docker compose ps
fi
```

- [ ] **Step 2: Replace `scripts/deploy.sh`**

Either delete `scripts/deploy.sh` or turn it into a compatibility wrapper:

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "${SCRIPT_DIR}/deploy-compose.sh" "$@"
```

- [ ] **Step 3: Update `package.json` scripts**

Change deploy scripts to:

```json
{
  "deploy:dev": "./scripts/deploy-compose.sh dev",
  "deploy:rct": "./scripts/deploy-compose.sh rct",
  "deploy:prod": "./scripts/deploy-compose.sh prod",
  "deploy:all": "./scripts/deploy-compose.sh all",
  "infra:up": "docker compose -f compose.infra.yml up -d",
  "infra:down": "docker compose -f compose.infra.yml down",
  "compose:config": "docker compose config",
  "compose:up": "docker compose up -d",
  "compose:down": "docker compose down"
}
```

Preserve unrelated scripts already present in `package.json`.

- [ ] **Step 4: Make script executable and validate**

Run:

```bash
chmod +x scripts/deploy-compose.sh scripts/deploy.sh
pnpm run compose:config
```

Expected: Compose config validation exits with code `0`.

- [ ] **Step 5: Commit deployment scripts**

```bash
git add package.json scripts/deploy.sh scripts/deploy-compose.sh
git commit -m "Add Compose deployment commands"
```

---

### Task 4: Remove Kubernetes and Jenkins Artifacts

**Files:**
- Delete: `k8s/`
- Delete: `scripts/deploy-jenkins.sh`
- Modify/Delete: `Jenkinsfile`
- Modify/Delete: `jenkins/README.md`
- Modify/Delete: `jenkins/INSTALL.md`
- Modify: `.circleci/config.yml`
- Modify: `.circleci/README.md`

- [ ] **Step 1: Remove Kubernetes manifests**

Run:

```bash
rm -rf k8s
```

- [ ] **Step 2: Remove Jenkins Kubernetes deploy script**

Run:

```bash
rm -f scripts/deploy-jenkins.sh
```

- [ ] **Step 3: Retire Jenkins deployment docs**

If Jenkins is no longer used, delete `Jenkinsfile` and the `jenkins/` docs:

```bash
rm -f Jenkinsfile
rm -rf jenkins
```

If Jenkins may still be used only outside the repo, replace those docs with a short note saying deployment is now managed through Portainer/Compose.

- [ ] **Step 4: Retire CircleCI Kubernetes deployment**

In `.circleci/config.yml`, remove jobs and workflow steps that install `kubectl`, decode kubeconfigs, or run `scripts/deploy.sh` against Kubernetes. Keep test/build jobs if they are still used.

In `.circleci/README.md`, replace Kubernetes setup instructions with either:

```markdown
# CircleCI

CircleCI is currently used for tests/build checks only. Runtime deployment is managed on the server with Docker Compose and Portainer.
```

or delete the file if CircleCI is not used.

- [ ] **Step 5: Check for Kubernetes references**

Run:

```bash
rg "k8s|kubectl|Kubernetes|K3s|namespace|rollout" .
```

Expected: no deployment instructions still tell the operator to use Kubernetes. Historical mentions in the new migration spec/plan are acceptable.

- [ ] **Step 6: Commit removal**

```bash
git add -A
git commit -m "Remove Kubernetes deployment artifacts"
```

---

### Task 5: Update Maintenance Scripts

**Files:**
- Modify/Delete: `scripts/check-stripe-secrets.sh`
- Modify/Delete: `scripts/fix-stripe-secrets.sh`
- Modify: `scripts/fix-booking-payment-status.sh`
- Modify: `docs/stripe-browser-errors.md`

- [ ] **Step 1: Replace Stripe secret checks with `.env` checks**

Replace `scripts/check-stripe-secrets.sh` with a script that validates local environment variables:

```bash
#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-prod}"
ENV_FILE="${ENV_FILE:-.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

load_var() {
  local name="$1"
  grep -E "^${name}=" "$ENV_FILE" | tail -1 | cut -d '=' -f2- | tr -d '"' | tr -d "'"
}

if [[ "$ENVIRONMENT" == "prod" ]]; then
  SECRET="$(load_var STRIPE_SECRET_KEY_PROD)"
  PUBLIC="$(load_var NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_PROD)"
else
  SECRET="$(load_var STRIPE_SECRET_KEY)"
  PUBLIC="$(load_var NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)"
fi

[[ -n "$SECRET" ]] || { echo "Missing Stripe secret key for $ENVIRONMENT" >&2; exit 1; }
[[ -n "$PUBLIC" ]] || { echo "Missing Stripe publishable key for $ENVIRONMENT" >&2; exit 1; }

echo "Stripe config present for $ENVIRONMENT"
```

- [ ] **Step 2: Remove automatic Kubernetes patch script**

Delete `scripts/fix-stripe-secrets.sh` or replace it with a message:

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "Stripe secrets are now managed in the server .env file used by Docker Compose."
echo "Edit .env, then run: ./scripts/deploy-compose.sh <dev|rct|prod>"
```

- [ ] **Step 3: Update booking payment status script**

In `scripts/fix-booking-payment-status.sh`, remove Kubernetes NodePort detection and make `MONGODB_URI` or `MONGO_URL` the source of truth. If no URL exists, use:

```bash
mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@localhost:27017/diaspomoney?authSource=admin
```

Only use `localhost` if the operator has published MongoDB locally; otherwise document running the script inside the app container:

```bash
docker compose exec app-prod node scripts/fix-booking-payment-status.js
```

- [ ] **Step 4: Update Stripe troubleshooting docs**

In `docs/stripe-browser-errors.md`, replace `kubectl logs` examples with:

```bash
docker compose logs --tail=100 app-prod | rg -i "stripe|payment|error"
docker compose exec app-prod env | rg "^STRIPE_"
```

- [ ] **Step 5: Commit maintenance updates**

```bash
git add scripts/check-stripe-secrets.sh scripts/fix-stripe-secrets.sh scripts/fix-booking-payment-status.sh docs/stripe-browser-errors.md
git commit -m "Update maintenance scripts for Docker Compose"
```

---

### Task 6: Update Docker Documentation

**Files:**
- Modify: `docker/README.md`
- Modify/Create: `README.md`
- Modify: `compose.monitoring.yml`

- [ ] **Step 1: Rewrite `docker/README.md` around two stacks**

Document:

```markdown
# Docker Compose Deployment

## Stacks

- `compose.infra.yml`: Traefik and Portainer for the whole server.
- `docker-compose.yml`: DiaspoMoney app services.
- `compose.monitoring.yml`: optional monitoring stack.

## First Start

1. Copy `.env.example` to `.env` and fill real secrets on the server.
2. Start infra: `docker compose -f compose.infra.yml up -d`.
3. Start DiaspoMoney: `docker compose up -d --build`.
4. Open Portainer at the configured `PORTAINER_DOMAIN`.

## Deploy One Environment

Run `./scripts/deploy-compose.sh prod`.
```

- [ ] **Step 2: Update root README deployment section**

If `README.md` exists and mentions deployment, point it to `docker/README.md` and remove Kubernetes commands.

- [ ] **Step 3: Align monitoring compose networks**

If `compose.monitoring.yml` should stay exposed through Traefik, ensure it uses:

```yaml
networks:
  traefik:
    external: true
    name: traefik
```

If Prometheus needs to scrape app services, also attach it to `diaspomoney-app`.

- [ ] **Step 4: Commit docs**

```bash
git add docker/README.md README.md compose.monitoring.yml
git commit -m "Document Docker Compose deployment"
```

---

### Task 7: Verify End-to-End

**Files:**
- No source files expected.

- [ ] **Step 1: Validate all Compose files**

Run:

```bash
docker compose -f compose.infra.yml --env-file .env.example config
docker compose --env-file .env.example config
docker compose -f compose.monitoring.yml --env-file .env.example config
```

Expected: all commands exit with code `0`.

- [ ] **Step 2: Build application images**

Run:

```bash
docker compose --env-file .env.example build app-dev app-rct app-prod
```

Expected: all three images build successfully.

- [ ] **Step 3: Run unit/static checks**

Run:

```bash
pnpm lint
pnpm tsc:check
pnpm test:unit
```

Expected: commands pass or only report pre-existing unrelated failures.

- [ ] **Step 4: Start stack on a Docker host**

Run:

```bash
docker compose -f compose.infra.yml up -d
docker compose up -d
docker compose ps
```

Expected: Traefik, Portainer, MongoDB, Redis, three app containers, and Mongo Express are running or healthy.

- [ ] **Step 5: Verify routing**

Run from a machine that resolves the target domains:

```bash
curl -I https://dev.diaspomoney.fr
curl -I https://rct.diaspomoney.fr
curl -I https://diaspomoney.fr
curl -I https://$MONGO_EXPRESS_DOMAIN
curl -I https://$PORTAINER_DOMAIN
```

Expected: each endpoint returns an HTTP response through Traefik.

- [ ] **Step 6: Final Kubernetes reference scan**

Run:

```bash
rg "k8s|kubectl|Kubernetes|K3s" .
```

Expected: only migration docs/plans or archived notes mention Kubernetes.

- [ ] **Step 7: Commit final verification fixes**

If verification required small fixes:

```bash
git add -A
git commit -m "Finalize Docker Compose migration"
```

---

## Self-Review

- Spec coverage: The plan covers the two-stack architecture, external Traefik, Portainer, shared MongoDB/Redis, three app environments, Mongo Express, removal of Kubernetes, Jenkins removal, docs, scripts, and verification.
- Placeholder scan: No implementation step depends on an undefined file or unspecified command. Secret values remain placeholders by design and belong in server-local `.env`.
- Type/config consistency: Service names are `app-dev`, `app-rct`, `app-prod`, `mongodb`, `redis`, and `mongo-express`; the deploy script uses those same service names. The external Traefik network is consistently named `traefik`.

