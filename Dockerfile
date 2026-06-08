FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --include=dev

COPY . .
RUN node scripts/generate-icons.mjs
RUN npm run build

ENV NODE_ENV=production
ENV PORT=8080
ENV DB_PATH=/data/database.sqlite

EXPOSE 8080

CMD ["node", "server/index.js"]
