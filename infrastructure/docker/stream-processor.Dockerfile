FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
COPY shared/package.json ./shared/
COPY backend/stream-processor/package.json ./backend/stream-processor/
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
COPY shared ./shared
COPY backend/stream-processor ./backend/stream-processor
COPY tsconfig.json ./
RUN pnpm --filter @telemetry/shared build
RUN pnpm --filter stream-processor build

FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
COPY backend/stream-processor/package.json ./backend/stream-processor/
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/backend/stream-processor/dist ./backend/stream-processor/dist
COPY --from=builder /app/shared/dist ./shared/dist
ENV NODE_ENV=production
CMD ["node", "backend/stream-processor/dist/index.js"]
