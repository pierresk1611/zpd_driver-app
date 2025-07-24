# 🚀 Nasadenie Zpoledomu do WordPress

## 📋 Prehľad nasadenia

Aplikácia Zpoledomu bude nasadená ako **samostatná React aplikácia** v podpriečinku vášho WordPress servera, s plnou integráciou cez WooCommerce API.

---

## 🛠️ Krok 1: Príprava aplikácie na produkciu

### 1.1 Build aplikácie na lokálnom počítači

```bash
# 1. Navigujte do priečinka aplikácie
cd zpoledomu-app

# 2. Nainštalujte závislosti (ak ešte nie sú)
npm install

# 3. Vytvorte production build
npm run build
```

Po dokončení sa vytvorí priečinok `dist/` s built aplikáciou.

### 1.2 Štruktúra built aplikácie

```
dist/
├── index.html          # Hlavná HTML stránka
├── assets/
│   ├── index-[hash].js    # JavaScript bundle
│   ├── index-[hash].css   # CSS štýly
│   └── ...
└── vite.svg           # Favicon a iné assets
```

---

## 📂 Krok 2: Upload na WordPress server

### 2.1 Vytvorenie priečinka na serveri

**Cez FTP/cPanel File Manager:**

```
1. Prihlásenie do cPanel alebo FTP
2. Navigácia do public_html/
3. Vytvorenie nového priečinka: "driver-app"
4. Finálna cesta: /public_html/driver-app/
```

### 2.2 Upload súborov

**Upload všetkých súborov z `dist/` priečinka:**

```
zpoledomu.cz/driver-app/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── vite.svg
```

**Adresa aplikácie:** `https://zpoledomu.cz/driver-app/`

---

## ⚙️ Krok 3: Konfigurácia backend servera

### 3.1 Vytvorenie API endpoint súborov

V priečinku `/public_html/driver-app/` vytvorte:

**`api/index.php`** (Hlavný API handler):

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../../../../wp-config.php';
require_once '../../../../wp-load.php';

// API Router
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$path = str_replace('/driver-app/api', '', $path);

switch ($path) {
    case '/health':
        echo json_encode(['success' => true, 'message' => 'API is working']);
        break;

    case '/orders/today':
        include 'endpoints/orders.php';
        break;

    case '/drivers':
        include 'endpoints/drivers.php';
        break;

    case '/farmers':
        include 'endpoints/farmers.php';
        break;

    case '/config':
        include 'endpoints/config.php';
        break;

    default:
        if (strpos($path, '/orders/') === 0 && strpos($path, '/status') !== false) {
            include 'endpoints/order-status.php';
        } else if (strpos($path, '/routes/optimize') === 0) {
            include 'endpoints/routes.php';
        } else if (strpos($path, '/notifications/') === 0) {
            include 'endpoints/notifications.php';
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
        }
        break;
}
?>
```

### 3.2 Vytvorenie endpoint súborov

**`api/endpoints/orders.php`** (WooCommerce objednávky):

```php
<?php
// Získanie dnešných objednávok z WooCommerce
$today = date('Y-m-d');

$orders = wc_get_orders([
    'status' => ['processing', 'on-hold', 'pending'],
    'date_created' => $today,
    'limit' => -1
]);

$formatted_orders = [];

foreach ($orders as $order) {
    $order_data = $order->get_data();
    $items = [];

    foreach ($order->get_items() as $item) {
        $product = $item->get_product();
        $items[] = [
            'name' => $item->get_name(),
            'quantity' => $item->get_quantity(),
            'farmer' => get_post_meta($product->get_id(), '_farmer_name', true) ?: 'Neznámy farmár'
        ];
    }

    // Mapovanie WordPress meta dát na driver_id
    $assigned_driver = get_post_meta($order->get_id(), '_assigned_driver_id', true) ?: '1';

    $formatted_orders[] = [
        'id' => (string)$order->get_id(),
        'customerName' => $order_data['billing']['first_name'] . ' ' . $order_data['billing']['last_name'],
        'address' => $order_data['billing']['address_1'] . ', ' . $order_data['billing']['city'],
        'postalCode' => $order_data['billing']['postcode'],
        'phone' => $order_data['billing']['phone'],
        'deliveryTime' => get_post_meta($order->get_id(), '_delivery_time', true) ?: '09:00-18:00',
        'status' => 'pending',
        'items' => $items,
        'assignedDriverId' => $assigned_driver,
        'notes' => $order->get_customer_note()
    ];
}

echo json_encode([
    'success' => true,
    'orders' => $formatted_orders,
    'count' => count($formatted_orders)
]);
?>
```

**`api/endpoints/drivers.php`** (Správa vodičov):

```php
<?php
// Môžete uložiť vodičov do WordPress options alebo custom post type
$drivers = get_option('zpoledomu_drivers', [
    [
        'id' => '1',
        'name' => 'Jan Novák',
        'phone' => '+420 601 111 222',
        'email' => 'jan.novak@zpoledomu.cz',
        'isActive' => true,
        'assignedPostalCodes' => ['110', '111', '120', '121']
    ],
    [
        'id' => '2',
        'name' => 'Petr Svoboda',
        'phone' => '+420 602 333 444',
        'email' => 'petr.svoboda@zpoledomu.cz',
        'isActive' => true,
        'assignedPostalCodes' => ['130', '131', '140', '141']
    ],
    [
        'id' => '3',
        'name' => 'Marie Krásná',
        'phone' => '+420 603 555 666',
        'email' => 'marie.krasna@zpoledomu.cz',
        'isActive' => false,
        'assignedPostalCodes' => ['150', '151']
    ]
]);

echo json_encode([
    'success' => true,
    'drivers' => $drivers
]);
?>
```

**`api/endpoints/config.php`** (Konfigurácia):

```php
<?php
$config = [
    'woocommerceEnabled' => defined('WC_VERSION'),
    'smsEnabled' => !empty(get_option('twilio_account_sid')),
    'whatsappEnabled' => !empty(get_option('whatsapp_api_key')),
    'mapsEnabled' => !empty(get_option('google_maps_api_key'))
];

echo json_encode([
    'success' => true,
    'config' => $config
]);
?>
```

### 3.3 Vytvorenie .htaccess pre API routing

**`api/.htaccess`**:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
```

---

## 🔧 Krok 4: WordPress konfigurácia

### 4.1 Pridanie environment variables do wp-config.php

**Editujte `wp-config.php`** a pridajte:

```php
// Zpoledomu Driver App Configuration
define('WOOCOMMERCE_KEY', 'ck_your_consumer_key_here');
define('WOOCOMMERCE_SECRET', 'cs_your_consumer_secret_here');
define('GOOGLE_MAPS_API_KEY', 'your_google_maps_api_key');
define('TWILIO_ACCOUNT_SID', 'your_twilio_account_sid');
define('TWILIO_AUTH_TOKEN', 'your_twilio_auth_token');
define('TWILIO_FROM_NUMBER', '+420123456789');
```

### 4.2 Vytvorenie WooCommerce API kľúčov

```
1. Prihlásenie do WordPress Admin (zpoledomu.cz/wp-admin)
2. WooCommerce → Settings → Advanced → REST API
3. "Add key" button
4. Description: "Zpoledomu Driver App"
5. User: Admin user
6. Permissions: Read/Write
7. Generate API key
8. Skopírujte Consumer key a Consumer secret do wp-config.php
```

### 4.3 Pridanie custom meta polí do WooCommerce

**Pridajte do `functions.php` vašej témy:**

```php
// Custom meta fields pre Zpoledomu
add_action('woocommerce_product_options_general_product_data', 'zpoledomu_add_farmer_field');
function zpoledomu_add_farmer_field() {
    woocommerce_wp_text_input([
        'id' => '_farmer_name',
        'label' => 'Názov farmára',
        'desc_tip' => true,
        'description' => 'Zadajte názov farmára pre tento produkt'
    ]);
}

add_action('woocommerce_process_product_meta', 'zpoledomu_save_farmer_field');
function zpoledomu_save_farmer_field($post_id) {
    $farmer_name = $_POST['_farmer_name'] ?? '';
    update_post_meta($post_id, '_farmer_name', sanitize_text_field($farmer_name));
}

// Delivery time pre objednávky
add_action('woocommerce_admin_order_data_after_shipping_address', 'zpoledomu_add_delivery_time_field');
function zpoledomu_add_delivery_time_field($order) {
    echo '<div class="address"><p><strong>Čas doručenia:</strong>';
    woocommerce_form_field('_delivery_time', [
        'type' => 'select',
        'options' => [
            '09:00-12:00' => '09:00-12:00',
            '12:00-15:00' => '12:00-15:00',
            '15:00-18:00' => '15:00-18:00'
        ]
    ], get_post_meta($order->get_id(), '_delivery_time', true));
    echo '</p></div>';
}
```

---

## 🔒 Krok 5: Zabezpečenie a oprávnenia

### 5.1 Vytvorenie .htaccess v root aplikácie

**`/public_html/driver-app/.htaccess`**:

```apache
# Zabezpečenie pred direct access k PHP súborom
<Files "*.php">
    Order Allow,Deny
    Allow from all
</Files>

# Cache headers pre statické súbory
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>

# Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Fallback pre React Router
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /driver-app/
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /driver-app/index.html [L]
</IfModule>
```

---

## 🧪 Krok 6: Testovanie nasadenia

### 6.1 Kontrola URL adries

```
✅ Hlavná aplikácia: https://zpoledomu.cz/driver-app/
✅ Admin panel: https://zpoledomu.cz/driver-app/admin
✅ Setup stránka: https://zpoledomu.cz/driver-app/setup
✅ API endpoint: https://zpoledomu.cz/driver-app/api/health
```

### 6.2 Test API endpoints

**Test v prehliadači alebo cez curl:**

```bash
# Health check
curl https://zpoledomu.cz/driver-app/api/health

# Objednávky
curl https://zpoledomu.cz/driver-app/api/orders/today

# Vodiči
curl https://zpoledomu.cz/driver-app/api/drivers

# Konfigurácia
curl https://zpoledomu.cz/driver-app/api/config
```

### 6.3 Funkčný test aplikácie

1. **Otvorte aplikáciu:** `https://zpoledomu.cz/driver-app/`
2. **Prihlásenie vodiča:** Skúste prihlásiť ako Jan Novák
3. **Test objednávok:** Skontrolujte či sa načítajú objednávky z WooCommerce
4. **Admin panel:** `https://zpoledomu.cz/driver-app/admin` (admin/admin)
5. **Konfigurácia:** `https://zpoledomu.cz/driver-app/setup`

---

## 🚨 Riešenie problémov

### Problem 1: API endpoints nevracia dáta

**Riešenie:**

```bash
# Skontrolujte log súbory
tail -f /path/to/error.log

# Overte WooCommerce API kľúče
# Skontrolujte wp-config.php environment variables
```

### Problem 2: CORS errors

**Pridajte do `api/index.php`:**

```php
header('Access-Control-Allow-Origin: https://zpoledomu.cz');
header('Access-Control-Allow-Credentials: true');
```

### Problem 3: React Router nefunguje

**Skontrolujte `.htaccess` pravidlá a mod_rewrite na serveri.**

### Problem 4: Styling sa nenačíta

**Skontrolujte cesty k CSS súborom v `index.html` - musia byť relatívne.**

---

## 📱 Krok 7: Mobilná optimalizácia

### 7.1 PWA konfigurácia (voliteľné)

**Pridajte do `public_html/driver-app/`:**

**`manifest.json`:**

```json
{
  "name": "Zpoledomu Driver App",
  "short_name": "Zpoledomu",
  "description": "Aplikácia pre vodičov Zpoledomu",
  "start_url": "/driver-app/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#16a34a",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## ✅ Finálny checklist

- [ ] ✅ Aplikácia je uploadnutá do `/public_html/driver-app/`
- [ ] ✅ API endpoint súbory sú vytvorené
- [ ] ✅ WordPress má WooCommerce API kľúče
- [ ] ✅ Environment variables sú v wp-config.php
- [ ] ✅ Custom meta polia sú pridané do WooCommerce
- [ ] ✅ .htaccess súbory sú nastavené
- [ ] ✅ Všetky URL adresy fungują
- [ ] ✅ API endpoints vracia správne dáta
- [ ] ✅ Aplikácia sa úspešne pripája k WooCommerce
- [ ] ✅ Admin panel je funkčný (admin/admin)
- [ ] ✅ Setup stránka ukazuje správny stav konfigurácie

---

## 🎯 Výsledok

**Aplikácia bude dostupná na:**

- `https://zpoledomu.cz/driver-app/` - Pre vodičov
- `https://zpoledomu.cz/driver-app/admin` - Pre administrátorov
- `https://zpoledomu.cz/driver-app/setup` - Pre konfiguráciu

**S plnou integráciou do vášho WooCommerce obchodu!** 🚀
