FROM node:18-bullseye
WORKDIR /app
COPY package*.json ./
RUN apt-get update && apt-get install -y openssl && npm install
COPY . .
RUN npx prisma generate
RUN npm run build
RUN cp -r .next/static .next/standalone/.next/static && cp -r public .next/standalone/public || true
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node .next/standalone/server.js"]
