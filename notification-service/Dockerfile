FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY notification-service/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY notification-service ./
COPY shared ../shared

# Build TypeScript code
RUN npm run build

# Expose service port
EXPOSE 3005

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3005

# Start the service
CMD ["node", "dist/index.js"]