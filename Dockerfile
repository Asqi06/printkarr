FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY . .
RUN mkdir -p /app/data/uploads && chown -R node:node /app/data
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["node", "server.mjs"]
