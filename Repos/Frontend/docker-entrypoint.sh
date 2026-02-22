#!/bin/sh
# Search all JS files in the dist folder and replace the placeholder
find /app -name "*.js" -exec sed -i "s|API_BASE_URL_PLACEHOLDER|${VITE_API_BASE_URL}|g" {} +

# Start the actual server
exec "$@"