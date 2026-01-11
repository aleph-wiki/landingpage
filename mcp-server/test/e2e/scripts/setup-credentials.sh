#!/usr/bin/env bash
# Setup test credentials for e2e tests
set -euo pipefail

CSS_URL="${CSS_URL:-http://localhost:3000}"
EMAIL="${EMAIL:-dev@localhost}"
PASSWORD="${PASSWORD:-dev123}"
POD_NAME="${POD_NAME:-dev}"
CREDENTIAL_NAME="${CREDENTIAL_NAME:-E2E-Test-Client}"

# Default output to e2e directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FILE="${OUTPUT_FILE:-$SCRIPT_DIR/../.env.test}"

echo "Waiting for CSS to be ready..."
for i in {1..30}; do
  if curl -sf "$CSS_URL" > /dev/null 2>&1; then
    echo "CSS is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "ERROR: CSS did not start within 30 seconds"
    exit 1
  fi
  sleep 1
done

echo "Logging in as $EMAIL..."
AUTH_RESPONSE=$(curl -sf -X POST "$CSS_URL/.account/login/password/" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

AUTH_TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"authorization":"[^"]*"' | cut -d'"' -f4)

if [ -z "$AUTH_TOKEN" ]; then
  echo "ERROR: Failed to get auth token"
  exit 1
fi

echo "Getting account details..."
ACCOUNT_RESPONSE=$(curl -sf -X GET "$CSS_URL/.account/account/" \
  -H "Authorization: CSS-Account-Token $AUTH_TOKEN")

ACCOUNT_ID=$(echo "$ACCOUNT_RESPONSE" | grep -oP 'account/\K[a-f0-9-]+(?=/pod/)' | head -1)

if [ -z "$ACCOUNT_ID" ]; then
  echo "ERROR: Failed to get account ID"
  exit 1
fi

echo "Checking if pod exists..."
# List all pods to see if one exists
PODS_RESPONSE=$(curl -sf -X GET "$CSS_URL/.account/account/$ACCOUNT_ID/pod/" \
  -H "Authorization: CSS-Account-Token $AUTH_TOKEN")

# Extract first pod URL from the "pods" object (keys are pod URLs)
POD_URL=$(echo "$PODS_RESPONSE" | grep -oP '"pods"\s*:\s*\{\s*"\K[^"]+' | head -1 || echo "")

if [ -z "$POD_URL" ]; then
  echo "Creating pod '$POD_NAME'..."
  POD_CREATE_RESPONSE=$(curl -sf -X POST "$CSS_URL/.account/account/$ACCOUNT_ID/pod/" \
    -H "Authorization: CSS-Account-Token $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$POD_NAME\"}")

  POD_URL=$(echo "$POD_CREATE_RESPONSE" | grep -oP '"pod"\s*:\s*"\K[^"]+')
  WEB_ID=$(echo "$POD_CREATE_RESPONSE" | grep -oP '"webId"\s*:\s*"\K[^"]+')
  echo "Pod created: $POD_URL"
  echo "WebID: $WEB_ID"
else
  # WebID is pod URL + profile/card#me
  WEB_ID="${POD_URL}profile/card#me"
  echo "Pod already exists: $POD_URL"
  echo "WebID: $WEB_ID"
fi

echo "Generating client credentials..."
CRED_RESPONSE=$(curl -sf -X POST "$CSS_URL/.account/account/$ACCOUNT_ID/client-credentials/" \
  -H "Authorization: CSS-Account-Token $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$CREDENTIAL_NAME\",\"webId\":\"$WEB_ID\"}")

CLIENT_ID=$(echo "$CRED_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
CLIENT_SECRET=$(echo "$CRED_RESPONSE" | grep -o '"secret":"[^"]*"' | cut -d'"' -f4)

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
  echo "ERROR: Failed to generate credentials"
  exit 1
fi

echo ""
echo "✓ Credentials generated successfully!"
echo ""
echo "Writing to $OUTPUT_FILE..."
cat > "$OUTPUT_FILE" <<EOF
# Auto-generated test credentials for CSS
# Generated: $(date -Iseconds)
TEST_CSS_URL=$CSS_URL
TEST_POD_URL=$POD_URL
TEST_WEB_ID=$WEB_ID
TEST_CLIENT_ID=$CLIENT_ID
TEST_CLIENT_SECRET=$CLIENT_SECRET
EOF

echo ""
echo "Credentials saved to $OUTPUT_FILE"
echo ""
echo "To use in tests:"
echo "  export \$(cat $OUTPUT_FILE | xargs)"
echo ""
