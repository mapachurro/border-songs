#!/bin/bash
set -e

rm -rf node_modules package-lock.json dist .astro

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

nvm use
npm install