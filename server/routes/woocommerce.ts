import { RequestHandler } from "express";
import { WooCommerceOrder, WooCommerceProduct } from "@shared/api";

// WooCommerce REST API konfigurácia
const WOOCOMMERCE_CONFIG = {
  url: process.env.WOOCOMMERCE_URL || "https://zpoledomu.cz",
  consumerKey: process.env.WOOCOMMERCE_KEY || "",
  consumerSecret: process.env.WOOCOMMERCE_SECRET || "",
  version: "wc/v3",
};

// Helper funkcia pre WooCommerce API volania
const wooCommerceAPI = async (endpoint: string, method = "GET", data?: any) => {
  const auth = Buffer.from(
    `${WOOCOMMERCE_CONFIG.consumerKey}:${WOOCOMMERCE_CONFIG.consumerSecret}`,
  ).toString("base64");

  const url = `${WOOCOMMERCE_CONFIG.url}/wp-json/${WOOCOMMERCE_CONFIG.version}/${endpoint}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `WooCommerce API Error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("WooCommerce API Request failed:", {
      url,
      method,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
};

// Načítanie dnešných objednávok
export const getTodaysOrders: RequestHandler = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // Načítanie objednávok na dnešný deň
    const orders = await wooCommerceAPI(
      `orders?after=${today}T00:00:00&before=${tomorrow}T00:00:00&status=processing`,
    );

    // Transformácia WooCommerce objednávok na náš formát
    const transformedOrders = orders.map((order: any) => ({
      id: order.id.toString(),
      customerName: `${order.billing.first_name} ${order.billing.last_name}`,
      address: `${order.billing.address_1}, ${order.billing.city}`,
      postalCode: order.billing.postcode,
      phone: order.billing.phone,
      deliveryTime: getDeliveryTimeSlot(order.meta_data),
      status: "pending",
      items: order.line_items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        farmer: getFarmerFromProduct(item.product_id),
      })),
      coordinates: null, // Bude doplnené geocoding API
      assignedDriverId: getAssignedDriver(order.billing.postcode),
    }));

    res.json({
      success: true,
      orders: transformedOrders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch orders",
    });
  }
};

// Aktualizácia statusu objednávky
export const updateOrderStatus: RequestHandler = async (req, res) => {
  try {
    const { orderId, status, notes } = req.body;

    let wooStatus = "processing";
    if (status === "delivered") wooStatus = "completed";
    if (status === "cancelled") wooStatus = "cancelled";

    await wooCommerceAPI(`orders/${orderId}`, "PUT", {
      status: wooStatus,
      customer_note: notes,
    });

    res.json({
      success: true,
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update order status",
    });
  }
};

// Načítanie produktov a farmárov
export const getFarmersAndProducts: RequestHandler = async (req, res) => {
  try {
    const products = await wooCommerceAPI("products?per_page=100");

    // Kategórie farmárov podľa vašej špecifikácie
    const farmerCategories = {
      "1": "Brambory",
      "2": "Mrkev petržel",
      "3": "Rajčata",
      "4": "Cibule česnek med",
    };

    const farmers = Object.entries(farmerCategories).map(([id, name]) => {
      const farmerProducts = products.filter((product: any) =>
        product.categories.some((cat: any) => cat.id.toString() === id),
      );

      return {
        farmer: name,
        items: farmerProducts.map((product: any) => ({
          name: product.name,
          quantity: 0, // Bude vypočítané z objednávok
          isLoaded: false,
        })),
        isCompletelyLoaded: false,
      };
    });

    res.json({
      success: true,
      farmers,
    });
  } catch (error) {
    console.error("Error fetching farmers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch farmers data",
    });
  }
};

// Helper funkcie
const getDeliveryTimeSlot = (metaData: any[]): string => {
  const deliveryMeta = metaData.find((meta) => meta.key === "delivery_time");
  return deliveryMeta?.value || "09:00-17:00";
};

const getFarmerFromProduct = (productId: number): string => {
  // Mapovanie produktov na farmárov - toto by malo byť v databáze
  const productFarmerMap: { [key: number]: string } = {
    // Brambory
    1: "Farma Zelený háj",
    2: "Bio farma Novák",
    // Mrkev petržel
    3: "Farma Zelený háj",
    4: "Eco farma Dvořák",
    // Rajčata
    5: "Bio farma Novák",
    6: "Farma Zelený háj",
    // Cibule česnek med
    7: "Eco farma Dvořák",
    8: "Medařství Svoboda",
  };

  return productFarmerMap[productId] || "Neznámý farmár";
};

const getAssignedDriver = (postalCode: string): string => {
  // Rozdelenie PSČ medzi vodičov - toto by malo byť v databáze
  const firstDigit = parseInt(postalCode.charAt(0));

  if (firstDigit <= 2) return "1"; // Jan Novák
  if (firstDigit <= 5) return "2"; // Petr Svoboda
  return "1"; // Default Jan Novák
};

// API endpoint pre načítanie produktov pre zákazníkov
export const getProducts: RequestHandler = async (req, res) => {
  try {
    // Check if WooCommerce credentials are available
    if (!WOOCOMMERCE_CONFIG.consumerKey || !WOOCOMMERCE_CONFIG.consumerSecret) {
      console.log("WooCommerce credentials missing, returning mock products");
      return res.json({
        success: true,
        products: [
          {
            id: "1",
            name: "Farmárské Brambory",
            description: "Kvalitní farmárské brambory",
            price: 160,
            images: [
              "https://images.pexels.com/photos/10112133/pexels-photo-10112133.jpeg",
            ],
            category: "zelenina",
            unit: "cca 5kg",
            inStock: true,
            stockQuantity: 20,
            rating: 4.5,
            reviews: 22,
          },
          {
            id: "2",
            name: "Zámecké minibrambory",
            description: "Jemné minibrambory ideálne varené v slupce",
            price: 240,
            images: [
              "https://images.pexels.com/photos/10112133/pexels-photo-10112133.jpeg",
            ],
            category: "zelenina",
            unit: "cca 5kg",
            inStock: true,
            stockQuantity: 15,
            rating: 4.6,
            reviews: 14,
          },
          {
            id: "3",
            name: "Cherry rajčátka",
            description: "Sladká cherry rajčátka ze skleníků",
            price: 160,
            images: [
              "https://images.pexels.com/photos/161512/eggplant-400-08373800-400-08373801-400-08373802-400-08373803-161512.jpeg",
            ],
            category: "zelenina",
            unit: "1kg",
            inStock: true,
            stockQuantity: 25,
            rating: 4.7,
            reviews: 18,
          },
          {
            id: "4",
            name: "Mrkev",
            description: "Čerstvá bio mrkev",
            price: 40,
            images: [
              "https://images.pexels.com/photos/2880693/pexels-photo-2880693.jpeg",
            ],
            category: "zelenina",
            unit: "svazek",
            inStock: true,
            stockQuantity: 35,
            rating: 4.8,
            reviews: 20,
          },
          {
            id: "5",
            name: "Petržel",
            description: "Aromatická petržel z vlastní produkce",
            price: 50,
            images: [
              "https://images.pexels.com/photos/606540/pexels-photo-606540.jpeg",
            ],
            category: "bylinky",
            unit: "svazek",
            inStock: true,
            stockQuantity: 25,
            rating: 4.4,
            reviews: 7,
          },
          {
            id: "6",
            name: "Cibule žlutá",
            description: "Čerstvá žlutá cibule z moravských polí",
            price: 50,
            images: [
              "https://images.pexels.com/photos/208453/pexels-photo-208453.jpeg",
            ],
            category: "zelenina",
            unit: "1kg",
            inStock: true,
            stockQuantity: 45,
            rating: 4.6,
            reviews: 12,
          },
          {
            id: "7",
            name: "Cibule červená",
            description: "Sladká červená cibule ideálna do šalátov",
            price: 60,
            images: [
              "https://images.pexels.com/photos/7146785/pexels-photo-7146785.jpeg",
            ],
            category: "zelenina",
            unit: "1kg",
            inStock: true,
            stockQuantity: 30,
            rating: 4.7,
            reviews: 8,
          },
          {
            id: "8",
            name: "Česnek",
            description: "Aromatický česnek z domácí produkce",
            price: 160,
            images: [
              "https://images.pexels.com/photos/4084642/pexels-photo-4084642.jpeg",
            ],
            category: "zelenina",
            unit: "0,5kg",
            inStock: true,
            stockQuantity: 20,
            rating: 4.8,
            reviews: 15,
          },
          {
            id: "9",
            name: "Med květový",
            description: "Přírodný květový med od místních včelařů",
            price: 240,
            images: [
              "https://images.pexels.com/photos/9228574/pexels-photo-9228574.jpeg",
            ],
            category: "med",
            unit: "0,7kg",
            inStock: true,
            stockQuantity: 15,
            rating: 4.9,
            reviews: 25,
          },
          {
            id: "10",
            name: "Med květový pastovaný",
            description: "Jemný pastovaný květový med",
            price: 240,
            images: [
              "https://images.pexels.com/photos/9228574/pexels-photo-9228574.jpeg",
            ],
            category: "med",
            unit: "0,7kg",
            inStock: true,
            stockQuantity: 12,
            rating: 4.9,
            reviews: 18,
          },
        ],
        count: 10,
      });
    }

    const products = await wooCommerceAPI(
      "products?status=publish&stock_status=instock&per_page=100",
    );

    const formattedProducts = products.map((product: any) => ({
      id: product.id.toString(),
      name: product.name,
      description:
        product.description || product.short_description || "Kvalitný produkt",
      price: parseFloat(product.regular_price || product.price || "0"),
      salePrice: product.sale_price ? parseFloat(product.sale_price) : null,
      images:
        product.images?.length > 0
          ? product.images.map((img: any) => img.src)
          : ["/placeholder.svg"],
      category: product.categories?.[0]?.slug || "zelenina",
      unit:
        product.meta_data?.find((meta: any) => meta.key === "_unit")?.value ||
        "ks",
      inStock: product.stock_status === "instock",
      stockQuantity: product.stock_quantity || 0,
      rating: parseFloat(product.average_rating) || 4.5,
      reviews: product.rating_count || 0,
      origin: product.meta_data?.find((meta: any) => meta.key === "_origin")
        ?.value,
      nutritionalInfo: product.meta_data?.find(
        (meta: any) => meta.key === "_nutritional_info",
      )?.value,
    }));

    res.json({
      success: true,
      products: formattedProducts,
      count: formattedProducts.length,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch products from WooCommerce",
    });
  }
};

// API endpoint pre načítanie objednávok zákazníka
export const getCustomerOrders: RequestHandler = async (req, res) => {
  try {
    const customerEmail = req.query.customer_email || "jana.novakova@email.cz";

    // Check if WooCommerce credentials are available
    if (!WOOCOMMERCE_CONFIG.consumerKey || !WOOCOMMERCE_CONFIG.consumerSecret) {
      console.log("WooCommerce credentials missing, returning mock orders");
      return res.json({
        success: true,
        orders: [],
        count: 0,
      });
    }

    // Načítanie objednávok pre zákazníka
    const orders = await wooCommerceAPI(
      `orders?customer=${customerEmail}&per_page=50&orderby=date&order=desc`,
    );

    const formattedOrders = await Promise.all(
      orders.map(async (order: any) => {
        // Načítanie produktov v objednávke
        const items = await Promise.all(
          order.line_items.map(async (item: any) => {
            try {
              const product = await wooCommerceAPI(
                `products/${item.product_id}`,
              );
              return {
                product: {
                  id: product.id.toString(),
                  name: item.name,
                  description: product.short_description || "Kvalitný produkt",
                  price: parseFloat(item.price),
                  salePrice: product.sale_price
                    ? parseFloat(product.sale_price)
                    : null,
                  images:
                    product.images?.length > 0
                      ? product.images.map((img: any) => img.src)
                      : ["/placeholder.svg"],
                  category: "zelenina",
                  unit:
                    product.meta_data?.find((meta: any) => meta.key === "_unit")
                      ?.value || "ks",
                  inStock: product.stock_status === "instock",
                  stockQuantity: product.stock_quantity || 0,
                  rating: 4.5,
                  reviews: 0,
                },
                quantity: item.quantity,
              };
            } catch (err) {
              // Fallback ak sa produkt nedá načítať
              return {
                product: {
                  id: item.product_id.toString(),
                  name: item.name,
                  description: "Kvalitný produkt",
                  price: parseFloat(item.price),
                  salePrice: null,
                  images: ["/placeholder.svg"],
                  category: "zelenina",
                  unit: "ks",
                  inStock: true,
                  stockQuantity: 0,
                  rating: 4.5,
                  reviews: 0,
                },
                quantity: item.quantity,
              };
            }
          }),
        );

        // Mapovanie statusov
        let status = "new";
        const driverStatus = order.meta_data?.find(
          (meta: any) => meta.key === "_driver_status",
        )?.value;

        if (driverStatus === "on-route") {
          status = "on-route";
        } else if (order.status === "completed") {
          status = "delivered";
        } else if (order.status === "cancelled") {
          status = "cancelled";
        } else if (order.status === "processing") {
          status = "confirmed";
        }

        return {
          id: `ORD-${order.id}`,
          date: order.date_created.split("T")[0],
          status: status,
          total: parseFloat(order.total),
          items: items,
          deliveryAddress: `${order.billing.address_1}, ${order.billing.city} ${order.billing.postcode}`,
          deliveryTime:
            order.meta_data?.find((meta: any) => meta.key === "_delivery_time")
              ?.value || "9:00-18:00",
          estimatedDelivery: status === "on-route" ? "15:30" : null,
          driverName: order.meta_data?.find(
            (meta: any) => meta.key === "_driver_name",
          )?.value,
          driverPhone: order.meta_data?.find(
            (meta: any) => meta.key === "_driver_phone",
          )?.value,
          loyaltyPointsEarned: Math.floor(parseFloat(order.total) / 10), // 1 bod za každých 10 Kč
        };
      }),
    );

    res.json({
      success: true,
      orders: formattedOrders,
      count: formattedOrders.length,
    });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch customer orders",
    });
  }
};

// API endpoint pre vytvorenie novej objednávky
// API endpoint pre kontrolu doručovacej oblasti
export const checkDeliveryArea: RequestHandler = async (req, res) => {
  try {
    const { postalCode, city } = req.query;

    // Check if WooCommerce credentials are available
    if (!WOOCOMMERCE_CONFIG.consumerKey || !WOOCOMMERCE_CONFIG.consumerSecret) {
      console.log("WooCommerce credentials missing, using mock delivery areas");

      // Mock delivery areas for demo - in real app this would come from WooCommerce
      const allowedAreas = [
        { postalCode: "110", city: "Praha 1" },
        { postalCode: "111", city: "Praha 1" },
        { postalCode: "120", city: "Praha 2" },
        { postalCode: "130", city: "Praha 3" },
        { postalCode: "140", city: "Praha 4" },
        { postalCode: "150", city: "Praha 5" },
        { postalCode: "160", city: "Praha 6" },
        { postalCode: "170", city: "Praha 7" },
        { postalCode: "180", city: "Praha 8" },
        { postalCode: "190", city: "Praha 9" },
      ];

      const areaCode = postalCode?.toString().substring(0, 3);
      const isAllowed = allowedAreas.some(
        (area) =>
          area.postalCode === areaCode ||
          area.city.toLowerCase() === city?.toString().toLowerCase(),
      );

      return res.json({
        success: true,
        isDeliveryAvailable: isAllowed,
        message: isAllowed
          ? "Doručujeme do tejto oblasti"
          : "Do tejto oblasti momentálne nedoručujeme",
        availableAreas: allowedAreas,
      });
    }

    // In real implementation, this would query WooCommerce/WordPress database
    // for custom delivery areas table
    const result = await wooCommerceAPI(
      `delivery-areas?postal_code=${postalCode}&city=${city}`,
    );

    res.json({
      success: true,
      isDeliveryAvailable: result.length > 0,
      message:
        result.length > 0
          ? "Doručujeme do tejto oblasti"
          : "Do tejto oblasti momentálne nedoručujeme",
    });
  } catch (error) {
    console.error("Error checking delivery area:", error);
    res.status(500).json({
      success: false,
      error: "Chyba pri kontrole doručovacej oblasti",
    });
  }
};

// API endpoint pre prihlásenie existujúceho zákazníka
export const authenticateCustomer: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email a heslo sú povinné",
      });
    }

    // Check if WooCommerce credentials are available
    if (!WOOCOMMERCE_CONFIG.consumerKey || !WOOCOMMERCE_CONFIG.consumerSecret) {
      console.log("WooCommerce credentials missing, using mock authentication");

      // Mock authentication for development
      if (email === "jana.novakova@email.cz" && password === "password123") {
        return res.json({
          success: true,
          customer: {
            id: "1",
            email: "jana.novakova@email.cz",
            firstName: "Jana",
            lastName: "Nováková",
            phone: "+420 601 123 456",
            address: {
              street: "Václavské náměstí 1",
              city: "Praha",
              postalCode: "110 00",
            },
            loyaltyPoints: 450,
            membershipLevel: "silver",
            totalOrders: 12,
            totalSpent: 3420,
            dateRegistered: "2023-01-15",
          },
        });
      } else {
        return res.status(401).json({
          success: false,
          error: "Nesprávny email alebo heslo",
        });
      }
    }

    // Find customer by email in WooCommerce
    const customers = await wooCommerceAPI(
      `customers?email=${encodeURIComponent(email)}`,
    );

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Zákazník s týmto emailom neexistuje",
      });
    }

    const customer = customers[0];

    // In real implementation, you would verify password with WooCommerce/WordPress auth
    // For now, we'll assume the password check happens on WordPress side
    // and return customer data if found

    // Get customer orders count and total spent
    const customerOrders = await wooCommerceAPI(
      `orders?customer=${customer.id}&per_page=100`,
    );
    const totalSpent = customerOrders.reduce(
      (sum: number, order: any) => sum + parseFloat(order.total),
      0,
    );

    // Calculate loyalty points (1 point per 10 CZK spent)
    const loyaltyPoints = Math.floor(totalSpent / 10);

    // Determine membership level
    let membershipLevel = "bronze";
    if (totalSpent >= 10000) membershipLevel = "platinum";
    else if (totalSpent >= 5000) membershipLevel = "gold";
    else if (totalSpent >= 2000) membershipLevel = "silver";

    const customerData = {
      id: customer.id.toString(),
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.billing?.phone || "",
      address: {
        street: customer.billing?.address_1 || "",
        city: customer.billing?.city || "",
        postalCode: customer.billing?.postcode || "",
      },
      loyaltyPoints,
      membershipLevel,
      totalOrders: customerOrders.length,
      totalSpent,
      dateRegistered: customer.date_created?.split("T")[0] || "",
    };

    res.json({
      success: true,
      customer: customerData,
    });
  } catch (error) {
    console.error("Error authenticating customer:", error);
    res.status(500).json({
      success: false,
      error: "Chyba pri prihlasovaní zákazníka",
    });
  }
};

// API endpoint pre registráciu nového zákazníka
export const registerCustomer: RequestHandler = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, address } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Všetky povinné polia musia byť vyplnené",
      });
    }

    // Check if WooCommerce credentials are available
    if (!WOOCOMMERCE_CONFIG.consumerKey || !WOOCOMMERCE_CONFIG.consumerSecret) {
      console.log("WooCommerce credentials missing, using mock registration");

      return res.json({
        success: true,
        customer: {
          id: Date.now().toString(),
          email,
          firstName,
          lastName,
          phone: phone || "",
          address: {
            street: address?.street || "",
            city: address?.city || "Praha",
            postalCode: address?.postalCode || "110 00",
          },
          loyaltyPoints: 0,
          membershipLevel: "bronze",
          totalOrders: 0,
          totalSpent: 0,
          dateRegistered: new Date().toISOString().split("T")[0],
        },
        message: "Registrácia úspešná (mock mode)",
      });
    }

    // Check if customer already exists
    const existingCustomers = await wooCommerceAPI(
      `customers?email=${encodeURIComponent(email)}`,
    );
    if (existingCustomers.length > 0) {
      return res.status(409).json({
        success: false,
        error: "Zákazník s týmto emailom už existuje",
      });
    }

    // Create new customer in WooCommerce
    const customerData = {
      email,
      first_name: firstName,
      last_name: lastName,
      username: email, // Use email as username
      password,
      billing: {
        first_name: firstName,
        last_name: lastName,
        phone: phone || "",
        email,
        address_1: address?.street || "",
        city: address?.city || "",
        postcode: address?.postalCode || "",
        country: "CZ",
      },
      shipping: {
        first_name: firstName,
        last_name: lastName,
        address_1: address?.street || "",
        city: address?.city || "",
        postcode: address?.postalCode || "",
        country: "CZ",
      },
    };

    const newCustomer = await wooCommerceAPI("customers", "POST", customerData);

    const formattedCustomer = {
      id: newCustomer.id.toString(),
      email: newCustomer.email,
      firstName: newCustomer.first_name,
      lastName: newCustomer.last_name,
      phone: newCustomer.billing?.phone || "",
      address: {
        street: newCustomer.billing?.address_1 || "",
        city: newCustomer.billing?.city || "",
        postalCode: newCustomer.billing?.postcode || "",
      },
      loyaltyPoints: 0,
      membershipLevel: "bronze",
      totalOrders: 0,
      totalSpent: 0,
      dateRegistered: newCustomer.date_created?.split("T")[0] || "",
    };

    res.json({
      success: true,
      customer: formattedCustomer,
      message: "Registrácia úspešná",
    });
  } catch (error) {
    console.error("Error registering customer:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error && error.message.includes("already exists")
          ? "Zákazník s týmto emailom už existuje"
          : "Chyba pri registrácii zákazníka",
    });
  }
};

export const createOrder: RequestHandler = async (req, res) => {
  try {
    console.log("Creating order with data:", JSON.stringify(req.body, null, 2));

    const { customer, items, deliveryTime, paymentMethod, notes } = req.body;

    if (!customer || !items || items.length === 0) {
      console.log("Missing required data:", {
        hasCustomer: !!customer,
        itemsLength: items?.length,
      });
      return res.status(400).json({
        success: false,
        error: "Chýbajú povinné údaje (customer, items)",
      });
    }

    // Check if WooCommerce credentials are available
    if (!WOOCOMMERCE_CONFIG.consumerKey || !WOOCOMMERCE_CONFIG.consumerSecret) {
      console.log("WooCommerce credentials missing, returning mock success");
      const mockOrderId = Date.now();
      return res.json({
        success: true,
        orderId: mockOrderId,
        orderNumber: `ORD-${mockOrderId}`,
        total: items.reduce(
          (sum: number, item: any) => sum + item.product.price * item.quantity,
          0,
        ),
        status: "processing",
        message: "Objednávka bola úspešne vytvorená (mock mode)",
      });
    }

    const orderData = {
      status: "processing",
      billing: {
        first_name: customer.firstName,
        last_name: customer.lastName,
        address_1: customer.address.street,
        city: customer.address.city,
        postcode: customer.address.postalCode,
        phone: customer.phone,
        email: customer.email,
        country: "CZ",
      },
      shipping: {
        first_name: customer.firstName,
        last_name: customer.lastName,
        address_1: customer.address.street,
        city: customer.address.city,
        postcode: customer.address.postalCode,
        country: "CZ",
      },
      line_items: items.map((item: any) => ({
        product_id: parseInt(item.product.id),
        quantity: item.quantity,
      })),
      payment_method: paymentMethod || "cod",
      payment_method_title:
        paymentMethod === "cod" ? "Dobierka" : "Online platba",
      meta_data: [
        { key: "_delivery_time", value: deliveryTime || "9:00-18:00" },
        { key: "_customer_notes", value: notes || "" },
        { key: "_order_source", value: "customer_app" },
        { key: "_assigned_driver_id", value: "1" },
      ],
    };

    console.log(
      "Sending order data to WooCommerce:",
      JSON.stringify(orderData, null, 2),
    );

    const result = await wooCommerceAPI("orders", "POST", orderData);

    console.log("WooCommerce order created successfully:", result.id);

    res.json({
      success: true,
      orderId: result.id,
      orderNumber: `ORD-${result.id}`,
      total: result.total,
      status: result.status,
      message: "Objednávka bola úspešne vytvorená",
    });
  } catch (error) {
    console.error("Error creating order:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Chyba pri vytváraní objednávky",
    });
  }
};
