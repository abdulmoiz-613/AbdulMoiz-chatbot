#!/bin/bash
echo "Building frontend for production..."
cd frontend
npm ci
CI=false npm run build
echo "Build completed!"
