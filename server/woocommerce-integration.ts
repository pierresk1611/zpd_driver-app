import fetch from "node-fetch";

// WooCommerce API Configuration
const WC_CONFIG = {
  url: "https://zpoledomu.cz",
  consumerKey: "ck_c04c9c7347b4b078549e6548be52bfa74c41b14b",
  consumerSecret: "cs_484c4c50900196991189d6f57b0b9874aacfa61d",
  version: "wc/v3",
};

// Base64 encode credentials for API authentication
const auth = Buffer.from(
  `${WC_CONFIG.consumerKey}:${WC_CONFIG.consumerSecret}`,
).toString("base64");

interface WooCommerceOrder {
  id: number;
  status: string;
  date_created: string;
  date_completed?: string;
  date_paid?: string;
  total: string;
  currency?: string;
  payment_method?: string;
  payment_method_title?: string;
  billing: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    postcode: string;
    phone: string;
    email: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    postcode: string;
  };
  line_items: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
    product_id: number;
  }>;
  meta_data: Array<{
    key: string;
    value: any;
  }>;
}

interface WooCommerceProduct {
  id: number;
  name: string;
  description: string;
  short_description: string;
  price: string;
  sale_price: string;
  regular_price: string;
  stock_status: string;
  stock_quantity: number;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  images: Array<{
    src: string;
    alt: string;
  }>;
  meta_data: Array<{
    key: string;
    value: any;
  }>;
}

// Helper function to make WooCommerce API calls
async function wooCommerceRequest(
  endpoint: string,
  method: string = "GET",
  data?: any,
) {
  const url = `${WC_CONFIG.url}/wp-json/${WC_CONFIG.version}/${endpoint}`;

  const options: any = {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
  };

  if (data && method !== "GET") {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(
        `WooCommerce API error: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("WooCommerce API Error:", error);
    throw error;
  }
}

// Get today's orders from WooCommerce
export async function getTodaysOrdersFromWC() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const orders = await wooCommerceRequest(
      `orders?status=processing,on-hold,pending&after=${today}T00:00:00&per_page=100`,
    );

    const formattedOrders = await Promise.all(
      orders.map(async (order: WooCommerceOrder) => {
        const items = await Promise.all(
          order.line_items.map(async (item) => {
            // Get product details for farmer info
            const product = await wooCommerceRequest(
              `products/${item.product_id}`,
            );
            const farmerName =
              product.meta_data?.find(
                (meta: any) => meta.key === "_farmer_name",
              )?.value || "Bio farma";

            return {
              name: item.name,
              quantity: item.quantity,
              farmer: farmerName,
            };
          }),
        );

        // Get custom meta fields
        const deliveryTime =
          order.meta_data?.find((meta) => meta.key === "_delivery_time")
            ?.value || "09:00-18:00";
        const assignedDriverId =
          order.meta_data?.find((meta) => meta.key === "_assigned_driver_id")
            ?.value || "1";
        const driverStatus = order.meta_data?.find(
          (meta) => meta.key === "_driver_status",
        )?.value;

        // Map WooCommerce status to app status
        let appStatus = "pending";
        if (driverStatus === "on-route") {
          appStatus = "on-route";
        } else if (order.status === "completed") {
          appStatus = "delivered";
        } else if (order.status === "cancelled") {
          appStatus = "cancelled";
        }

        // Extract payment information
        const paymentMethod = order.payment_method || "unknown";
        let paymentStatus = "pending";

        // Determine payment status based on order status and payment method
        if (order.status === "completed") {
          paymentStatus = paymentMethod === "cod" ? "cash_paid" : "paid";
        } else if (paymentMethod === "cod") {
          paymentStatus = "cash";
        } else if (order.date_paid) {
          paymentStatus = "paid";
        }

        return {
          id: order.id.toString(),
          customerName: `${order.billing.first_name} ${order.billing.last_name}`,
          address: `${order.billing.address_1}, ${order.billing.city}`,
          postalCode: order.billing.postcode,
          phone: order.billing.phone,
          deliveryTime: deliveryTime,
          status: appStatus,
          items: items,
          assignedDriverId: assignedDriverId,
          notes:
            order.meta_data?.find((meta) => meta.key === "_driver_notes")
              ?.value || "",
          coordinates: await geocodeAddress(
            `${order.billing.address_1}, ${order.billing.city}, ${order.billing.postcode}`,
          ),
          // Payment information
          paymentStatus: paymentStatus,
          paymentMethod: paymentMethod,
          totalAmount: parseFloat(order.total),
          currency: order.currency || "CZK",
          deliveredAt: order.date_completed || undefined,
        };
      }),
    );

    return {
      success: true,
      orders: formattedOrders,
    };
  } catch (error) {
    console.error("Error fetching orders from WooCommerce:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Update order status in WooCommerce
export async function updateOrderStatusInWC(
  orderId: string,
  status: string,
  driverNotes?: string,
) {
  try {
    const updates: any = {};

    // Map app status to WooCommerce status
    switch (status) {
      case "on-route":
        updates.meta_data = [
          { key: "_driver_status", value: "on-route" },
          { key: "_on_route_time", value: new Date().toISOString() },
        ];
        break;
      case "delivered":
        updates.status = "completed";
        updates.meta_data = [
          { key: "_driver_status", value: "delivered" },
          { key: "_delivered_time", value: new Date().toISOString() },
        ];
        break;
      case "delayed":
        updates.meta_data = [
          { key: "_driver_status", value: "delayed" },
          { key: "_delay_time", value: new Date().toISOString() },
        ];
        break;
      case "cancelled":
        updates.status = "cancelled";
        break;
    }

    // Add driver notes if provided
    if (driverNotes) {
      if (!updates.meta_data) updates.meta_data = [];
      updates.meta_data.push({ key: "_driver_notes", value: driverNotes });
    }

    const result = await wooCommerceRequest(
      `orders/${orderId}`,
      "PUT",
      updates,
    );

    return {
      success: true,
      message: `Order ${orderId} updated successfully`,
      wcOrder: result,
    };
  } catch (error) {
    console.error("Error updating order in WooCommerce:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Get products from WooCommerce for customer app
export async function getProductsFromWC() {
  try {
    const products = await wooCommerceRequest(
      "products?status=publish&stock_status=instock&per_page=100",
    );

    const formattedProducts = products.map((product: WooCommerceProduct) => {
      const farmerName =
        product.meta_data?.find((meta) => meta.key === "_farmer_name")?.value ||
        "Bio farma";
      const unit =
        product.meta_data?.find((meta) => meta.key === "_unit")?.value || "ks";

      return {
        id: product.id.toString(),
        name: product.name,
        description: product.description || product.short_description || "",
        price: parseFloat(product.regular_price || product.price || "0"),
        salePrice: product.sale_price ? parseFloat(product.sale_price) : null,
        images: product.images?.map((img) => img.src) || [],
        category: product.categories?.[0]?.slug || "ostatne",
        farmer: farmerName,
        unit: unit,
        inStock: product.stock_status === "instock",
        stockQuantity: product.stock_quantity || 0,
        rating: 4.5, // Default rating - can be enhanced with review plugin
        reviews: 0, // Default reviews - can be enhanced with review plugin
      };
    });

    return {
      success: true,
      products: formattedProducts,
    };
  } catch (error) {
    console.error("Error fetching products from WooCommerce:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Create order in WooCommerce
export async function createOrderInWC(orderData: any) {
  try {
    const wcOrderData = {
      status: "processing",
      billing: {
        first_name: orderData.customer.firstName,
        last_name: orderData.customer.lastName,
        address_1: orderData.customer.address.street,
        city: orderData.customer.address.city,
        postcode: orderData.customer.address.postalCode,
        phone: orderData.customer.phone,
        email: orderData.customer.email,
      },
      shipping: {
        first_name: orderData.customer.firstName,
        last_name: orderData.customer.lastName,
        address_1: orderData.customer.address.street,
        city: orderData.customer.address.city,
        postcode: orderData.customer.address.postalCode,
      },
      line_items: orderData.items.map((item: any) => ({
        product_id: parseInt(item.product.id),
        quantity: item.quantity,
      })),
      meta_data: [
        { key: "_delivery_time", value: orderData.deliveryTime },
        { key: "_customer_notes", value: orderData.notes },
        { key: "_payment_method_app", value: orderData.paymentMethod },
        { key: "_assigned_driver_id", value: "1" }, // Default driver assignment
        { key: "_order_source", value: "driver_app" },
      ],
    };

    const result = await wooCommerceRequest("orders", "POST", wcOrderData);

    return {
      success: true,
      orderId: result.id,
      wcOrder: result,
    };
  } catch (error) {
    console.error("Error creating order in WooCommerce:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Add note to WooCommerce order
export async function addOrderNoteInWC(
  orderId: string,
  note: string,
  driverName?: string,
) {
  try {
    const noteData = {
      note: `${driverName ? `[${driverName}] ` : ""}${note}`,
      customer_note: false, // Internal note, not visible to customer
    };

    const result = await wooCommerceRequest(
      `orders/${orderId}/notes`,
      "POST",
      noteData,
    );

    return {
      success: true,
      noteId: result.id,
    };
  } catch (error) {
    console.error("Error adding note to WooCommerce order:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Real geocoding using Google Maps API
async function geocodeAddress(address: string) {
  try {
    const { geocodeAddress: gmGeocode } = await import(
      "./google-maps-integration"
    );
    const coordinates = await gmGeocode(address);

    if (coordinates) {
      return coordinates;
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }

  // Fallback for Prague center if geocoding fails
  const pragueCenter = { lat: 50.0755, lng: 14.4378 };
  const offset = (Math.random() - 0.5) * 0.01;

  return {
    lat: pragueCenter.lat + offset,
    lng: pragueCenter.lng + offset,
  };
}

// Get farmers and products for loading
export async function getFarmersFromWC() {
  try {
    const products = await wooCommerceRequest(
      "products?status=publish&per_page=100",
    );

    // Group products by farmer
    const farmerGroups: { [key: string]: any[] } = {};

    products.forEach((product: WooCommerceProduct) => {
      const farmerName =
        product.meta_data?.find((meta) => meta.key === "_farmer_name")?.value ||
        "Bio farma";

      if (!farmerGroups[farmerName]) {
        farmerGroups[farmerName] = [];
      }

      farmerGroups[farmerName].push({
        name: product.name,
        quantity: Math.floor(Math.random() * 10) + 1, // Random quantity for demo
        isLoaded: false,
      });
    });

    const farmers = Object.entries(farmerGroups).map(([farmer, items]) => ({
      farmer,
      items,
      isCompletelyLoaded: false,
    }));

    return {
      success: true,
      farmers: farmers,
    };
  } catch (error) {
    console.error("Error fetching farmers from WooCommerce:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
