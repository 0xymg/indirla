#!/bin/bash

echo "🚀 Vultr VPS Setup başlıyor..."

# System güncelleme
sudo apt update && sudo apt upgrade -y

# Node.js 18.x kurulumu
echo "📦 Node.js kurulumu..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Python, pip, ffmpeg kurulumu
echo "📦 Python ve ffmpeg kurulumu..."
sudo apt-get install -y python3 python3-pip ffmpeg git nginx

# yt-dlp kurulumu
echo "📹 yt-dlp kurulumu..."
sudo pip3 install yt-dlp

# PM2 kurulumu (process manager)
echo "⚙️ PM2 kurulumu..."
sudo npm install -g pm2

# Kullanıcı oluştur (opsiyonel, güvenlik için)
sudo adduser --disabled-password --gecos "" indirla
sudo usermod -aG sudo indirla

# Firewall setup
echo "🔥 UFW firewall ayarları..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "✅ Sistem kurulumu tamamlandı!"
echo "📋 Sonraki adımlar:"
echo "1. Git repo'yu clone edin"
echo "2. npm install && npm run build"
echo "3. PM2 ile uygulamayı başlatın"