FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/typescript-config ./packages/typescript-config
COPY packages/ui ./packages/ui
COPY packages/eslint-config ./packages/eslint-config
COPY apps/ui ./apps/ui
RUN npm ci --workspace=@repo/ui-app
RUN npm run build --workspace=@repo/ui-app

FROM nginx:alpine
COPY --from=builder /app/apps/ui/dist /usr/share/nginx/html
