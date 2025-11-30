FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy built server
COPY dist/server ./dist/server

# Expose port
EXPOSE 8080

# Start WebSocket server
CMD ["node", "dist/server/index.js"]

