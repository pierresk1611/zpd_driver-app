<?php
// API endpoint pre produkty
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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
    // Získanie produktov z WooCommerce
    $args = [
        'status' => 'publish',
        'limit' => -1, // Všetky produkty
        'meta_query' => [
            [
                'key' => '_stock_status',
                'value' => 'instock',
                'compare' => '='
            ]
        ]
    ];

    $products = wc_get_products($args);
    $formatted_products = [];

    foreach ($products as $product) {
        $product_data = $product->get_data();
        
        // Získanie obrázkov
        $images = [];
        $image_id = $product->get_image_id();
        if ($image_id) {
            $images[] = wp_get_attachment_url($image_id);
        }
        
        // Získanie kategórií
        $categories = wp_get_post_terms($product->get_id(), 'product_cat');
        $category = !empty($categories) ? $categories[0]->name : 'Ostatné';
        
        // Custom meta polia
        $farmer = get_post_meta($product->get_id(), '_farmer_name', true) ?: 'Bio farma';
        $unit = get_post_meta($product->get_id(), '_unit', true) ?: 'ks';
        
        // Hodnotenia (ak máte plugin pre reviews)
        $rating = $product->get_average_rating() ?: 4.5;
        $reviews = $product->get_review_count() ?: 0;

        $formatted_products[] = [
            'id' => (string)$product->get_id(),
            'name' => $product_data['name'],
            'description' => $product_data['description'] ?: $product_data['short_description'],
            'price' => (float)$product_data['price'],
            'salePrice' => $product->is_on_sale() ? (float)$product_data['sale_price'] : null,
            'images' => $images,
            'category' => strtolower($category),
            'farmer' => $farmer,
            'unit' => $unit,
            'inStock' => $product->is_in_stock(),
            'stockQuantity' => $product->get_stock_quantity() ?: 0,
            'rating' => (float)$rating,
            'reviews' => (int)$reviews
        ];
    }

    echo json_encode([
        'success' => true,
        'products' => $formatted_products,
        'count' => count($formatted_products)
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Chyba pri načítaní produktov: ' . $e->getMessage()
    ]);
}
?>
