FROM node:20-slim

WORKDIR /app/backend

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]

