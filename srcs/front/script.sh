#!/bin/ash
sleep 10
npm install -g npm@10.9.0
npm audit fix
npm install
npm install axios
# npm install -D @vitejs/plugin-basic-ssl
npm run dev -- --host