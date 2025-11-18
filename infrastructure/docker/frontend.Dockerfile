# Development stage
FROM node:20-alpine AS development
WORKDIR /app
COPY frontend/package.json ./
RUN npm install -g pnpm
RUN pnpm install
COPY frontend ./
EXPOSE 5173
CMD ["pnpm", "run", "dev", "--host"]

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package.json ./
RUN npm install -g pnpm
RUN pnpm install
COPY frontend ./
RUN pnpm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY infrastructure/nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
