# Use Node.js 18 with Debian Bullseye
FROM node:18-bullseye

# Prevent apt from prompting for user input
ENV DEBIAN_FRONTEND=noninteractive

# Set working directory
WORKDIR /app

# Install Python3, pip, LibreOffice, and basic dependencies
RUN apt-get update && \
    apt-get install -y \
        python3 \
        python3-pip \
        libreoffice \
        libreoffice-writer \
        fonts-dejavu-core \
        libgl1 \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# Install Node.js dependencies in production mode
RUN npm ci --production

# Copy requirements.txt if exists and install Python dependencies
COPY requirements.txt ./ 
RUN if [ -f requirements.txt ]; then pip3 install -r requirements.txt; fi

# Copy the rest of the project files
COPY . .

# Environment variable for Python path
ENV PY_BIN=/usr/bin/python3

# Expose app port
EXPOSE 3000

# Start bot
CMD ["node", "bot.js"]
