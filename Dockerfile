FROM node:20-alpine

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Install dependencies
COPY package*.json ./
RUN npm install --production --ignore-scripts
RUN npm rebuild better-sqlite3 --build-from-source

# Copy source
COPY . .

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Run setup on build
RUN node src/scripts/setup.js || true

# Start server
CMD ["npm", "start"]
