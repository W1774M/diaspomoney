### racine 

root@ubuntu:~/Lab/diaspomoney# ll
total 356
drwxr-xr-x  21 root root   4096 Aug 25 00:08 ./
drwxr-xr-x   4 root root   4096 Jun  8 09:17 ../
-rw-r--r--   1 root root     87 Jul 22 17:34 .dockerignore
-rw-r--r--   1 root root    906 Aug 24 13:58 .env
-rw-r--r--   1 root root      0 Jul 11 19:28 .env.local
drwxr-xr-x   8 root root   4096 Aug 25 00:03 .git/
-rw-r--r--   1 root root    493 Aug 24 12:47 .gitignore
drwxr-xr-x   7 root root   4096 Jul 22 18:33 .next/
-rw-r--r--   1 root root   1045 Jul 22 17:34 Dockerfile
-rw-r--r--   1 root root   5740 Jul 11 19:26 README-DATABASE.md
-rw-r--r--   1 root root   9661 Jul 11 19:26 README.md
drwxr-xr-x  11 root root   4096 Jul 11 19:26 app/
drwxr-xr-x   6 root root   4096 Jul 11 19:26 components/
drwxr-xr-x   3 root root   4096 Jul 11 19:26 config/
drwxr-xr-x   7 root root   4096 Aug 25 00:41 docker/
drwxr-xr-x   2 root root   4096 Jul 11 19:26 docs/
-rw-r--r--   1 root root    513 Aug 23 08:48 eslint.config.mjs
drwxr-xr-x   4 root root   4096 Jul 11 19:26 hooks/
drwxr-xr-x   3 root root   4096 Aug 23 08:29 lib/
drwxr-xr-x   2 root root   4096 Jul 11 19:26 middleware/
-rw-r--r--   1 root root   1533 Jul 11 19:26 middleware.ts
drwxr-xr-x   2 root root   4096 Aug 23 08:29 models/
-rw-r--r--   1 root root    211 Jul 22 18:33 next-env.d.ts
-rw-r--r--   1 root root    133 Jun  8 09:17 next.config.ts
drwxr-xr-x 282 root root  12288 Jul 22 18:33 node_modules/
-rw-r--r--   1 root root   2307 Jul 11 19:26 package.json
-rw-r--r--   1 root root 195912 Jul 11 19:26 pnpm-lock.yaml
-rw-r--r--   1 root root     92 Jul 11 19:26 postcss.config.mjs
drwxr-xr-x   3 root root   4096 Jun  8 09:17 public/
drwxr-xr-x   2 root root   4096 Aug 23 08:36 scripts/
drwxr-xr-x   3 root root   4096 Jul 11 19:26 services/
drwxr-xr-x   2 root root   4096 Jul 11 19:26 store/
drwxr-xr-x   3 root root   4096 Jul 11 19:26 styles/
-rw-r--r--   1 root root   1523 Jul 11 19:26 tailwind.config.mjs
drwxr-xr-x   2 root root   4096 Jul 11 19:26 template/
drwxr-xr-x   5 root root   4096 Jul 11 19:26 test/
-rw-r--r--   1 root root    852 Jul 11 19:26 tsconfig.json
-rw-r--r--   1 root root    347 Jul 11 19:26 vitest.config.ts

### docker-compose.prod.yaml
root@ubuntu:~/Lab/diaspomoney/docker# cat docker-compose.prod.yml
include:
  - compose.monitoring.yaml

networks:
  traefik:
    external: true         # réseau partagé pour l'edge
  diaspomoney:
    driver: bridge         # réseau interne app <-> mongodb

volumes:
  traefik_letsencrypt: {}
  traefik_logs: {}
  mongodb_data: {}

services:
  traefik:
    image: traefik:v3.1
    container_name: traefik
    restart: unless-stopped
    networks:
      - traefik
      - diaspomoney
    ports:
      - "80:80"
      - "443:443"
    command:
      - --configFile=/traefik/traefik.yml
      - --certificatesresolvers.le.acme.email=${LETSENCRYPT_EMAIL}
    environment:
      - LETSENCRYPT_EMAIL=${LETSENCRYPT_EMAIL}
    volumes:
      - ./traefik:/traefik:ro
      - ./letsencrypt:/letsencrypt
      - ./traefik/traefik_logs:/var/log/traefik
      - /var/run/docker.sock:/var/run/docker.sock:ro
    secrets:
      - traefik_basicauth
    labels:
      - traefik.enable=true
        # Router vers le dashboard Traefik (api@internal)
      - traefik.http.routers.traefik-dashboard.rule=Host(`dashboard.diaspomoney.fr`)
      - traefik.http.routers.traefik-dashboard.entrypoints=websecure
      - traefik.http.routers.traefik-dashboard.tls=true
      - traefik.http.routers.traefik-dashboard.tls.certresolver=le
      - traefik.http.routers.traefik-dashboard.service=api@internal
        # Middlewares: IP whitelist puis BasicAuth
      - traefik.http.middlewares.dash-auth.basicauth.usersfile=/run/secrets/traefik_basicauth
      - traefik.http.routers.traefik-dashboard.middlewares=dash-auth

  app:
    build:
      context: ../
      dockerfile: Dockerfile
    container_name: app
    restart: unless-stopped
    env_file:
      - ../.env
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - traefik
      - diaspomoney
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3000/ || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 10
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: "512M"
    expose:
      - "3000"
    labels:
      - traefik.enable=true
      - traefik.docker.network=traefik
      - traefik.http.routers.app.rule=Host(`app.diaspomoney.fr`)
      - traefik.http.routers.app.entrypoints=websecure
      - traefik.http.routers.app.tls=true
      - traefik.http.routers.app.tls.certresolver=le
      - traefik.http.services.app.loadbalancer.server.port=3000
      # Sécurité (HSTS); à activer quand le cert est OK
      - traefik.http.middlewares.sec.headers.stsSeconds=31536000
      - traefik.http.middlewares.sec.headers.stsIncludeSubdomains=true
      - traefik.http.middlewares.sec.headers.stsPreload=true
      - traefik.http.routers.app.middlewares=sec@docker

  mongodb:
    image: mongo:7.0
    container_name: mongodb
    restart: unless-stopped
    env_file:
      - ../.env
    volumes:
      - mongodb_data:/data/db
      # - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro  # si tu as un init script
    networks:
      - diaspomoney
    healthcheck:
      test: ["CMD-SHELL", "mongosh --username $$MONGO_INITDB_ROOT_USERNAME --password $$MONGO_INITDB_ROOT_PASSWORD --eval 'db.adminCommand({ ping: 1 })' --authenticationDatabase admin --quiet || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 12

secrets:
  traefik_basicauth:
    file: ./secrets/traefik.htpasswd

root@ubuntu:~/Lab/diaspomoney/docker#

### docker-compose.yaml
root@ubuntu:~/Lab/diaspomoney# cat docker/docker-compose.yml
services:
  app:
    build: ../
    container_name: diaspomoney-app
    restart: unless-stopped
    env_file:
      - ../.env
    environment:
      # Utilise le VRAI nom du container MongoDB
      - MONGODB_URI=mongodb://diaspomoney:supersecret@mongodb:27017/diaspomoney?authSource=admin
      - NEXTAUTH_URL=https://app.diaspomoney.fr
      - NODE_ENV=production
    depends_on:
      - mongodb
    networks:
      - diaspomoney
    labels:
      # Configuration Traefik pour l'exposition
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(`app.diaspomoney.fr`)"
      - "traefik.http.routers.app.tls=true"
      - "traefik.http.routers.app.tls.certresolver=letsencrypt"
      - "traefik.docker.network=traefik"

  mongodb:
    env_file:
      - ../.env
    image: mongo:7.0
    container_name: mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_DATABASE: diaspomoney
      MONGO_INITDB_ROOT_USERNAME: diaspomoney
      MONGO_INITDB_ROOT_PASSWORD: supersecret
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - diaspomoney

volumes:
  mongodb_data:

networks:
  diaspomoney:
    driver: bridge
    name: diaspomoney
  traefik:
    external: true
root@ubuntu:~/Lab/diaspomoney#

### compose.monitoring.yaml
root@ubuntu:~/Lab/diaspomoney# cat docker/compose.monitoring.yaml
services:
  prometheus:
    image: prom/prometheus
    container_name: prometheus
    restart: unless-stopped
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--web.external-url=/prometheus"
    networks:
      - diaspomoney
      - traefik
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prom_data:/prometheus
    labels:
      # Enable Traefik for this service, configure router and specify entrypoint
      - "traefik.enable=true"
      - "traefik.http.routers.prometheus.rule=Host(`dashboard.diaspomoney.fr`) && PathPrefix(`/prometheus`)"
      - "traefik.http.routers.prometheus.entrypoints=websecure"

      # Tell Traefik to use the port 9090 to connect to prometheus
      - "traefik.http.services.prometheus.loadbalancer.server.port=9090"

      # Enable TLS for this router & use the 'le' certificates resolver for obtaining SSL certificates
      - "traefik.http.routers.prometheus.tls=true"
      - "traefik.http.routers.prometheus.tls.certresolver=le"

  cadvisor:
    image: gcr.io/cadvisor/cadvisor
    container_name: cadvisor
    privileged: true
    restart: unless-stopped
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:rw
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
    networks:
      - diaspomoney
      - traefik

  loki:
    image: grafana/loki:latest
    container_name: loki
    restart: unless-stopped
    command:
      - "--config.file=/etc/loki/loki-config.yaml"
    networks:
      - diaspomoney
      - traefik
    volumes:
      - ./loki-config.yaml:/etc/loki/loki-config.yaml
      - loki-data:/loki
    labels:
      # Enable Traefik for this service, configure router and specify entrypoint
      - "traefik.enable=true"
      - "traefik.http.routers.loki.rule=Host(`dashboard.diaspomoney.fr`) && PathPrefix(`/loki`)"
      - "traefik.http.routers.loki.entrypoints=websecure"

      # Tell Traefik to use the port 3100 to connect to loki
      - "traefik.http.services.loki.loadbalancer.server.port=3100"

      # Add middleware to strip the prefix
      - "traefik.http.middlewares.loki-strip.stripprefix.prefixes=/loki"
      - "traefik.http.routers.loki.middlewares=loki-strip"

      # Enable TLS for this router & use the 'le' certificates resolver for obtaining SSL certificates
      - "traefik.http.routers.loki.tls=true"
      - "traefik.http.routers.loki.tls.certresolver=le"

  promtail:
    image: grafana/promtail:latest
    container_name: promtail
    restart: unless-stopped
    command:
      - "--config.file=/etc/promtail/config.yaml"
    networks:
      - diaspomoney
      - traefik
    volumes:
      - ./promtail-config.yaml:/etc/promtail/config.yaml
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/log:/var/log:ro

  grafana:
    image: grafana/grafana
    container_name: grafana
    restart: unless-stopped
    environment:
      - "GF_SERVER_DOMAIN=dashboard.diaspomoney.fr"
      - "GF_SERVER_ROOT_URL=%(protocol)s://%(domain)s/grafana"
      - "GF_SERVER_SERVE_FROM_SUB_PATH=true"
    networks:
      - diaspomoney
      - traefik
    volumes:
      - grafana-storage:/var/lib/grafana
    labels:
      # Enable Traefik for this service, configure router and specify entrypoint
      - "traefik.enable=true"
      - "traefik.http.routers.grafana.rule=Host(`dashboard.diaspomoney.fr`) && PathPrefix(`/grafana`)"
      - "traefik.http.routers.grafana.entrypoints=websecure"

      # Tell Traefik to use the port 3000 to connect to grafana
      - "traefik.http.services.grafana.loadbalancer.server.port=3000"

      # Enable TLS for this router & use the 'le' certificates resolver for obtaining SSL certificates
      - "traefik.http.routers.grafana.tls=true"
      - "traefik.http.routers.grafana.tls.certresolver=le"

volumes:
  prom_data:
  loki-data:
  grafana-storage:

root@ubuntu:~/Lab/diaspomoney#

### loki-config.yml 

auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096

common:
  instance_addr: 127.0.0.1
  path_prefix: /tmp/loki
  storage:
    filesystem:
      chunks_directory: /tmp/loki/chunks
      rules_directory: /tmp/loki/rules
  replication_factor: 1
  ring:
    kvstore:
      store: inmemory

query_range:
  results_cache:
    cache:
      embedded_cache:
        enabled: true
        max_size_mb: 100

schema_config:
  configs:
    - from: 2020-10-24
      store: tsdb
      object_store: filesystem
      schema: v13
      index:
        prefix: index_
        period: 24h

ruler:
  alertmanager_url: http://localhost:9093
# By default, Loki will send anonymous, but uniquely-identifiable usage and configuration
# analytics to Grafana Labs. These statistics are sent to https://stats.grafana.org/
#
# Statistics help us better understand how Loki is used, and they show us performance
# levels for most users. This helps us prioritize features and documentation.
# For more information on what's sent, look at
# https://github.com/grafana/loki/blob/main/pkg/analytics/stats.go
# Refer to the buildReport method to see what goes into a report.
#
# If you would like to disable reporting, uncomment the following lines:
#analytics:
#  reporting_enabled: false

### ^rpùptheus.yml
# Global defaults, applies to all scrape jobs unless explicitly overridden
global:
  scrape_interval: 15s
  scrape_timeout: 10s
  evaluation_interval: 15s

# Define the specify endpoints prometheus should scrape data from
scrape_configs:
  # Config to scrape data from the prometheus service itself
  - job_name: "prometheus"
    honor_timestamps: true
    metrics_path: prometheus/metrics
    scheme: http
    static_configs:
      - targets: ["prometheus:9090"]

  # Config to scrape data from the traefik service
  - job_name: "traefik"
    metrics_path: /metrics
    static_configs:
      - targets: ["traefik:8080"]

  # Config to scrape data from the cAdvisor service
  - job_name: "cadvisor"
    static_configs:
      - targets: ["cadvisor:8080"]


### traefik.yml 
root@ubuntu:~/Lab/diaspomoney# cat docker/traefik/traefik.yml
entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

certificatesResolvers:
  le:
    acme:
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web

http:
  routers:
    redirect-to-https:
      rule: "HostRegexp(`{host:.+}`)"
      entryPoints: [web]
      middlewares: [redirect-to-https]
      service: noop@internal

    redirect-www:
      rule: "Host(`app.diaspomoney.fr`)"
      entryPoints: [web, websecure]
      middlewares: [redirect-www]
      service: noop@internal

  middlewares:
    redirect-to-https:
      redirectScheme:
        scheme: https
        permanent: true
    redirect-www:
      redirectRegex:
        regex: "^https?://www\\.(.*)"
        replacement: "https://$1"
        permanent: true

metrics:
  prometheus:
    addEntryPointsLabels: true
    addServicesLabels: true

log:
  level: DEBUG
  format: json
  filePath: /var/log/traefik/traefik.log

accessLog:
  filePath: /var/log/traefik/access.log

api:
  dashboard: true
  insecure: false

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    network: "traefik"
    exposedByDefault: false

root@ubuntu:~/Lab/diaspomoney#