FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=development

RUN npm install --global npm@9.9.4 \
  && npm config set fund false \
  && npm config set audit false \
  && npm config set maxsockets 1 \
  && npm config set fetch-retries 5 \
  && npm config set fetch-retry-factor 2 \
  && npm config set fetch-timeout 120000

COPY package*.json ./
RUN npm ci --legacy-peer-deps --include=dev --no-audit --no-fund --prefer-offline \
  && test -x node_modules/.bin/taro

COPY . .
RUN npm run build:weapp

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
