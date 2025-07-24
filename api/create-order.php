<?php
// API endpoint pre vytvorenie novej objednávky
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'error' => 'Iba POST metóda je povolená'
    ]);
    exit;
}

try {
    // Načítanie dát z POST requestu
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        echo json_encode([
            'success' => false,
            'error' => 'Nesprávne dáta'
        ]);
        exit;
    }
    
    // Validácia povinných polí
    if (!isset($input['customer']) || !isset($input['items']) || empty($input['items'])) {
        echo json_encode([
            'success' => false,
            'error' => 'Chýbajú povinné údaje (customer, items)'
        ]);
        exit;
    }
    
    $customer = $input['customer'];
    $items = $input['items'];
    $delivery_time = $input['deliveryTime'] ?? '9:00-18:00';
    $payment_method = $input['paymentMethod'] ?? 'cod';
    $notes = $input['notes'] ?? '';
    
    // Vytvorenie objednávky
    $order = wc_create_order();
    
    // Nastavenie zákazníka
    $order->set_billing_first_name($customer['firstName']);
    $order->set_billing_last_name($customer['lastName']);
    $order->set_billing_email($customer['email']);
    $order->set_billing_phone($customer['phone']);
    $order->set_billing_address_1($customer['address']['street']);
    $order->set_billing_city($customer['address']['city']);
    $order->set_billing_postcode($customer['address']['postalCode']);
    $order->set_billing_country('CZ');
    
    // Nastavenie doručovacej adresy (rovnaká ako fakturačná)
    $order->set_shipping_first_name($customer['firstName']);
    $order->set_shipping_last_name($customer['lastName']);
    $order->set_shipping_address_1($customer['address']['street']);
    $order->set_shipping_city($customer['address']['city']);
    $order->set_shipping_postcode($customer['address']['postalCode']);
    $order->set_shipping_country('CZ');
    
    // Pridanie produktov do objednávky
    foreach ($items as $item) {
        $product_id = intval($item['product']['id']);
        $quantity = intval($item['quantity']);
        
        $product = wc_get_product($product_id);
        if (!$product) {
            echo json_encode([
                'success' => false,
                'error' => 'Produkt s ID ' . $product_id . ' neexistuje'
            ]);
            exit;
        }
        
        $order->add_product($product, $quantity);
    }
    
    // Nastavenie platobnej metódy
    $order->set_payment_method($payment_method);
    $order->set_payment_method_title($payment_method === 'cod' ? 'Dobierka' : 'Online platba');
    
    // Nastavenie statusu
    $order->set_status('processing');
    
    // Pridanie custom meta polí
    $order->update_meta_data('_delivery_time', $delivery_time);
    $order->update_meta_data('_customer_notes', $notes);
    $order->update_meta_data('_order_source', 'customer_app');
    $order->update_meta_data('_assigned_driver_id', '1'); // Default driver
    
    // Výpočet celkovej sumy
    $order->calculate_totals();
    
    // Uloženie objednávky
    $order->save();
    
    // Pridanie poznámky k objednávke
    if (!empty($notes)) {
        $order->add_order_note('Poznámka zákazníka: ' . $notes, false);
    }
    
    // Odoslanie emailu zákazníkovi (ak je nakonfigurované)
    WC()->mailer()->get_emails()['WC_Email_New_Order']->trigger($order->get_id());
    
    echo json_encode([
        'success' => true,
        'orderId' => $order->get_id(),
        'orderNumber' => 'ORD-' . $order->get_id(),
        'total' => $order->get_total(),
        'status' => $order->get_status(),
        'message' => 'Objednávka bola úspešne vytvorená'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Chyba pri vytváraní objednávky: ' . $e->getMessage()
    ]);
}
?>
