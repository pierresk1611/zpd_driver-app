<?php
/**
 * Plugin Name: Zpoledomu Driver App
 * Description: Driver application for Zpoledomu delivery service
 * Version: 1.0.0
 * Author: Zpoledomu Team
 */

if (!defined('ABSPATH')) exit;

class ZpoledomuDriver {
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_shortcode('zpoledomu_driver', array($this, 'render_app'));
        add_action('wp_ajax_zpoledomu_orders', array($this, 'get_orders'));
        add_action('wp_ajax_zpoledomu_update', array($this, 'update_order'));
    }

    public function init() {
        add_rewrite_rule('^driver-app/?$', 'index.php?zpoledomu=driver', 'top');
        add_filter('query_vars', function($vars) {
            $vars[] = 'zpoledomu';
            return $vars;
        });
        
        if (get_query_var('zpoledomu') === 'driver') {
            $this->render_full_page();
            exit;
        }
    }

    public function get_orders() {
        if (!current_user_can('read')) wp_die('No permission');
        
        $orders = wc_get_orders(array(
            'status' => array('processing', 'on-hold'),
            'date_created' => date('Y-m-d'),
            'limit' => 20
        ));

        $result = array();
        foreach ($orders as $order) {
            $result[] = array(
                'id' => $order->get_id(),
                'customerName' => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
                'address' => $order->get_billing_address_1() . ', ' . $order->get_billing_city(),
                'phone' => $order->get_billing_phone(),
                'status' => $order->get_status(),
                'total' => $order->get_total(),
                'items' => $this->get_order_items($order)
            );
        }
        
        wp_send_json_success($result);
    }

    private function get_order_items($order) {
        $items = array();
        foreach ($order->get_items() as $item) {
            $items[] = array(
                'name' => $item->get_name(),
                'quantity' => $item->get_quantity(),
                'farmer' => get_post_meta($item->get_product_id(), '_farmer', true) ?: 'Zpoledomu'
            );
        }
        return $items;
    }

    public function update_order() {
        if (!current_user_can('edit_shop_orders')) wp_die('No permission');
        
        $order_id = intval($_POST['order_id']);
        $status = sanitize_text_field($_POST['status']);
        
        $order = wc_get_order($order_id);
        if ($order) {
            $wc_status = ($status === 'delivered') ? 'completed' : 'processing';
            $order->update_status($wc_status);
            $order->add_order_note('Status updated by driver: ' . wp_get_current_user()->display_name);
            wp_send_json_success('Updated');
        }
        wp_send_json_error('Order not found');
    }

    public function render_full_page() {
        ?><!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zpoledomu Driver App</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: ui-sans-serif, system-ui, sans-serif;
            background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
            min-height: 100vh;
        }
        .header {
            background: #1a661a;
            color: white;
            padding: 16px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header-inner {
            max-width: 896px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo { display: flex; align-items: center; gap: 12px; }
        .logo-icon { 
            background: rgba(250,250,250,0.2);
            border-radius: 8px;
            padding: 8px;
            font-size: 20px;
        }
        .container {
            max-width: 896px;
            margin: 0 auto;
            padding: 24px 16px;
        }
        .order-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin: 15px 0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .order-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 15px;
        }
        .customer h3 { margin: 0 0 8px 0; }
        .customer-details {
            display: flex;
            gap: 16px;
            font-size: 14px;
            color: #666;
            flex-wrap: wrap;
        }
        .status-badge {
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
        }
        .status-processing { background: #fef3c7; color: #92400e; }
        .status-on-hold { background: #dbeafe; color: #1e40af; }
        .status-completed { background: #d1fae5; color: #065f46; }
        .items h4 { margin: 0 0 8px 0; }
        .item {
            background: #f9f9f9;
            padding: 10px;
            border-radius: 6px;
            margin: 4px 0;
            font-size: 14px;
        }
        .actions {
            display: flex;
            gap: 8px;
            margin-top: 16px;
            flex-wrap: wrap;
        }
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.15s;
        }
        .btn-primary { background: #1a661a; color: white; }
        .btn-success { background: #22c55e; color: white; }
        .btn-secondary { background: #6b7280; color: white; }
        .loading { opacity: 0.6; pointer-events: none; }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-inner">
            <div class="logo">
                <div class="logo-icon">🥕</div>
                <div>
                    <h1>Zpoledomu</h1>
                    <p style="font-size: 14px; opacity: 0.8;">Aplikace pro vodiče</p>
                </div>
            </div>
            <div>👤 <?php echo wp_get_current_user()->display_name ?: 'Jan Novák'; ?></div>
        </div>
    </div>

    <div class="container">
        <h2>Dnešní objednávky</h2>
        <p id="stats" style="color: #666; margin-bottom: 20px;">Načítání...</p>
        <div id="orders"></div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', loadOrders);

        function loadOrders() {
            fetch('<?php echo admin_url('admin-ajax.php'); ?>', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'action=zpoledomu_orders'
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    displayOrders(data.data);
                    document.getElementById('stats').textContent = 
                        `${data.data.length} objednávek • ${data.data.filter(o => o.status === 'completed').length} dokončených`;
                }
            });
        }

        function displayOrders(orders) {
            const container = document.getElementById('orders');
            
            if (orders.length === 0) {
                container.innerHTML = '<div class="order-card"><p>Žádné objednávky pro dnešní den.</p></div>';
                return;
            }

            container.innerHTML = orders.map(order => `
                <div class="order-card" id="order-${order.id}">
                    <div class="order-header">
                        <div class="customer">
                            <h3>👤 ${order.customerName}</h3>
                            <div class="customer-details">
                                <div>📍 ${order.address}</div>
                                <div>📞 ${order.phone}</div>
                                <div>💰 ${order.total} Kč</div>
                            </div>
                        </div>
                        <span class="status-badge status-${order.status}">
                            ${getStatusText(order.status)}
                        </span>
                    </div>

                    <div class="items">
                        <h4>📦 Produkty:</h4>
                        ${order.items.map(item => `
                            <div class="item">
                                <strong>${item.quantity}x ${item.name}</strong>
                                <span style="color: #666;"> • ${item.farmer}</span>
                            </div>
                        `).join('')}
                    </div>

                    <div class="actions">
                        ${order.status !== 'completed' ? `
                            <button class="btn btn-success" onclick="updateStatus(${order.id}, 'delivered')">
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
            const map = {
                'processing': 'Zpracovává se',
                'on-hold': 'Čekající',
                'completed': 'Dokončeno'
            };
            return map[status] || status;
        }

        function updateStatus(orderId, status) {
            const card = document.getElementById(`order-${orderId}`);
            card.classList.add('loading');

            fetch('<?php echo admin_url('admin-ajax.php'); ?>', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `action=zpoledomu_update&order_id=${orderId}&status=${status}`
            })
            .then(r => r.json())
            .then(data => {
                card.classList.remove('loading');
                if (data.success) {
                    loadOrders();
                    alert('Status byl aktualizován!');
                } else {
                    alert('Chyba: ' + data.data);
                }
            });
        }

        function callCustomer(phone) {
            window.open(`tel:${phone}`);
        }

        function navigate(address) {
            const url = `https://maps.google.com/maps?q=${encodeURIComponent(address)}`;
            window.open(url, '_blank');
        }

        setInterval(loadOrders, 120000); // Auto-refresh každé 2 minúty
    </script>
</body>
</html><?php
    }

    public function render_app() {
        if (!current_user_can('read')) return 'Nemáte oprávnění.';
        
        return '<div style="text-align: center; padding: 20px; background: #f0fdf4; border-radius: 10px;">
            <h3>🥕 Zpoledomu Driver App</h3>
            <p>Pre plnú funkcionalitu navštívte: <a href="/driver-app/">Driver App</a></p>
        </div>';
    }
}

new ZpoledomuDriver();

register_activation_hook(__FILE__, function() {
    flush_rewrite_rules();
});

register_deactivation_hook(__FILE__, function() {
    flush_rewrite_rules();
});

?>
