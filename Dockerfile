# Use a Node.js base image (Debian-based recommended for apt)
FROM node:20-bookworm-slim

# Set environment variables
ENV NODE_ENV=production
ENV DISPLAY=:1 \
    DEBIAN_FRONTEND=noninteractive

# Install system dependencies for Puppeteer, Xvfb, VNC, Window Manager, and noVNC
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    # Puppeteer dependencies
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxshmfence1 \
    libxtst6 \
    # Virtual display and VNC
    xvfb \
    x11vnc \
    fluxbox \
    # noVNC dependencies
    git \
    python3 \
    python3-pip \
    python3-numpy \
    python3-websockify \
    # Utilities
    wget \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Clone noVNC into /opt
RUN git clone https://github.com/novnc/noVNC.git /opt/noVNC

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Build the Next.js application
RUN npm run build

# Copy entrypoint script and make it executable
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose ports
# 3000: Next.js app
# 6080: noVNC Web interface / WebSocket proxy
# 8080: Custom status WebSocket server
# 5901: VNC server itself (optional - only needed for direct VNC clients)
# 9222: Puppeteer default debugging port (if enabled)
EXPOSE 3000 6080 8080 5901 9222

# Run the entrypoint script
ENTRYPOINT ["/entrypoint.sh"]