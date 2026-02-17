# Build stage for React app
FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY dashboard/client/package*.json ./
RUN npm install
COPY dashboard/client/ ./
RUN npm run build

# Main application stage
FROM node:22-alpine
WORKDIR /app

# Install OpenClaw dependencies
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    cairo-dev \
    pango-dev \
    giflib-dev \
    libjpeg-turbo-dev \
    librsvg-dev

# Copy package files
COPY dashboard/package*.json ./
RUN npm install

# Copy server code
COPY dashboard/server.js ./

# Copy built React app
COPY --from=client-build /app/client/build ./client/build

# Expose port
EXPOSE 3000

# Start the dashboard
CMD ["node", "server.js"]