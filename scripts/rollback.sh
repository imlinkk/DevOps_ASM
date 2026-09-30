#!/usr/bin/env bash
# ============================================================
# rollback.sh – Rollback to a previous Docker image on Render
# Usage: ./scripts/rollback.sh <previous-image-tag>
# Example: ./scripts/rollback.sh sha-abc1234
# ============================================================

set -euo pipefail

DOCKERHUB_USERNAME="${DOCKERHUB_USERNAME:-}"
IMAGE_NAME="${DOCKERHUB_USERNAME}/devops-node-api"
RENDER_DEPLOY_HOOK_URL="${RENDER_DEPLOY_HOOK_URL:-}"
RENDER_APP_URL="${RENDER_APP_URL:-}"

# ── Validate arguments ───────────────────────────────────────
if [ $# -lt 1 ]; then
  echo "❌ Usage: $0 <previous-image-tag>"
  echo "   Example: $0 sha-abc1234"
  exit 1
fi

ROLLBACK_TAG="$1"
FULL_IMAGE="${IMAGE_NAME}:${ROLLBACK_TAG}"

echo "=============================================="
echo "  🔄  ROLLBACK INITIATED"
echo "=============================================="
echo "  Rolling back to: ${FULL_IMAGE}"
echo ""

# ── Verify the target image exists on Docker Hub ─────────────
echo "→ Verifying image exists on Docker Hub..."
if ! docker manifest inspect "${FULL_IMAGE}" > /dev/null 2>&1; then
  echo "❌ Image '${FULL_IMAGE}' not found on Docker Hub. Aborting rollback."
  exit 1
fi
echo "✅ Image verified: ${FULL_IMAGE}"

# ── Re-tag the rollback image as 'latest' ─────────────────────
echo ""
echo "→ Pulling rollback image..."
docker pull "${FULL_IMAGE}"

echo "→ Re-tagging as 'latest'..."
docker tag "${FULL_IMAGE}" "${IMAGE_NAME}:latest"

echo "→ Pushing latest tag to Docker Hub..."
docker push "${IMAGE_NAME}:latest"

# ── Trigger Render deploy hook ────────────────────────────────
if [ -z "${RENDER_DEPLOY_HOOK_URL}" ]; then
  echo "⚠️  RENDER_DEPLOY_HOOK_URL not set – skipping Render deploy trigger."
else
  echo ""
  echo "→ Triggering Render deploy hook..."
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${RENDER_DEPLOY_HOOK_URL}")
  if [ "${RESPONSE}" == "200" ] || [ "${RESPONSE}" == "201" ]; then
    echo "✅ Render deploy hook triggered (HTTP ${RESPONSE})"
  else
    echo "❌ Render deploy hook failed (HTTP ${RESPONSE})"
    exit 1
  fi
fi

# ── Wait for health check ─────────────────────────────────────
if [ -z "${RENDER_APP_URL}" ]; then
  echo "⚠️  RENDER_APP_URL not set – skipping health check."
else
  echo ""
  echo "→ Waiting 60s for Render to restart..."
  sleep 60

  MAX_RETRIES=10
  RETRY=0
  until curl -sf "${RENDER_APP_URL}/health/ready" > /dev/null; do
    RETRY=$((RETRY + 1))
    if [ "${RETRY}" -ge "${MAX_RETRIES}" ]; then
      echo "❌ Health check failed after ${MAX_RETRIES} attempts. Manual intervention required."
      exit 1
    fi
    echo "   Attempt ${RETRY}/${MAX_RETRIES} – not ready yet, retrying in 15s..."
    sleep 15
  done
  echo "✅ App is healthy after rollback!"
fi

echo ""
echo "=============================================="
echo "  ✅  ROLLBACK COMPLETE: ${ROLLBACK_TAG}"
echo "=============================================="
