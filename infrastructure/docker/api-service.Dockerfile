FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
COPY shared/package.json ./shared/
COPY backend/api-service/package.json ./backend/api-service/
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
COPY shared ./shared
COPY backend/api-service ./backend/api-service
COPY tsconfig.json ./
RUN pnpm --filter @telemetry/shared build
RUN pnpm --filter api-service build

FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
COPY backend/api-service/package.json ./backend/api-service/
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/backend/api-service/dist ./backend/api-service/dist
COPY --from=builder /app/shared/dist ./shared/dist
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "backend/api-service/dist/index.js"]
