<?php
// API endpoint pre zákaznícke objednávky
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Načítanie WordPress
require_once '../wp-config.php';
require_once '../wp-load.php';

// Overenie že WooCommerce existuje
if (!class_exists('WooCommerce')) {
    echo json_encode([
        'success' => false,
        'error' => 'WooCommerce nie je nainštalované'
    ]);
    exit;
}

try {
    // Získanie zákazníka (v skutočnej aplikácii by to prišlo z autentifikácie)
    $customer_email = $_GET['customer_email'] ?? 'jana.novakova@email.cz';
    
    // Získanie objednávok pre zákazníka
    $args = [
        'customer' => $customer_email,
        'limit' => 50,
        'orderby' => 'date',
        'order' => 'DESC'
    ];
    
    $orders = wc_get_orders($args);
    $formatted_orders = [];
    
    foreach ($orders as $order) {
        $order_data = $order->get_data();
        
        // Získanie položiek objednávky
        $items = [];
        foreach ($order->get_items() as $item_id => $item) {
            $product = $item->get_product();
            if ($product) {
                $items[] = [
                    'product' => [
                        'id' => (string)$product->get_id(),
                        'name' => $item->get_name(),
                        'description' => $product->get_short_description() ?: 'Kvalitný produkt',
                        'price' => (float)$product->get_price(),
                        'salePrice' => $product->is_on_sale() ? (float)$product->get_sale_price() : null,
                        'images' => $product->get_image_id() ? [wp_get_attachment_url($product->get_image_id())] : ['/placeholder.svg'],
                        'category' => 'Zelenina',
                        'unit' => get_post_meta($product->get_id(), '_unit', true) ?: 'ks',
                        'inStock' => $product->is_in_stock(),
                        'stockQuantity' => $product->get_stock_quantity() ?: 0,
                        'rating' => 4.5,
                        'reviews' => 0,
                    ],
                    'quantity' => $item->get_quantity()
                ];
            }
        }
        
        // Mapovanie statusov
        $status = 'new';
        switch ($order_data['status']) {
            case 'processing':
            case 'on-hold':
                $status = 'confirmed';
                break;
            case 'completed':
                $status = 'delivered';
                break;
            case 'cancelled':
                $status = 'cancelled';
                break;
        }
        
        // Overenie či je objednávka na ceste
        $driver_status = get_post_meta($order->get_id(), '_driver_status', true);
        if ($driver_status === 'on-route') {
            $status = 'on-route';
        }
        
        // Získanie delivery time
        $delivery_time = get_post_meta($order->get_id(), '_delivery_time', true) ?: '9:00-18:00';
        
        // Informácie o vodičovi
        $driver_name = get_post_meta($order->get_id(), '_driver_name', true) ?: null;
        $driver_phone = get_post_meta($order->get_id(), '_driver_phone', true) ?: null;
        
        // Odhadovaný čas doručenia
        $estimated_delivery = null;
        if ($status === 'on-route') {
            $estimated_delivery = date('H:i', strtotime('+30 minutes'));
        }
        
        $formatted_orders[] = [
            'id' => 'ORD-' . $order->get_id(),
            'date' => $order_data['date_created']->date('Y-m-d'),
            'status' => $status,
            'total' => (float)$order_data['total'],
            'items' => $items,
            'deliveryAddress' => sprintf('%s, %s %s', 
                $order_data['billing']['address_1'], 
                $order_data['billing']['city'], 
                $order_data['billing']['postcode']
            ),
            'deliveryTime' => $delivery_time,
            'estimatedDelivery' => $estimated_delivery,
            'driverName' => $driver_name,
            'driverPhone' => $driver_phone,
            'loyaltyPointsEarned' => floor($order_data['total'] / 10), // 1 bod za každých 10 Kč
        ];
    }
    
    echo json_encode([
        'success' => true,
        'orders' => $formatted_orders,
        'count' => count($formatted_orders)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Chyba pri načítaní objednávok: ' . $e->getMessage()
    ]);
}
?>
