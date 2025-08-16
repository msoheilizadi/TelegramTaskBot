# --- Base image with Node.js 18 on Debian Bullseye ---
FROM node:18-bullseye

# Prevent apt from prompting
ENV DEBIAN_FRONTEND=noninteractive

# Working directory
WORKDIR /app

# --- Configure apt to retry downloads and increase timeout ---
RUN echo 'Acquire::Retries "5"; Acquire::http::Timeout "120";' > /etc/apt/apt.conf.d/99retries

# --- Install system dependencies ---
RUN apt-get update && \
    apt-get install -y --fix-missing \
        python3 \
        python3-pip \
        libreoffice \
        libreoffice-writer \
        fonts-dejavu-core \
        libgl1 \
    || (sleep 10 && apt-get update && apt-get install -y --fix-missing \
        python3 python3-pip libreoffice libreoffice-writer fonts-dejavu-core libgl1) && \
    rm -rf /var/lib/apt/lists/*

# --- Install custom fonts (Tw Cen MT + Calibri) ---
COPY fonts /usr/share/fonts/truetype/custom
RUN fc-cache -f -v && \
    echo "✅ Installed fonts:" && \
    fc-list | grep -Ei "calibri|tw cen mt" || (echo "❌ Fonts not found!" && exit 1)

# --- Copy package.json & package-lock.json ---
COPY package*.json ./

# --- Install Node dependencies ---
RUN npm ci --production

# --- Copy Python dependencies ---
COPY requirements.txt ./
RUN if [ -f requirements.txt ]; then pip3 install -r requirements.txt; fi

# --- Copy all project files ---
COPY . .

# --- Environment variable for Python path ---
ENV PY_BIN=/usr/bin/python3

# --- Expose port (adjust if needed) ---
EXPOSE 3000

# --- Default command ---
CMD ["node", "bot.js"]
