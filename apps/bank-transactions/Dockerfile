FROM node:22-alpine AS base

FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/typescript-config ./packages/typescript-config
COPY apps/bank-transactions ./apps/bank-transactions
RUN npm ci --workspace=bank-transactions
RUN npm run build --workspace=bank-transactions

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/bank-transactions/dist ./apps/bank-transactions/dist
COPY --from=builder /app/apps/bank-transactions/package.json ./apps/bank-transactions/package.json

EXPOSE 3001
CMD ["node", "apps/bank-transactions/dist/index.js"]
