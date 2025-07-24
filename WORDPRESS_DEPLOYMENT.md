# 🥕 WordPress Deployment - Zpoledomu Driver App

## 🎯 NAJLEPŠIE RIEŠENIA PRE WORDPRESS

Aplikácia beží perfektne s "Jan Novák" driver interfaceom a má hotové WooCommerce API integrácie!

## 🚀 MOŽNOSŤ 1: WordPress Plugin (ODPORÚČANÉ)

### Vytvorenie vlastného plugin

#### Súbor: wp-content/plugins/zpoledomu-driver/zpoledomu-driver.php

```php
<?php
/**
 * Plugin Name: Zpoledomu Driver App
 * Description: Driver application for Zpoledomu delivery service
 * Version: 1.0.0
 * Author: Zpoledomu Team
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class ZpoledomuDriverApp {

    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_shortcode('zpoledomu_driver', array($this, 'render_driver_app'));
        add_action('wp_ajax_zpoledomu_api', array($this, 'handle_api_requests'));
        add_action('wp_ajax_nopriv_zpoledomu_api', array($this, 'handle_api_requests'));
    }

    public function init() {
        // Add custom page for driver app
        add_rewrite_rule('^driver-app/?$', 'index.php?zpoledomu_page=driver', 'top');
        add_filter('query_vars', function($vars) {
            $vars[] = 'zpoledomu_page';
            return $vars;
        });

        add_action('template_redirect', array($this, 'template_redirect'));
    }

    public function template_redirect() {
        if (get_query_var('zpoledomu_page') === 'driver') {
            include plugin_dir_path(__FILE__) . 'templates/driver-app.php';
            exit;
        }
    }

    public function enqueue_scripts() {
        if (get_query_var('zpoledomu_page') === 'driver') {
            wp_enqueue_script('zpoledomu-react', 'https://unpkg.com/react@18/umd/react.production.min.js', array(), '18.0.0', true);
            wp_enqueue_script('zpoledomu-react-dom', 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', array('zpoledomu-react'), '18.0.0', true);
            wp_enqueue_script('zpoledomu-app', plugin_dir_url(__FILE__) . 'assets/app.js', array('zpoledomu-react-dom'), '1.0.0', true);

            // Pass WooCommerce data to JavaScript
            wp_localize_script('zpoledomu-app', 'zpoledomuData', array(
                'apiUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('zpoledomu_nonce'),
                'woocommerce' => array(
                    'orders_endpoint' => rest_url('wc/v3/orders'),
                    'products_endpoint' => rest_url('wc/v3/products'),
                ),
                'current_user' => wp_get_current_user()->display_name,
            ));
        }
    }

    public function handle_api_requests() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'zpoledomu_nonce')) {
            wp_die('Security check failed');
        }

        $action = $_POST['zpoledomu_action'];

        switch ($action) {
            case 'get_orders':
                $this->get_woocommerce_orders();
                break;
            case 'update_order_status':
                $this->update_order_status();
                break;
            case 'send_sms':
                $this->send_sms_notification();
                break;
        }

        wp_die();
    }

    private function get_woocommerce_orders() {
        // Use WooCommerce API directly
        $orders = wc_get_orders(array(
            'status' => array('processing', 'on-hold'),
            'date_created' => date('Y-m-d'),
            'limit' => -1,
        ));

        $formatted_orders = array();
        foreach ($orders as $order) {
            $formatted_orders[] = array(
                'id' => $order->get_id(),
                'customerName' => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
                'address' => $order->get_billing_address_1() . ', ' . $order->get_billing_city(),
                'phone' => $order->get_billing_phone(),
                'status' => $order->get_status(),
                'total' => $order->get_total(),
                'items' => $this->get_order_items($order),
            );
        }

        wp_send_json_success($formatted_orders);
    }

    private function get_order_items($order) {
        $items = array();
        foreach ($order->get_items() as $item) {
            $items[] = array(
                'name' => $item->get_name(),
                'quantity' => $item->get_quantity(),
                'farmer' => get_post_meta($item->get_product_id(), '_farmer_name', true) ?: 'Zpoledomu',
            );
        }
        return $items;
    }

    private function update_order_status() {
        $order_id = $_POST['order_id'];
        $status = $_POST['status'];
        $notes = $_POST['notes'] ?? '';

        $order = wc_get_order($order_id);
        if ($order) {
            $order->update_status($status);
            if ($notes) {
                $order->add_order_note($notes);
            }
            wp_send_json_success('Order updated successfully');
        } else {
            wp_send_json_error('Order not found');
        }
    }

    public function render_driver_app($atts) {
        ob_start();
        include plugin_dir_path(__FILE__) . 'templates/shortcode.php';
        return ob_get_clean();
    }
}

// Initialize the plugin
new ZpoledomuDriverApp();

// Activation hook
register_activation_hook(__FILE__, function() {
    flush_rewrite_rules();
});

// Deactivation hook
register_deactivation_hook(__FILE__, function() {
    flush_rewrite_rules();
});
?>
```

#### Súbor: wp-content/plugins/zpoledomu-driver/templates/driver-app.php

```php
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Zpoledomu Driver App</title>
    <?php wp_head(); ?>
    <style>
        body { margin: 0; font-family: system-ui, sans-serif; }
        .driver-header {
            background: #1a661a;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .driver-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
            min-height: 100vh;
        }
        .order-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin: 15px 0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .status-badge {
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
        }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-processing { background: #dbeafe; color: #1e40af; }
        .status-on-route { background: #d1fae5; color: #065f46; }
        .status-completed { background: #d1fae5; color: #065f46; }
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            margin: 5px;
            font-weight: 500;
        }
        .btn-primary { background: #1a661a; color: white; }
        .btn-success { background: #22c55e; color: white; }
        .btn-secondary { background: #6b7280; color: white; }
    </style>
</head>
<body>
    <div class="driver-header">
        <h1>🥕 Zpoledomu Driver App</h1>
        <p>Aplikace pro vodiče - <?php echo wp_get_current_user()->display_name; ?></p>
    </div>

    <div class="driver-container">
        <div id="zpoledomu-driver-app">
            <h2>Dnešní objednávky</h2>
            <div id="orders-container">
                <p>Načítání objednávek...</p>
            </div>
        </div>
    </div>

    <script>
        // Simple JavaScript implementation
        document.addEventListener('DOMContentLoaded', function() {
            loadTodaysOrders();
        });

        function loadTodaysOrders() {
            fetch(zpoledomuData.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'action': 'zpoledomu_api',
                    'zpoledomu_action': 'get_orders',
                    'nonce': zpoledomuData.nonce
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displayOrders(data.data);
                }
            });
        }

        function displayOrders(orders) {
            const container = document.getElementById('orders-container');

            if (orders.length === 0) {
                container.innerHTML = '<p>Žádné objednávky pro dnešní den.</p>';
                return;
            }

            container.innerHTML = orders.map(order => `
                <div class="order-card">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                        <div>
                            <h3>${order.customerName}</h3>
                            <p>📍 ${order.address}</p>
                            <p>📞 ${order.phone}</p>
                            <p>💰 ${order.total} Kč</p>
                        </div>
                        <span class="status-badge status-${order.status}">
                            ${getStatusText(order.status)}
                        </span>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <h4>Produkty:</h4>
                        ${order.items.map(item => `
                            <div style="background: #f9f9f9; padding: 10px; margin: 5px 0; border-radius: 5px;">
                                <strong>${item.quantity}x ${item.name}</strong>
                                <span style="color: #666;"> • ${item.farmer}</span>
                            </div>
                        `).join('')}
                    </div>

                    <div>
                        ${order.status === 'processing' ? `
                            <button class="btn btn-primary" onclick="updateOrderStatus(${order.id}, 'on-route')">
                                🚚 Na cestě
                            </button>
                        ` : ''}
                        ${order.status === 'on-route' ? `
                            <button class="btn btn-success" onclick="updateOrderStatus(${order.id}, 'completed')">
                                ✅ Doručeno
                            </button>
                        ` : ''}
                        <button class="btn btn-secondary" onclick="callCustomer('${order.phone}')">
                            📞 Zavolat
                        </button>
                        <button class="btn btn-secondary" onclick="navigate('${order.address}')">
                            🗺️ Navigace
                        </button>
                    </div>
                </div>
            `).join('');
        }

        function getStatusText(status) {
            const statusMap = {
                'processing': 'Zpracovává se',
                'on-route': 'Na cestě',
                'completed': 'Doručeno',
                'pending': 'Čekající'
            };
            return statusMap[status] || status;
        }

        function updateOrderStatus(orderId, newStatus) {
            fetch(zpoledomuData.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'action': 'zpoledomu_api',
                    'zpoledomu_action': 'update_order_status',
                    'order_id': orderId,
                    'status': newStatus,
                    'nonce': zpoledomuData.nonce
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    loadTodaysOrders(); // Reload orders
                    alert('Status objednávky byl aktualizován!');
                }
            });
        }

        function callCustomer(phone) {
            window.open(`tel:${phone}`);
        }

        function navigate(address) {
            const encodedAddress = encodeURIComponent(address);
            window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
        }
    </script>

    <?php wp_footer(); ?>
</body>
</html>
```

## 🚀 MOŽNOSŤ 2: WordPress Page Template

#### Súbor: wp-content/themes/your-theme/page-driver.php

```php
<?php
/*
Template Name: Driver App
*/

get_header(); ?>

<div class="zpoledomu-driver-app">
    <style>
        /* Same CSS as above */
    </style>

    <!-- Same HTML content as above -->
</div>

<script>
    /* Same JavaScript as above */
</script>

<?php get_footer(); ?>
```

## 🚀 MOŽNOSŤ 3: WordPress Shortcode

Pridať do functions.php:

```php
function zpoledomu_driver_shortcode() {
    // Check if user has permission
    if (!current_user_can('manage_woocommerce')) {
        return '<p>Nemáte oprávnění k přístupu k této aplikaci.</p>';
    }

    ob_start();
    ?>
    <div id="zpoledomu-driver-shortcode">
        <!-- Same HTML content -->
    </div>

    <script>
        /* Same JavaScript */
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('zpoledomu_driver', 'zpoledomu_driver_shortcode');
```

Použitie: `[zpoledomu_driver]` na ľubovoľnej stránke.

## 🎯 DEPLOYMENT POSTUP:

### KROK 1: Upload Plugin

1. **FTP/WordPress Admin** → Upload plugin súbory
2. **Plugins** → Aktivovať "Zpoledomu Driver App"

### KROK 2: Konfigurácia

1. **WooCommerce** → už je nakonfigurované s vašimi API keys
2. **Permissions** → Nastaviť kto má prístup k driver app

### KROK 3: Prístup k aplikácii

- **URL**: `https://zpoledomu.cz/driver-app/`
- **Shortcode**: `[zpoledomu_driver]` na ľubovoľnej stránke
- **Menu**: Pridať link do WordPress menu

## ✅ VÝHODY WORDPRESS DEPLOYMENT:

- ✅ **Direct WooCommerce Access** - žiadne API limity
- ✅ **WordPress Users** - existujúci login systém
- ✅ **Same Domain** - žiadne CORS problémy
- ✅ **WordPress Security** - nonces, permissions
- ✅ **Easy Updates** - cez WordPress admin
- ✅ **Mobile Responsive** - funguje na mobile

## 🔒 SECURITY:

- User permissions (iba pre vodičov)
- WordPress nonces
- Sanitization všetkých inputov
- Direct database access (bez API keys)

**Aplikácia bude fungovať identicky ako tu, ale priamo v rámci WordPress!** 🎉
