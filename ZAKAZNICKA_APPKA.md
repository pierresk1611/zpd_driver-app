# 🛒 ZÁKAZNÍCKA APLIKÁCIA - Zpoledomu

## 📱 Prehľad funkcionalít

Kompletná zákaznícka aplikácia pre e-shop s čerstvými produktmi z farmy, s plnou integráciou do WooCommerce.

### ✅ **Implementované funkcie:**

🔐 **Prihlásenie zákazníka**

- Prihlásenie emailom a heslom
- Automatické načítanie profilu a adries
- Možnosť registrácie nových zákazníkov

🛍️ **E-shop produktov**

- Zobrazenie všetkých produktov z WooCommerce
- Vyhľadávanie a filtrovanie podľa kategórií
- Hodnotenia a recenzie produktov
- Informácie o farmároch a jednotkách
- Označenie zliav a skladových zásob

🛒 **Nákupný košík**

- Pridávanie produktov do košíka
- Úprava množstva položiek
- Odstránenie položiek z košíka
- Výpočet celkovej sumy
- Perzistentný košík (localStorage)

💳 **Objednávkový proces**

- Výber času doručenia (09:00-12:00, 12:00-15:00, 15:00-18:00)
- Poznámky k objednávke
- Výber spôsobu platby (karta / hotovosť)
- Potvrdenie dodacej adresy
- Vytvorenie objednávky v WooCommerce

📦 **Prehľad objednávok**

- História všetkých objednávok zákazníka
- Real-time sledovanie statusu doručenia
- Detail položiek v objednávke
- Estimated delivery time pre aktívne doručenia

---

## 🎯 **URL adresy aplikácie:**

- `zpoledomu.cz/driverapp/shop` - Zákaznícka aplikácia
- `zpoledomu.cz/driverapp/obchod` - Česká verzia
- `zpoledomu.cz/driverapp/customer` - Anglická verzia

---

## 🏗️ **Architektúra aplikácie**

### **Frontend komponenty:**

```
client/pages/CustomerApp.tsx - Hlavná zákaznícka aplikácia
├── Prihlásenie zákazníka
├── Tab: Obchod (produkty)
├── Tab: Košík (cart management)
├── Tab: Moje objednávky
└── Checkout modal
```

### **Backend API endpointy:**

```
api/products.php - Produkty z WooCommerce
api/customer-orders.php - Zákaznícke objednávky
```

---

## 💻 **Používanie aplikácie**

### **1. Prihlásenie zákazníka**

```tsx
// Mock prihlásenie (pre testovanie)
const mockCustomer = {
  id: "1",
  email: "jan@novak.cz",
  firstName: "Jan",
  lastName: "Novák",
  phone: "+420 601 111 222",
  address: {
    street: "Wenceslas Square 1",
    city: "Praha",
    postalCode: "110 00",
  },
};
```

### **2. Zobrazenie produktov**

Produkty sa načítajú z WooCommerce API s týmito informáciami:

- Názov a popis
- Cena a zľavová cena
- Obrázky produktov
- Kategória (zelenina, med, ovocie)
- Farmár (custom meta field)
- Jednotka (kg, ks, l)
- Skladové zásoby
- Hodnotenia zákazníkov

### **3. Nákupný košík**

```tsx
// Pridanie do košíka
const addToCart = (product: Product) => {
  // Kontrola skladových zásob
  if (!product.inStock) return;

  // Aktualizácia košíka
  setCart(newCart);
  saveCartToStorage(newCart);
};

// Výpočet celkovej sumy
const getCartTotal = () => {
  return cart.reduce((total, item) => {
    const price = item.product.salePrice || item.product.price;
    return total + price * item.quantity;
  }, 0);
};
```

### **4. Checkout proces**

```tsx
const checkoutData = {
  deliveryTime: "09:00-12:00", // Povinné
  notes: "Poznámka k objednávke", // Voliteľné
  paymentMethod: "card" | "cash", // Karta alebo hotovosť
};
```

### **5. Sledovanie objednávok**

Statusy objednávok:

- `pending` - Čakajúca na spracovanie
- `processing` - Spracováva sa
- `on-route` - Na cestě k zákazníkovi
- `delivered` - Doručená
- `cancelled` - Zrušená

---

## 🔧 **Integrácia s WooCommerce**

### **Produkty (GET /api/products)**

```php
// Načítanie produktov z WooCommerce
$products = wc_get_products([
    'status' => 'publish',
    'limit' => -1,
    'meta_query' => [
        [
            'key' => '_stock_status',
            'value' => 'instock',
            'compare' => '='
        ]
    ]
]);

// Custom meta polia
$farmer = get_post_meta($product->get_id(), '_farmer_name', true);
$unit = get_post_meta($product->get_id(), '_unit', true);
```

### **Objednávky (POST /api/orders)**

```php
// Vytvorenie WooCommerce objednávky
$order = wc_create_order();
$order->set_customer_id($customer_id);

// Pridanie produktov
foreach ($items as $item) {
    $product = wc_get_product($item['product']['id']);
    $order->add_product($product, $item['quantity']);
}

// Custom meta polia
$order->update_meta_data('_delivery_time', $deliveryTime);
$order->update_meta_data('_assigned_driver_id', '1');
```

### **História objednávok (GET /api/customers/{id}/orders)**

```php
// Načítanie objednávok zákazníka
$orders = wc_get_orders([
    'customer_id' => $customer_id,
    'limit' => -1,
    'orderby' => 'date',
    'order' => 'DESC'
]);
```

---

## 🎨 **UI/UX funkcie**

### **Responzívny design**

- Mobile-first prístup
- Optimalizované pre dotyková zariadenia
- Rýchle načítanie na pomalých sieťach

### **Real-time aktualizácie**

- Live sledovanie stavu objednávky
- Automatické obnovenie košíka
- Push notifikácie o doručení (budúca funkcia)

### **Accessibility**

- Klavesová navigácia
- Screen reader podpora
- Vysoký kontrast pre lepšiu čitateľnosť

---

## 📊 **Štatistiky a Analytics**

### **Metriky zákazníkov:**

- Počet aktívnych objednávok
- Najobľúbenejšie produkty
- Priemerná hodnota košíka
- Frekvencia objednávok

### **Metriky produktov:**

- Najpredávanejšie položky
- Hodnotenia a recenzie
- Skladové zásoby
- Sezónne trendy

---

## 🔄 **Synchronizácia s Driver App**

Zákaznícka aplikácia je plne synchronizovaná s aplikáciou pre vodičov:

1. **Nová objednávka** → Automaticky priradená vodičovi
2. **Status "Na cestě"** → SMS notifikácia zákazníkovi
3. **Doručenie** → Aktualizácia v zákazníckej aplikácii
4. **Zdržanie** → Real-time info o novom čase doručenia

---

## 🚀 **Nasadenie**

### **1. Upload súborov**

```bash
# Pridanie do existujúcej aplikácie
cp client/pages/CustomerApp.tsx /path/to/app/
cp api/products.php /path/to/wordpress/
cp api/customer-orders.php /path/to/wordpress/
```

### **2. WordPress konfigurácia**

**Pridať do functions.php:**

```php
// Custom meta polia pre produkty
add_action('woocommerce_product_options_general_product_data', 'add_custom_fields');
function add_custom_fields() {
    woocommerce_wp_text_input([
        'id' => '_farmer_name',
        'label' => 'Názov farmára'
    ]);

    woocommerce_wp_select([
        'id' => '_unit',
        'label' => 'Jednotka',
        'options' => [
            'ks' => 'Kus',
            'kg' => 'Kilogram',
            'l' => 'Liter'
        ]
    ]);
}

// Uloženie custom polí
add_action('woocommerce_process_product_meta', 'save_custom_fields');
function save_custom_fields($post_id) {
    update_post_meta($post_id, '_farmer_name', $_POST['_farmer_name']);
    update_post_meta($post_id, '_unit', $_POST['_unit']);
}
```

### **3. Testovanie**

```bash
# Test produktov
curl https://zpoledomu.cz/api/products

# Test objednávok
curl https://zpoledomu.cz/api/customers/1/orders

# Test vytvorenia objednávky
curl -X POST https://zpoledomu.cz/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customerId":"1","items":[...]}'
```

---

## 🎉 **Výsledok**

**Kompletný e-commerce systém s:**

✅ **Driver App** - `/` (vodiči)
✅ **Admin Panel** - `/admin` (administrácia)  
✅ **Customer App** - `/shop` (zákazníci)
✅ **Setup Page** - `/setup` (konfigurácia)

**Všetky aplikácie sú plne integrované a synchronizované cez WooCommerce!** 🚚🛒

**URL adresy:**

- `zpoledomu.cz/driverapp/` - Vodiči
- `zpoledomu.cz/driverapp/shop` - Zákazníci
- `zpoledomu.cz/driverapp/admin` - Admin
- `zpoledomu.cz/driverapp/setup` - Konfigurácia
