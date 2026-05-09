#!/bin/bash

# Script para aguardar o backend estar pronto

BACKEND_HOST=${1:-backend}
BACKEND_PORT=${2:-3000}
TIMEOUT=${3:-60}

echo "Aguardando backend em $BACKEND_HOST:$BACKEND_PORT..."

start_time=$(date +%s)

while true; do
  current_time=$(date +%s)
  elapsed=$((current_time - start_time))
  
  if [ $elapsed -gt $TIMEOUT ]; then
    echo "Timeout aguardando backend após $TIMEOUT segundos"
    exit 1
  fi
  
  if nc -z $BACKEND_HOST $BACKEND_PORT 2>/dev/null; then
    echo "Backend está pronto!"
    exit 0
  fi
  
  echo "Backend ainda não está pronto... aguardando..."
  sleep 2
done
