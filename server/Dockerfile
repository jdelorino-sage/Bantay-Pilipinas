FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/ ./shared/
COPY server/ ./server/
COPY frontend/package.json ./frontend/package.json

RUN npm ci --workspace=shared --workspace=server

RUN npm run build --workspace=shared && npm run build --workspace=server

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/package.json ./server/package.json
COPY --from=builder /app/shared/package.json ./shared/package.json
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 3001
WORKDIR /app/server
CMD ["node", "dist/index.js"]
