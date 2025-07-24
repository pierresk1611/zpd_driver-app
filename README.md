# 🥕 Zpoledomu Driver App

**Komplexná aplikácia pre vodičov doručovania zeleniny s real-time integráciami**

## ✨ Features

- 🚚 **Driver Interface** - Intuitive dashboard pre vodičov
- 📦 **WooCommerce Integration** - Real-time objednávky a synchronizácia
- 🗺️ **Google Maps Integration** - Geocoding a optimalizácia trás
- 📱 **Twilio SMS** - Automatické notifikácie zákazníkom
- 📱 **PWA Support** - Mobile-first dizajn s offline support
- ⚡ **Real-time Updates** - Live tracking a status updates

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:8080
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔧 API Integrations

### WooCommerce

- Real-time objednávky z WordPress
- Automatická synchronizácia statusov
- Customer data integration

### Google Maps

- Geocoding adries
- Route optimization
- Distance calculations
- Multi-provider navigation (Waze, Google Maps, Mapy.cz)

### Twilio SMS

- Delivery notifications
- Delay notifications
- Completion confirmations
- Custom messaging

## 📱 Applications

### Driver App (`/`)

- Dashboard pre vodičov
- Order management
- Route optimization
- SMS notifications
- GPS tracking

### Customer App (`/shop`)

- E-commerce interface
- Product catalog
- Shopping cart
- Order history
- Loyalty system

### Admin Dashboard (`/admin`)

- Driver management
- Territory configuration
- Statistics & analytics
- System monitoring

## 🔑 Environment Variables

```bash
# WooCommerce API
WOOCOMMERCE_URL=https://zpoledomu.cz
WOOCOMMERCE_KEY=your_consumer_key
WOOCOMMERCE_SECRET=your_consumer_secret

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_key

# Twilio SMS
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+420123456789

# Application
NODE_ENV=production
PORT=3000
```

## 📦 Deployment

### Option 1: Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/zpoledomu-driver-app)

1. Click "Deploy to Vercel"
2. Add environment variables
3. Deploy automatically

### Option 2: Manual Deployment

```bash
# Build production version
npm run build

# Upload to your server
# Configure nginx + SSL
# Start with PM2

# See PRODUCTION_DEPLOYMENT.md for detailed instructions
```

### Option 3: Quick Deploy Script

```bash
# Run automated deployment
bash deploy.sh
```

## 📁 Project Structure

```
zpoledomu-driver-app/
├── client/                 # React frontend
│   ├── pages/             # Application pages
│   ├── components/        # Reusable components
│   └── global.css         # Tailwind styles
├── server/                # Express API server
│   ├── routes/           # API route handlers
│   ├── woocommerce-integration.ts
│   ├── google-maps-integration.ts
│   └── twilio-integration.ts
├── public/               # Static assets
├── dist/                 # Production build output
└── docs/                 # Documentation
```

## 🧪 Testing

```bash
# API Health Check
curl https://app.zpoledomu.cz/api/health

# WooCommerce Test
curl https://app.zpoledomu.cz/api/orders/today

# SMS Test
curl -X POST https://app.zpoledomu.cz/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{"to":"+420123456789","body":"Test message"}'
```

## 📊 Monitoring

- **Health endpoint**: `/api/health`
- **API logs**: Console logging with emojis
- **Error handling**: Comprehensive error boundaries
- **Performance**: Optimized bundle sizes

## 🔒 Security

- HTTPS enforcement
- API key protection
- Input validation
- CORS configuration
- Rate limiting

## 📖 Documentation

- [`PRODUCTION_DEPLOYMENT.md`](./PRODUCTION_DEPLOYMENT.md) - Kompletný production guide
- [`RYCHLE_NASADENIE.md`](./RYCHLE_NASADENIE.md) - Quick deployment (15-30 min)
- [`FINALNA_WOOCOMMERCE_INTEGRACIA.md`](./FINALNA_WOOCOMMERCE_INTEGRACIA.md) - WooCommerce setup
- [`FINALNA_GOOGLE_MAPS_INTEGRACIA.md`](./FINALNA_GOOGLE_MAPS_INTEGRACIA.md) - Google Maps setup
- [`FINALNA_TWILIO_INTEGRACIA.md`](./FINALNA_TWILIO_INTEGRACIA.md) - Twilio SMS setup

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/zpoledomu-driver-app/issues)
- **Email**: support@zpoledomu.cz
- **Documentation**: See `/docs` folder

---

**Built with ❤️ for Zpoledomu delivery team**

🥕 **Bringing fresh vegetables to every door!**
