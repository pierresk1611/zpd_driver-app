# 🚀 Rýchle Nasadenie - Zpoledomu Driver App

## ⚡ Najrýchlejšie Riešenie - Vercel (1-Click Deploy)

### Krok 1: Príprava

```bash
# Build aplikácie
npm run build
```

### Krok 2: Vercel Deploy

1. Ísť na **[vercel.com](https://vercel.com)**
2. **"Import Git Repository"**
3. **Connect GitHub/GitLab** a vybrať tento projekt
4. **Configure Environment Variables**:

```
WOOCOMMERCE_URL=https://zpoledomu.cz
WOOCOMMERCE_KEY=ck_c04c9c7347b4b078549e6548be52bfa74c41b14b
WOOCOMMERCE_SECRET=cs_484c4c50900196991189d6f57b0b9874aacfa61d
GOOGLE_MAPS_API_KEY=AIzaSyCOb7tmFyCwrAJ3idJ8u69cMYS9rOzo1SA
TWILIO_ACCOUNT_SID=AC755d4796b61d253eebeee07ca5a20807
TWILIO_AUTH_TOKEN=e489cbfba8058e6f199e13ae08871d7e
TWILIO_FROM_NUMBER=+420123456789
NODE_ENV=production
```

5. **Click "Deploy"** ✅

### Krok 3: Custom Domain (Voliteľné)

- V Vercel dashboard: **Settings > Domains**
- Pridať: `app.zpoledomu.cz`
- DNS nastavenie u domain providera

---

## 🏗️ Alternatíva - Vlastný Server

### Quick VPS Setup (Ubuntu 22.04)

```bash
# 1. Pripraviť server
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx

# 2. Deploy aplikácie
git clone [your-repo-url] /var/www/zpoledomu-app
cd /var/www/zpoledomu-app
npm install
npm run build

# 3. Vytvoriť .env súbor
nano .env
# (skopírovať env variables z vrchu)

# 4. Spustiť aplikáciu
npm install -g pm2
pm2 start server/index.js --name zpoledomu
pm2 startup
pm2 save

# 5. Nginx konfigurácia
sudo nano /etc/nginx/sites-available/zpoledomu
# (skopírovať config z PRODUCTION_DEPLOYMENT.md)

sudo ln -s /etc/nginx/sites-available/zpoledomu /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 6. SSL certifikát
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d app.zpoledomu.cz
```

---

## 📱 Testovanie po Nasadení

### 1. API Health Check

```bash
curl https://app.zpoledomu.cz/api/health
```

**Očakávaná odpoveď:**

```json
{
  "status": "OK",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "service": "Zpoledomu Driver App API"
}
```

### 2. WooCommerce Test

```bash
curl https://app.zpoledomu.cz/api/orders/today
```

### 3. Google Maps Test

```bash
curl -X POST https://app.zpoledomu.cz/api/geocode \
  -H "Content-Type: application/json" \
  -d '{"addresses":["Wenceslas Square 1, Praha"]}'
```

### 4. Twilio SMS Test

```bash
curl -X POST https://app.zpoledomu.cz/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{"to":"+420123456789","body":"Test správa z Zpoledomu!"}'
```

---

## ✅ Kontrolný Zoznam

Po nasadení skontrolujte:

- [ ] ✅ **Aplikácia je dostupná** na URL
- [ ] ✅ **Driver login** funguje
- [ ] ✅ **WooCommerce objednávky** sa načítavaju
- [ ] ✅ **Google Maps** optimalizácia trás
- [ ] ✅ **Twilio SMS** odosielanie
- [ ] ✅ **HTTPS** certifikát aktívny
- [ ] ✅ **Mobile responsive** design
- [ ] ✅ **PWA** sa dá nainštalovať

---

## 🆘 Riešenie Problémov

### Problém: "API nedostupné"

```bash
# Skontrolovať server logs
pm2 logs zpoledomu
# alebo
sudo journalctl -u zpoledomu -f
```

### Problém: "CORS Error"

- Skontrolovať `server/index.ts` CORS nastavenia
- Pridať doménu do allowed origins

### Problém: "SMS sa neodosielajú"

- Skontrolovať Twilio account balance
- Overenie telefónnych čísel (+420 formát)

### Problém: "WooCommerce data sa nenačítavajú"

- Skontrolovať WooCommerce API credentials
- Overenie permissions (Read/Write)

---

## 📞 Support

**V prípade problémov:**

1. **Check logs**: `pm2 logs zpoledomu`
2. **Test APIs manually**: Použiť curl commands vyššie
3. **Restart services**: `pm2 restart zpoledomu`
4. **Check environment**: `pm2 env zpoledomu`

---

## 🎯 Výsledok

Po dokončení budete mať:

- ✅ **Plne funkčnú driver aplikáciu**
- ✅ **Real-time WooCommerce integráciu**
- ✅ **Automatické SMS notifikácie**
- ✅ **Google Maps optimalizáciu trás**
- ✅ **HTTPS security**
- ✅ **Mobile PWA support**

**Estimated deployment time**: 15-30 minút ⚡

🚀 **Aplikácia pripravená na produkčné používanie!**
