#!/bin/bash

echo "🚀 Indirla deployment başlıyor..."

# Değişkenler
APP_DIR="/home/indirla/indirla"
REPO_URL="https://github.com/your-username/indirla.git"
LOG_DIR="/home/indirla/logs"

# Log dizini oluştur
mkdir -p $LOG_DIR

# Eğer uygulama dizini yoksa clone et
if [ ! -d "$APP_DIR" ]; then
    echo "📁 Repository clone ediliyor..."
    git clone $REPO_URL $APP_DIR
else
    echo "🔄 Repository güncelleniyor..."
    cd $APP_DIR
    git pull origin main
fi

cd $APP_DIR

# Dependencies kurulumu
echo "📦 Dependencies kurulumu..."
npm ci --only=production

# Build işlemi
echo "🔨 Build işlemi..."
npm run build

# PM2 ile uygulamayı başlat/yeniden başlat
echo "⚙️ PM2 ile uygulama yönetimi..."
if pm2 list | grep -q "indirla"; then
    echo "🔄 Uygulama yeniden başlatılıyor..."
    pm2 reload ecosystem.config.js
else
    echo "▶️ Uygulama ilk kez başlatılıyor..."
    pm2 start ecosystem.config.js
fi

# PM2 startup (sistem başlangıcında otomatik başlatma)
pm2 startup
pm2 save

# Nginx konfigürasyonu kopyala (ilk deployment için)
if [ ! -f "/etc/nginx/sites-available/indirla" ]; then
    echo "🌐 Nginx konfigürasyonu ayarlanıyor..."
    sudo cp deploy/nginx.conf /etc/nginx/sites-available/indirla
    sudo ln -sf /etc/nginx/sites-available/indirla /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl reload nginx
fi

echo "✅ Deployment tamamlandı!"
echo "🔗 Uygulama çalışıyor: http://your-server-ip"
echo "📊 PM2 status: pm2 status"
echo "📋 PM2 logs: pm2 logs indirla"