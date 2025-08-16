FROM node:18-bullseye

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /app

# --- Update apt and install dependencies ---
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3 \
        python3-pip \
        libreoffice-core \
        libreoffice-writer \
        libreoffice-calc \
        libreoffice-common \
        fonts-dejavu-core \
        fonts-noto-arabic \
        libgl1-mesa-glx \
        libxrender1 \
        libxext6 \
        libsm6 \
        libfontconfig1 \
        wget \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# --- Copy Calibri font (you must provide the TTFs in ./fonts) ---
COPY fonts /usr/share/fonts/truetype/custom
RUN fc-cache -f -v && \
    echo "✅ Installed fonts:" && \
    fc-list | grep -Ei "calibri|noto"

# --- Copy Node dependencies and install ---
COPY package*.json ./
RUN npm ci --production

# --- Install Python requirements if exist ---
COPY requirements.txt ./
RUN if [ -f requirements.txt ]; then pip3 install --no-cache-dir -r requirements.txt; fi

# --- Copy all project files ---
COPY . .

ENV PY_BIN=/usr/bin/python3
EXPOSE 3000

CMD ["node", "bot.js"]
