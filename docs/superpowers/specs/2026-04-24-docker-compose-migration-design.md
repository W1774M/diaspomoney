# Migration Docker Compose Design

## Objectif

Remplacer totalement le déploiement Kubernetes/K3s de DiaspoMoney par une orchestration Docker Compose simple, opérable via Portainer, tout en gardant les environnements `dev`, `rct` et `prod`.

## Décisions Validées

- Retirer Kubernetes du repo, y compris les manifests `k8s/`, les scripts associés et la documentation centrée sur `kubectl`.
- Garder trois applications séparées : `dev.diaspomoney.fr`, `rct.diaspomoney.fr` et `diaspomoney.fr`.
- Utiliser une seule instance MongoDB partagée avec trois bases distinctes : `diaspomoney_dev`, `diaspomoney_rct` et `diaspomoney`.
- Utiliser une seule instance Redis partagée. Les environnements seront séparés par configuration applicative, au minimum via des variables dédiées et, si supporté par le code, par base Redis ou préfixe.
- Garder `mongo-express` pour l'administration MongoDB.
- Sortir Jenkins du périmètre du repo.
- Garder Traefik à l'extérieur de la stack applicative pour qu'il puisse router d'autres applications du serveur.
- Ajouter Portainer dans une stack infra globale aux côtés de Traefik.

## Architecture Cible

Deux stacks Compose seront utilisées.

La stack infra globale fournit les services communs du serveur :

- `traefik`, point d'entrée HTTP/HTTPS partagé, avec Let's Encrypt.
- `portainer`, interface d'administration Docker/Compose.
- un réseau Docker externe partagé, nommé `traefik`.
- des volumes persistants pour les certificats Traefik et les données Portainer.

La stack applicative DiaspoMoney contient :

- `app-dev`, `app-rct` et `app-prod`, chacun construit depuis le `Dockerfile` existant.
- `mongodb`, instance partagée avec volume persistant.
- `redis`, instance partagée avec volume persistant.
- `mongo-express`, exposé via Traefik externe.
- des labels Traefik sur les services HTTP, sans inclure Traefik dans la stack applicative.
- un réseau interne privé pour MongoDB/Redis et une connexion au réseau externe `traefik` seulement pour les services exposés.

## Configuration

Les secrets Kubernetes seront remplacés par des variables d'environnement Docker Compose. Le repo fournira des fichiers exemples sans valeurs sensibles.

La configuration attendue inclut :

- domaines publics pour `dev`, `rct`, `prod`, `mongo-express`, Traefik et Portainer.
- credentials MongoDB root et URLs MongoDB par environnement.
- mot de passe Redis.
- secrets applicatifs : JWT, NextAuth, OAuth, Resend, Stripe, Sentry et chiffrement.
- auth basique Traefik pour les consoles exposées.

Les fichiers `.env` réels resteront locaux au serveur et ne devront pas être commités.

## Déploiement

Le déploiement cible se fera en deux temps :

1. Démarrer la stack infra globale pour créer le réseau `traefik`, exposer Traefik et Portainer, et initialiser les volumes.
2. Démarrer la stack DiaspoMoney, qui rejoint le réseau `traefik` et expose ses services via labels.

Les scripts npm `deploy:dev`, `deploy:rct` et `deploy:prod` seront remplacés par des commandes Compose cohérentes, ou par un script unique `scripts/deploy-compose.sh` qui construit et redémarre le service demandé.

## Suppression Kubernetes

Les éléments suivants seront retirés ou remplacés :

- dossier `k8s/`.
- scripts d'initialisation ou déploiement Kubernetes.
- documentation Kubernetes/K3s.
- références package scripts aux anciens scripts Kubernetes.
- documentation Jenkins liée à l'ancien déploiement si elle ne sert plus au projet.

## Vérification

La migration sera validée par :

- validation syntaxique des fichiers Compose avec `docker compose config`.
- build des images applicatives via Compose.
- démarrage local ou serveur des services principaux.
- vérification des healthchecks MongoDB/Redis/app.
- vérification des routes Traefik par labels.
- tests applicatifs existants lorsque l'environnement requis est disponible.

