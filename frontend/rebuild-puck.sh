#!/usr/bin/env bash
set -e

echo "Building Puck only..."
cd ../packages/webapp-libs/weditor/wwai_puck/
yarn workspace @measured/puck build 

echo "Back to frontend..."
cd ../../../../frontend

echo "Cleaning frontend build artifacts..."
rm -rf dist node_modules

echo "Installing frontend dependencies..."
npm install

echo "Building frontend..."
npm run build

echo "Running frontend..."
task run-frontend
