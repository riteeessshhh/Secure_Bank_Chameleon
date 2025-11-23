#!/bin/bash
# Build script for Render deployment
# This script builds the frontend with the correct API URL

# Check if VITE_API_URL is set, otherwise use default
if [ -z "$VITE_API_URL" ]; then
  echo "⚠️  VITE_API_URL not set, using default: https://chameleon-backend.onrender.com"
  export VITE_API_URL="https://chameleon-backend.onrender.com"
fi

echo "Building with API URL: $VITE_API_URL"

# Install dependencies and build
npm install
npm run build

