#!/bin/bash
set -e

OLLAMA_URL="${OLLAMA_BASE_URL:-http://localhost:11434}"
MODEL="${MODEL_NAME:-llama3.2:3b}"

echo "==> Waiting for Ollama at ${OLLAMA_URL}..."
until curl -sf "${OLLAMA_URL}/api/tags" > /dev/null; do
  echo "    Ollama not ready, retrying in 5s..."
  sleep 5
done
echo "==> Ollama is ready."

echo "==> Ensuring model '${MODEL}' is available (pulling if needed)..."
curl -s "${OLLAMA_URL}/api/pull" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"${MODEL}\"}"
echo ""
echo "==> Model ready."

echo "==> Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
