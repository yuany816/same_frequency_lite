FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=development

COPY package*.json ./
RUN npm ci --legacy-peer-deps --include=dev --no-audit --no-fund \
  && test -x node_modules/.bin/taro

COPY . .
RUN npm run build:weapp

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
