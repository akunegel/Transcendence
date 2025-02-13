#!/bin/ash
sleep 10
npm install -g npm@10.9.0
npm audit fix
npm install
npm install bootstrap@5.3.2
npm install bootstrap-icons
npm install react-bootstrap boostrap
npm install jwt-decode
npm install dequal
npm install i18next react-i18next i18next-http-backend
npm update
npm run dev -- --host