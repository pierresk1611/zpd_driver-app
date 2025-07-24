# 🚀 Production Deployment Guide - Zpoledomu Driver App

## Prehľad

Tento guide popisuje nasadenie Zpoledomu Driver App aplikácie do produkcie s plne funkčnými integráciami:

- ✅ **WooCommerce API** - reálne objednávky
- ✅ **Google Maps API** - geocoding a optimalizácia trás
- ✅ **Twilio SMS** - automatické notifikácie

## 📋 Predpoklady

### Hosting Requirements

- **Node.js 18+** support
- **Static file serving** (pre React build)
- **API server hosting** (pre backend Express server)
- **SSL certificate** (HTTPS required)
- **Domain/subdomain** (napr. app.zpoledomu.cz)

### Recommended Hosting Options

1. **Vercel** - automatický deploy z Git
2. **Netlify** - static frontend + functions
3. **Heroku** - full-stack aplikácie
4. **DigitalOcean App Platform** - kompletné riešenie
5. **Vlastný VPS** - Ubuntu/CentOS server

## 🔑 Environment Variables (Production)

Vytvorte `.env.production` súbor s nasledovnými hodnotami:

```bash
# ==============================================
# ZPOLEDOMU PRODUCTION ENVIRONMENT VARIABLES
# ==============================================

# WooCommerce API Credentials
WOOCOMMERCE_URL=https://zpoledomu.cz
WOOCOMMERCE_KEY=ck_c04c9c7347b4b078549e6548be52bfa74c41b14b
WOOCOMMERCE_SECRET=cs_484c4c50900196991189d6f57b0b9874aacfa61d

# Google Maps API
GOOGLE_MAPS_API_KEY=AIzaSyCOb7tmFyCwrAJ3idJ8u69cMYS9rOzo1SA

# Twilio SMS Integration
TWILIO_ACCOUNT_SID=AC755d4796b61d253eebeee07ca5a20807
TWILIO_AUTH_TOKEN=e489cbfba8058e6f199e13ae08871d7e
TWILIO_FROM_NUMBER=+420123456789

# Application Settings
NODE_ENV=production
PORT=3000
API_BASE_URL=https://app.zpoledomu.cz/api

# Security (generate strong random values)
JWT_SECRET=your-super-secret-jwt-key-here
ADMIN_PASSWORD=your-admin-password-here

# Optional: Logging & Monitoring
LOG_LEVEL=info
SENTRY_DSN=your-sentry-dsn-if-using-error-tracking
```

## 🏗️ Build Commands

### Frontend (React)

```bash
# Install dependencies
npm install

# Build production version
npm run build

# Files will be in /dist folder
```

### Backend (Express API)

```bash
# Install production dependencies
npm install --production

# Start server
npm start
```

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

1. **Push to GitHub**:

   ```bash
   git add .
   git commit -m "Production ready with all integrations"
   git push origin main
   ```

2. **Connect to Vercel**:

   - Ísť na [vercel.com](https://vercel.com)
   - Import GitHub repository
   - Set environment variables
   - Deploy automaticky

3. **Vercel Configuration** (`vercel.json`):
   ```json
   {
     "builds": [
       {
         "src": "client/**/*",
         "use": "@vercel/static-build"
       },
       {
         "src": "server/index.ts",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/server/index.ts"
       },
       {
         "src": "/(.*)",
         "dest": "/client/dist/index.html"
       }
     ]
   }
   ```

### Option 2: Netlify

1. **Build Settings**:

   ```bash
   # Build command
   npm run build

   # Publish directory
   dist
   ```

2. **Netlify Functions** (pre API):
   - Vytvorte `netlify/functions` folder
   - Move API endpoints to functions
   - Configure redirects

### Option 3: DigitalOcean App Platform

1. **App Spec** (`app.yaml`):
   ```yaml
   name: zpoledomu-driver-app
   services:
     - name: api
       source_dir: /server
       run_command: npm start
       environment_slug: node-js
       instance_count: 1
       instance_size_slug: basic-xxs
       envs:
         - key: NODE_ENV
           value: production
     - name: frontend
       source_dir: /client
       build_command: npm run build
       run_command: npm run preview
       environment_slug: node-js
       instance_count: 1
       instance_size_slug: basic-xxs
   ```

### Option 4: VPS/Dedicated Server

1. **Server Setup** (Ubuntu 22.04):

   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2 for process management
   sudo npm install -g pm2

   # Install Nginx for reverse proxy
   sudo apt install nginx
   ```

2. **Deploy Application**:

   ```bash
   # Clone repository
   git clone https://github.com/your-username/zpoledomu-app.git
   cd zpoledomu-app

   # Install dependencies
   npm install

   # Build frontend
   npm run build

   # Start with PM2
   pm2 start server/index.ts --name "zpoledomu-api"
   pm2 startup
   pm2 save
   ```

3. **Nginx Configuration** (`/etc/nginx/sites-available/zpoledomu`):

   ```nginx
   server {
       listen 80;
       server_name app.zpoledomu.cz;

       # Frontend static files
       location / {
           root /path/to/zpoledomu-app/dist;
           try_files $uri $uri/ /index.html;
       }

       # API proxy
       location /api {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```

## 🔐 SSL Certificate Setup

### Using Let's Encrypt (Free):

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d app.zpoledomu.cz

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🎯 WordPress Integration Setup

### 1. WooCommerce Configuration

V WordPress admin (`zpoledomu.cz/wp-admin`):

1. **WooCommerce > Settings > Advanced > REST API**
2. **Create API Key** s permissions "Read/Write"
3. **Copy Consumer Key a Consumer Secret** (už máte)

### 2. Custom Fields Setup

Pridajte custom fields pre objednávky:

```php
// functions.php
add_action('woocommerce_admin_order_data_after_order_details', 'add_driver_fields');
function add_driver_fields($order) {
    echo '<div class="order_data_column">
        <h4>Driver Information</h4>
        <p><strong>Assigned Driver:</strong> ' . get_post_meta($order->get_id(), '_assigned_driver', true) . '</p>
        <p><strong>Delivery Time:</strong> ' . get_post_meta($order->get_id(), '_delivery_time', true) . '</p>
        <p><strong>GPS Location:</strong> ' . get_post_meta($order->get_id(), '_delivery_gps', true) . '</p>
    </div>';
}
```

## 📱 Mobile App Configuration

### Progressive Web App (PWA)

Aplikácia podporuje PWA pre mobile zariadenia:

1. **Manifest** (`public/manifest.json`):

   ```json
   {
     "name": "Zpoledomu Driver App",
     "short_name": "Zpoledomu",
     "theme_color": "#16a34a",
     "background_color": "#f0fdf4",
     "display": "standalone",
     "scope": "/",
     "start_url": "/",
     "icons": [
       {
         "src": "/icon-192.png",
         "sizes": "192x192",
         "type": "image/png"
       }
     ]
   }
   ```

2. **Service Worker** pre offline support

## 🔍 Monitoring & Maintenance

### 1. Logging

```bash
# PM2 logs
pm2 logs zpoledomu-api

# Application logs
tail -f /var/log/zpoledomu/app.log
```

### 2. Health Checks

```bash
# API health check
curl https://app.zpoledomu.cz/api/health

# Expected response:
{
  "status": "OK",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "service": "Zpoledomu Driver App API"
}
```

### 3. Backup Strategy

- **Database**: WooCommerce data (už backed up)
- **Environment vars**: Secure storage
- **Application code**: Git repository

## 🚨 Troubleshooting

### Common Issues:

1. **CORS Errors**:

   ```javascript
   // Add to server/index.ts
   app.use(
     cors({
       origin: ["https://app.zpoledomu.cz", "https://zpoledomu.cz"],
       credentials: true,
     }),
   );
   ```

2. **API Timeouts**:

   ```bash
   # Increase timeout in nginx
   proxy_read_timeout 300;
   proxy_connect_timeout 300;
   ```

3. **SMS Issues**:
   - Check Twilio account balance
   - Verify phone number format (+420...)
   - Check API credentials

## 📞 Support Contacts

- **WooCommerce**: WordPress admin access
- **Google Maps**: Google Cloud Console
- **Twilio**: Twilio Console
- **Domain/Hosting**: Your hosting provider

## ✅ Go-Live Checklist

- [ ] Environment variables set
- [ ] SSL certificate installed
- [ ] WooCommerce API working
- [ ] Google Maps geocoding working
- [ ] Twilio SMS sending working
- [ ] PWA installable
- [ ] Mobile responsive
- [ ] Error monitoring setup
- [ ] Backup strategy in place
- [ ] Team training completed

---

**Ready for Production**: ✅ **YES**  
**All APIs Integrated**: ✅ **YES**  
**Mobile Ready**: ✅ **YES**  
**Security**: ✅ **HTTPS + API Keys**

🚀 **Aplikácia je pripravená na nasadenie!**
