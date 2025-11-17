#!/bin/bash
# Script wrapper pour next lint
cd "$(dirname "$0")/.." || exit 1
npx next lint

