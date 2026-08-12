FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build:weapp

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
