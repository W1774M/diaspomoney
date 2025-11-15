.PHONY: help deploy undeploy status logs backup restore scale update

ENV ?= prod
NAMESPACE = diaspomoney-$(ENV)

help:
	@echo "Commandes disponibles:"
	@echo "  make deploy ENV=prod    - Déployer l'application"
	@echo "  make undeploy ENV=prod - Supprimer l'application"
	@echo "  make status ENV=prod   - Afficher le statut"
	@echo "  make logs ENV=prod     - Afficher les logs"
	@echo "  make backup ENV=prod   - Backup MongoDB"
	@echo "  make restore ENV=prod FILE=backup.tar.gz - Restore MongoDB"
	@echo "  make scale ENV=prod REPLICAS=5 - Scaling manuel"
	@echo "  make update ENV=prod IMAGE=app:v1.1.0 - Mettre à jour l'image"

deploy:
	@echo "🚀 Déploiement sur $(NAMESPACE)..."
	@./scripts/deploy.sh $(ENV)

undeploy:
	@echo "🗑️  Suppression de $(NAMESPACE)..."
	@kubectl delete -f app/ -n $(NAMESPACE) || true
	@kubectl delete -f mongodb/ -n $(NAMESPACE) || true
	@kubectl delete -f redis/ -n $(NAMESPACE) || true
	@kubectl delete -f mongo-express/ -n $(NAMESPACE) || true
	@kubectl delete -f ingress/ -n $(NAMESPACE) || true
	@kubectl delete -f configmaps/ -n $(NAMESPACE) || true
	@kubectl delete -f secrets/ -n $(NAMESPACE) || true
	@kubectl delete namespace $(NAMESPACE) || true

status:
	@echo "📊 Statut de $(NAMESPACE):"
	@kubectl get pods -n $(NAMESPACE)
	@echo ""
	@kubectl get svc -n $(NAMESPACE)
	@echo ""
	@kubectl get ingress -n $(NAMESPACE)
	@echo ""
	@kubectl get hpa -n $(NAMESPACE)

logs:
	@kubectl logs -f deployment/diaspomoney-app -n $(NAMESPACE)

backup:
	@./scripts/backup-mongodb.sh $(NAMESPACE)

restore:
	@if [ -z "$(FILE)" ]; then \
		echo "❌ Usage: make restore ENV=prod FILE=backup.tar.gz"; \
		exit 1; \
	fi
	@./scripts/restore-mongodb.sh $(FILE) $(NAMESPACE)

scale:
	@if [ -z "$(REPLICAS)" ]; then \
		echo "❌ Usage: make scale ENV=prod REPLICAS=5"; \
		exit 1; \
	fi
	@kubectl scale deployment diaspomoney-app --replicas=$(REPLICAS) -n $(NAMESPACE)

update:
	@if [ -z "$(IMAGE)" ]; then \
		echo "❌ Usage: make update ENV=prod IMAGE=app:v1.1.0"; \
		exit 1; \
	fi
	@kubectl set image deployment/diaspomoney-app app=$(IMAGE) -n $(NAMESPACE)
	@kubectl rollout status deployment/diaspomoney-app -n $(NAMESPACE)

secrets:
	@./scripts/generate-secrets.sh

