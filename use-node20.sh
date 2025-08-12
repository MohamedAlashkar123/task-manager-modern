#!/bin/bash
# Use Node.js 20 for this project
export PATH="./node-v20.18.1-linux-x64/bin:$PATH"

echo "Using Node.js version: $(node --version)"
echo "Using npm version: $(npm --version)"
echo ""
echo "To use Node.js 20 in this project:"
echo "1. Run: source use-node20.sh"
echo "2. Or export PATH=\"./node-v20.18.1-linux-x64/bin:\$PATH\""
echo ""
echo "Commands available:"
echo "- npm run dev (start development server)"
echo "- npm run build (build for production)"
echo "- npm run start (start production server)"