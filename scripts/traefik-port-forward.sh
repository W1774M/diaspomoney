#!/bin/bash
# Script pour maintenir un port-forward vers Traefik

while true; do
    kubectl port-forward -n kube-system svc/traefik 8080:80 8443:443 --address=127.0.0.1
    sleep 5
done

