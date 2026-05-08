FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN apk add --no-cache openssl
RUN npm ci
RUN npx prisma generate

EXPOSE 3000
# db push syncs schema non-interactively; start:dev runs with hot reload
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm run start:dev"]
