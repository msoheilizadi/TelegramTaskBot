# Dockerfile
FROM node:18-bullseye

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /app

# نصب python3, pip, libreoffice و وابستگی‌های پایه
RUN apt-get update && \
    apt-get install -y python3 python3-pip libreoffice libreoffice-writer fonts-dejavu-core libgl1 && \
    rm -rf /var/lib/apt/lists/*

# کپی و نصب بسته‌های نود
COPY package*.json ./
RUN npm ci --production

# نصب پکیج‌های پایتون از requirements.txt (در صورت وجود)
COPY requirements.txt . || true
RUN if [ -f requirements.txt ]; then pip3 install -r requirements.txt; fi

# کپی کل پروژه
COPY . .

# متغیر محیطی که می‌تونی در Node استفاده کنی
ENV PY_BIN=/usr/bin/python3

EXPOSE 3000
CMD ["node", "bot.js"]
