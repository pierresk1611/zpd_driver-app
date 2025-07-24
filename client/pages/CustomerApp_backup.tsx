import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  ShoppingCart,
  Plus,
  Minus,
  User,
  LogOut,
  Search,
  Filter,
  Star,
  Truck,
  Clock,
  MapPin,
  Phone,
  Carrot,
  Package,
  CreditCard,
  Check,
  X,
  Loader2,
  Home,
  Gift,
  Info,
  Repeat,
  Bell,
  StarIcon,
  Navigation,
  Eye,
  MessageSquare,
  Calendar,
  Heart,
  Award,
  Leaf,
  TrendingUp,
  Mail,
} from "lucide-react";

// Interfaces based on ZpoleDomu requirements
interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
  loyaltyPoints: number;
  membershipLevel: "bronze" | "silver" | "gold" | "platinum";
  totalOrders: number;
  totalSpent: number;
  canOrder?: boolean; // Whether customer is in delivery area
  deliveryMessage?: string; // Message about delivery availability
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  images: string[];
  category: string;
  unit: string;
  inStock: boolean;
  stockQuantity: number;
  rating: number;
  reviews: number;
  nutritionalInfo?: string;
  origin?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Order {
  id: string;
  date: string;
  status: "new" | "confirmed" | "on-route" | "delivered" | "cancelled";
  total: number;
  items: CartItem[];
  deliveryAddress: string;
  deliveryTime: string;
  estimatedDelivery?: string;
  driverName?: string;
  driverPhone?: string;
  rating?: number;
  reviewComment?: string;
  loyaltyPointsEarned?: number;
}

interface DriverLocation {
  lat: number;
  lng: number;
  lastUpdate: string;
  estimatedArrival?: string;
}

interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: "discount" | "freeProduct" | "shipping" | "special";
  isAvailable: boolean;
  image?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  type: "order" | "delivery" | "promo" | "loyalty";
  isRead: boolean;
  orderId?: string;
}

export default function CustomerApp() {
  // State management
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(
    null,
  );
  const [loyaltyRewards, setLoyaltyRewards] = useState<LoyaltyReward[]>([]);

  // Navigation state
  const [activeTab, setActiveTab] = useState<
    "home" | "orders" | "account" | "loyalty" | "info"
  >("home");

  // UI state
  const [searchTerm, setSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [orderToRate, setOrderToRate] = useState<Order | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");

  // Checkout state
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [useCurrentAddress, setUseCurrentAddress] = useState(true);
  const [deliveryTime, setDeliveryTime] = useState("9:00-12:00");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [orderNotes, setOrderNotes] = useState("");

  // Registration state
  const [showRegistration, setShowRegistration] = useState(false);

  // Debug registration state changes
  useEffect(() => {
    console.log("Registration modal state changed:", showRegistration);
  }, [showRegistration]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const logoutCustomer = () => {
    setCurrentCustomer(null);
    setCart([]);
    setOrders([]);
    setNotifications([]);
    setLoginEmail("");
    setLoginPassword("");
    setShowRegistration(false);
    setShowCheckout(false);
    setActiveTab("home");
  };
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regStreet, setRegStreet] = useState("");
  const [regCity, setRegCity] = useState("");
  const [regPostalCode, setRegPostalCode] = useState("");

  // WooCommerce data initialization
  useEffect(() => {
    loadWooCommerceData();
  }, []);

  const loadWooCommerceData = async () => {
    setIsLoading(true);
    try {
      // Load products from WooCommerce (without automatically logging in customer)
      await loadProductsFromWooCommerce();
    } catch (error) {
      console.error("Error loading WooCommerce data:", error);
      // Fallback to basic mock data on error
      loadBasicMockData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadProductsFromWooCommerce = async () => {
    try {
      const response = await fetch("/api/products");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get response as text first to handle mixed JSON+HTML
      const responseText = await response.text();
      const jsonPart = responseText.split("<script>")[0];
      const data = JSON.parse(jsonPart);

      if (data.success && data.products) {
        // Remove farmer references as per user request
        const cleanProducts = data.products.map((product: any) => ({
          id: product.id,
          name: product.name,
          description: product.description || "Čerstvý kvalitn�� produkt",
          price: product.price,
          salePrice: product.salePrice,
          images:
            product.images.length > 0 ? product.images : ["/placeholder.svg"],
          category: product.category || "Zelenina",
          unit: product.unit || "ks",
          inStock: product.inStock,
          stockQuantity: product.stockQuantity,
          rating: product.rating || 4.5,
          reviews: product.reviews || 0,
          nutritionalInfo: product.nutritionalInfo,
          origin: product.origin,
        }));

        setProducts(cleanProducts);
      } else {
        console.error("Failed to load products:", data.error);
        loadBasicMockData();
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      loadBasicMockData();
    }
  };

  const loadOrdersFromWooCommerce = async () => {
    try {
      const customerEmail = currentCustomer?.email || "jana.novakova@email.cz";
      const response = await fetch(
        `/api/customer-orders?customer_email=${encodeURIComponent(customerEmail)}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get response as text first to handle mixed JSON+HTML
      const responseText = await response.text();
      const jsonPart = responseText.split("<script>")[0];
      const data = JSON.parse(jsonPart);

      if (data.success && data.orders) {
        setOrders(data.orders);
      } else {
        // Load mock orders if API fails
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    }
  };

  const loadBasicMockData = () => {
    // Basic fallback products
    setProducts([
      {
        id: "1",
        name: "Farmárské Brambory",
        description: "Kvalitní farmárské brambory",
        price: 160,
        images: [
          "https://images.pexels.com/photos/10112133/pexels-photo-10112133.jpeg",
        ],
        category: "Zelenina",
        unit: "cca 5kg",
        inStock: true,
        stockQuantity: 20,
        rating: 4.5,
        reviews: 22,
        origin: "Českomoravská vrchovina",
        nutritionalInfo: "Vitamin C, draslík",
      },
      {
        id: "2",
        name: "Zámecké minibrambory",
        description: "Jemné minibrambory ideálne varené v slupce",
        price: 240,
        images: [
          "https://images.pexels.com/photos/10112133/pexels-photo-10112133.jpeg",
        ],
        category: "Zelenina",
        unit: "cca 5kg",
        inStock: true,
        stockQuantity: 15,
        rating: 4.6,
        reviews: 14,
        origin: "Českomoravská vrchovina",
        nutritionalInfo: "Vitamin C, vláknina",
      },
      {
        id: "3",
        name: "Cherry rajčátka",
        description: "Sladká cherry rajčátka ze skleníků",
        price: 160,
        images: [
          "https://images.pexels.com/photos/161512/eggplant-400-08373800-400-08373801-400-08373802-400-08373803-161512.jpeg",
        ],
        category: "Zelenina",
        unit: "1kg",
        inStock: true,
        stockQuantity: 25,
        rating: 4.7,
        reviews: 18,
        origin: "České skleníky",
        nutritionalInfo: "Lycopén, vitamin C",
      },
      {
        id: "4",
        name: "Mrkev",
        description: "Čerstvá bio mrkev",
        price: 40,
        images: [
          "https://images.pexels.com/photos/2880693/pexels-photo-2880693.jpeg",
        ],
        category: "Zelenina",
        unit: "svazek",
        inStock: true,
        stockQuantity: 35,
        rating: 4.8,
        reviews: 20,
        origin: "Bio farma",
        nutritionalInfo: "Beta-karoten, vitamin A",
      },
      {
        id: "5",
        name: "Petržel",
        description: "Aromatická petržel z vlastní produkce",
        price: 50,
        images: [
          "https://images.pexels.com/photos/606540/pexels-photo-606540.jpeg",
        ],
        category: "Bylinky",
        unit: "svazek",
        inStock: true,
        stockQuantity: 25,
        rating: 4.4,
        reviews: 7,
        origin: "Vlastní zahrada",
        nutritionalInfo: "Vitamin K, železo",
      },
      {
        id: "6",
        name: "Cibule žlutá",
        description: "Čerstvá žlutá cibule z moravských polí",
        price: 50,
        images: [
          "https://images.pexels.com/photos/208453/pexels-photo-208453.jpeg",
        ],
        category: "Zelenina",
        unit: "1kg",
        inStock: true,
        stockQuantity: 45,
        rating: 4.6,
        reviews: 12,
        origin: "Moravské pole",
        nutritionalInfo: "Vitamin C, quercetin",
      },
      {
        id: "7",
        name: "Cibule červená",
        description: "Sladká červená cibule ideálna do šalátov",
        price: 60,
        images: [
          "https://images.pexels.com/photos/7146785/pexels-photo-7146785.jpeg",
        ],
        category: "Zelenina",
        unit: "1kg",
        inStock: true,
        stockQuantity: 30,
        rating: 4.7,
        reviews: 8,
        origin: "Moravské pole",
        nutritionalInfo: "Antioxidanty, vitamin C",
      },
      {
        id: "8",
        name: "Česnek",
        description: "Aromatický česnek z domácí produkce",
        price: 160,
        images: [
          "https://images.pexels.com/photos/4084642/pexels-photo-4084642.jpeg",
        ],
        category: "Zelenina",
        unit: "0,5kg",
        inStock: true,
        stockQuantity: 20,
        rating: 4.8,
        reviews: 15,
        origin: "Domácí produkce",
        nutritionalInfo: "Allicin, vitamin B6",
      },
      {
        id: "9",
        name: "Med květový",
        description: "Přírodný květový med od místních včelařů",
        price: 240,
        images: [
          "https://images.pexels.com/photos/9228574/pexels-photo-9228574.jpeg",
        ],
        category: "Med",
        unit: "0,7kg",
        inStock: true,
        stockQuantity: 15,
        rating: 4.9,
        reviews: 25,
        origin: "Místní včelaři",
        nutritionalInfo: "Přírodné cukry, minerály",
      },
      {
        id: "10",
        name: "Med květový pastovaný",
        description: "Jemný pastovaný květový med",
        price: 240,
        images: [
          "https://images.pexels.com/photos/9228574/pexels-photo-9228574.jpeg",
        ],
        category: "Med",
        unit: "0,7kg",
        inStock: true,
        stockQuantity: 12,
        rating: 4.9,
        reviews: 18,
        origin: "Místní včelaři",
        nutritionalInfo: "Přírodné cukry, minerály",
      },
    ]);

    setOrders([
      {
        id: "ORD-2024-001",
        date: "2024-01-20",
        status: "delivered",
        total: 285,
        items: [
          {
            product: {
              id: "1",
              name: "Farmárské Brambory",
              description: "Kvalitní farmárské brambory",
              price: 160,
              images: [
                "https://images.pexels.com/photos/10112133/pexels-photo-10112133.jpeg",
              ],
              category: "Zelenina",
              unit: "cca 5kg",
              inStock: true,
              stockQuantity: 20,
              rating: 4.5,
              reviews: 22,
            },
            quantity: 1,
          },
          {
            product: {
              id: "4",
              name: "Mrkev",
              description: "Čerstvá bio mrkev",
              price: 40,
              images: [
                "https://images.pexels.com/photos/2880693/pexels-photo-2880693.jpeg",
              ],
              category: "Zelenina",
              unit: "svazek",
              inStock: true,
              stockQuantity: 35,
              rating: 4.8,
              reviews: 20,
            },
            quantity: 2,
          },
          {
            product: {
              id: "6",
              name: "Cibule žlutá",
              description: "Čerstvá žlutá cibule z moravských polí",
              price: 50,
              images: [
                "https://images.pexels.com/photos/208453/pexels-photo-208453.jpeg",
              ],
              category: "Zelenina",
              unit: "1kg",
              inStock: true,
              stockQuantity: 45,
              rating: 4.6,
              reviews: 12,
            },
            quantity: 1,
          },
        ],
        deliveryAddress: "Václavské náměstí 1, Praha 110 00",
        deliveryTime: "9:00-12:00",
        estimatedDelivery: null,
        driverName: "Jan Novák",
        driverPhone: "+420 601 111 222",
        rating: 5,
        reviewComment: "Výborná kvalita, rychlé doručení!",
        loyaltyPointsEarned: 28,
      },
      {
        id: "ORD-2024-002",
        date: "2024-01-18",
        status: "delivered",
        total: 240,
        items: [
          {
            product: {
              id: "9",
              name: "Med květový",
              description: "Přírodný květový med od místních včelařů",
              price: 240,
              images: [
                "https://images.pexels.com/photos/9228574/pexels-photo-9228574.jpeg",
              ],
              category: "Med",
              unit: "0,7kg",
              inStock: true,
              stockQuantity: 15,
              rating: 4.9,
              reviews: 25,
            },
            quantity: 1,
          },
        ],
        deliveryAddress: "Václavské náměstí 1, Praha 110 00",
        deliveryTime: "15:00-18:00",
        estimatedDelivery: null,
        driverName: "Petr Svoboda",
        driverPhone: "+420 602 333 444",
        loyaltyPointsEarned: 24,
      },
      {
        id: "ORD-2024-003",
        date: "2024-01-15",
        status: "delivered",
        total: 320,
        items: [
          {
            product: {
              id: "2",
              name: "Zámecké minibrambory",
              description: "Jemné minibrambory ideálne varené v slupce",
              price: 240,
              images: [
                "https://images.pexels.com/photos/10112133/pexels-photo-10112133.jpeg",
              ],
              category: "Zelenina",
              unit: "cca 5kg",
              inStock: true,
              stockQuantity: 15,
              rating: 4.6,
              reviews: 14,
            },
            quantity: 1,
          },
          {
            product: {
              id: "4",
              name: "Mrkev",
              description: "Čerstvá bio mrkev",
              price: 40,
              images: [
                "https://images.pexels.com/photos/2880693/pexels-photo-2880693.jpeg",
              ],
              category: "Zelenina",
              unit: "svazek",
              inStock: true,
              stockQuantity: 35,
              rating: 4.8,
              reviews: 20,
            },
            quantity: 2,
          },
        ],
        deliveryAddress: "Václavské náměstí 1, Praha 110 00",
        deliveryTime: "12:00-15:00",
        estimatedDelivery: null,
        driverName: "Jan Novák",
        driverPhone: "+420 601 111 222",
        loyaltyPointsEarned: 32,
      },
    ]);

    // Mock notifications
    setNotifications([
      {
        id: "1",
        title: "Objednávka na cestě!",
        message: "Váš řidič Jan Novák je na cestě s objednávkou #ORD-2024-001",
        date: "2024-01-20T14:30:00",
        type: "delivery",
        isRead: false,
        orderId: "ORD-2024-001",
      },
      {
        id: "2",
        title: "Nové produkty v nabídce",
        message: "Objevte čerstvé zimní zeleniny v naší nabídce!",
        date: "2024-01-19T09:00:00",
        type: "promo",
        isRead: true,
      },
      {
        id: "3",
        title: "Získali jste 15 věrnostních bodů!",
        message: "Za objednávku #ORD-2024-001 jste získali 15 bodů.",
        date: "2024-01-20T10:00:00",
        type: "loyalty",
        isRead: false,
        orderId: "ORD-2024-001",
      },
    ]);

    // Mock driver location for active order
    setDriverLocation({
      lat: 50.0826,
      lng: 14.4284,
      lastUpdate: "2024-01-20T14:45:00",
      estimatedArrival: "15:30",
    });

    // Mock loyalty rewards
    setLoyaltyRewards([
      {
        id: "1",
        name: "Sleva 10%",
        description: "Sleva 10% na další objednávku",
        pointsCost: 100,
        category: "discount",
        isAvailable: true,
      },
      {
        id: "2",
        name: "Doručení zdarma",
        description: "Bezplatné doručení na další objednávku",
        pointsCost: 200,
        category: "shipping",
        isAvailable: true,
      },
      {
        id: "3",
        name: "Bio mrkev zdarma",
        description: "1kg bio mrkve zdarma k objednávce",
        pointsCost: 150,
        category: "freeProduct",
        isAvailable: false,
      },
    ]);
  };

  // Helper functions
  const getStatusText = (status: Order["status"]) => {
    switch (status) {
      case "new":
        return "Nová";
      case "confirmed":
        return "Potvrzená";
      case "on-route":
        return "Na cestě";
      case "delivered":
        return "Doručená";
      case "cancelled":
        return "Zrušená";
      default:
        return "Nezn��mý";
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "new":
        return "bg-blue-500";
      case "confirmed":
        return "bg-yellow-500";
      case "on-route":
        return "bg-orange-500";
      case "delivered":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatPrice = (price: number) => {
    return `${price} Kč`;
  };

  const calculateCartTotal = () => {
    return cart.reduce(
      (total, item) =>
        total + (item.product.salePrice || item.product.price) * item.quantity,
      0,
    );
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.product.id === productId);
      if (existingItem && existingItem.quantity > 1) {
        return prev.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        );
      }
      return prev.filter((item) => item.product.id !== productId);
    });
  };

  const getCartItemCount = (productId: string) => {
    const item = cart.find((item) => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  const reorderItems = (order: Order) => {
    setCart(order.items);
    setActiveTab("home");
  };

  const openCheckout = () => {
    if (!currentCustomer || cart.length === 0) {
      alert("Košík je prázdny alebo nie ste prihlásený");
      return;
    }

    // Set default delivery address to current customer address
    if (currentCustomer?.address) {
      setDeliveryAddress(
        `${currentCustomer.address.street}, ${currentCustomer.address.city}`,
      );
    }

    setShowCheckout(true);
  };

  const createOrder = async () => {
    if (!currentCustomer || cart.length === 0) {
      alert("Košík je prázdny alebo nie ste prihlásený");
      return;
    }

    setIsLoading(true);
    try {
      // Prepare customer data with selected address
      const customerData = {
        ...currentCustomer,
        address: useCurrentAddress
          ? currentCustomer.address
          : {
              street: deliveryAddress,
              city: currentCustomer.address.city,
              postalCode: currentCustomer.address.postalCode,
            },
      };

      const orderData = {
        customer: customerData,
        items: cart,
        deliveryTime: deliveryTime,
        paymentMethod: paymentMethod,
        notes: orderNotes || "Objednávka z zákazníckej aplikácie",
      };

      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get response as text first to handle mixed JSON+HTML
      const responseText = await response.text();

      // Extract JSON part (everything before <script> tag)
      const jsonPart = responseText.split("<script>")[0];
      const result = JSON.parse(jsonPart);

      if (result.success) {
        // Clear cart and close checkout
        setCart([]);
        setShowCheckout(false);

        // Reset checkout form
        setUseCurrentAddress(true);
        setDeliveryAddress("");
        setDeliveryTime("9:00-12:00");
        setPaymentMethod("cod");
        setOrderNotes("");

        // Reload orders to show new order
        await loadOrdersFromWooCommerce();

        // Show success message
        alert(`Objednávka ${result.orderNumber} bola úspešne vytvorená!`);

        // Switch to orders tab
        setActiveTab("orders");
      } else {
        alert(`Chyba pri vytváraní objednávky: ${result.error}`);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Chyba pri vytváraní objednávky. Skúste to znovu.");
    } finally {
      setIsLoading(false);
    }
  };

  const checkDeliveryArea = async (postalCode: string, city: string) => {
    try {
      const response = await fetch(
        `/api/check-delivery-area?postalCode=${encodeURIComponent(postalCode)}&city=${encodeURIComponent(city)}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get response as text first to handle mixed JSON+HTML
      const responseText = await response.text();
      const jsonPart = responseText.split("<script>")[0];
      const result = JSON.parse(jsonPart);

      return result;
    } catch (error) {
      console.error("Error checking delivery area:", error);
      return {
        success: false,
        isDeliveryAvailable: false,
        message: "Chyba pri kontrole doručovacej oblasti",
      };
    }
  };

  const registerCustomer = async () => {
    // Validate fields
    if (
      !regFirstName ||
      !regLastName ||
      !regEmail ||
      !regPhone ||
      !regPassword
    ) {
      alert("Vyplňte všetky povinné polia");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      alert("Heslá sa nezhodujú");
      return;
    }

    if (regPassword.length < 6) {
      alert("Heslo musí mať aspoň 6 znakov");
      return;
    }

    setIsLoading(true);
    try {
      const city = regCity || "Praha";
      const postalCode = regPostalCode || "110 00";

      // Check delivery area first
      const deliveryCheck = await checkDeliveryArea(postalCode, city);

      // Register customer via API
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: regFirstName,
          lastName: regLastName,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
          address: {
            street: regStreet || "",
            city: city,
            postalCode: postalCode,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registrácia zlyhala");
      }

      const responseText = await response.text();
      const jsonPart = responseText.split("<script>")[0];
      const result = JSON.parse(jsonPart);

      if (result.success && result.customer) {
        // Set customer with delivery area info
        setCurrentCustomer({
          ...result.customer,
          canOrder: deliveryCheck.isDeliveryAvailable,
          deliveryMessage: deliveryCheck.message,
        });

        setShowRegistration(false);

        // Clear registration form
        setRegFirstName("");
        setRegLastName("");
        setRegEmail("");
        setRegPhone("");
        setRegPassword("");
        setRegConfirmPassword("");
        setRegStreet("");
        setRegCity("");
        setRegPostalCode("");

        alert("Registrácia úspešná! Vitajte v ZpoleDomu!");
      } else {
        throw new Error(result.error || "Registrácia zlyhala");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Chyba pri registrácii. Skúste to znovu.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loginCustomer = async (email?: string, password?: string) => {
    setIsLoading(true);
    try {
      // Use provided credentials or default test credentials
      const loginEmail = email || "jana.novakova@email.cz";
      const loginPassword = password || "password123";

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorData;
        try {
          const jsonPart = responseText.split("<script>")[0];
          errorData = JSON.parse(jsonPart);
        } catch {
          errorData = { error: `HTTP ${response.status}` };
        }
        throw new Error(errorData.error || "Prihlásenie zlyhalo");
      }

      const jsonPart = responseText.split("<script>")[0];
      const result = JSON.parse(jsonPart);

      if (result.success && result.customer) {
        // Check delivery area for the authenticated customer
        const deliveryCheck = await checkDeliveryArea(
          result.customer.address.postalCode,
          result.customer.address.city,
        );

        // Set customer with delivery area info
        const customer = {
          ...result.customer,
          canOrder: deliveryCheck.isDeliveryAvailable,
          deliveryMessage: deliveryCheck.message,
        };
        setCurrentCustomer(customer);

        // Load customer orders after login with correct email
        try {
          const ordersResponse = await fetch(
            `/api/customer-orders?customer_email=${encodeURIComponent(customer.email)}`,
          );
          if (ordersResponse.ok) {
            const ordersText = await ordersResponse.text();
            const ordersJsonPart = ordersText.split("<script>")[0];
            const ordersData = JSON.parse(ordersJsonPart);
            if (ordersData.success && ordersData.orders) {
              setOrders(ordersData.orders);
            }
          }
        } catch (orderError) {
          console.error("Error loading orders:", orderError);
          // Keep mock orders from loadBasicMockData if API fails
        }
      } else {
        throw new Error(result.error || "Prihlásenie zlyhalo");
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Chyba pri prihlasovaní. Sk��ste to znovu.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const submitRating = (order: Order) => {
    // Update order with rating
    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id ? { ...o, rating, reviewComment } : o,
      ),
    );

    // Reset rating state
    setOrderToRate(null);
    setRating(0);
    setReviewComment("");

    alert("Děkujeme za hodnocení!");
  };

  const openInMaps = () => {
    if (driverLocation) {
      const url = `https://www.google.com/maps?q=${driverLocation.lat},${driverLocation.lng}`;
      window.open(url, "_blank");
    }
  };

  // Filtered products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Login screen if no customer
  console.log("Current customer:", currentCustomer);
  if (!currentCustomer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 flex items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Carrot className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">ZpoleDomu</CardTitle>
            <p className="text-muted-foreground">Zákaznická aplikace</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                placeholder="váš@email.cz"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                type="email"
                className="py-3 text-base"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Heslo</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="py-3 text-base"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => loginCustomer(loginEmail, loginPassword)}
              disabled={isLoading}
            >
              {isLoading ? "Prihlasujem..." : "Přihlásit se"}
            </Button>
            <div className="text-center space-y-2">
              <Button
                variant="link"
                className="text-sm"
                onClick={() => {
                  console.log("Registration button clicked");
                  setShowRegistration(true);
                }}
              >
                Nemáte účet? Registrujte se
              </Button>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => loginCustomer()}
                >
                  Demo prihlásenie
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Modal */}
        {showRegistration && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[10000]"
            onClick={(e) => {
              console.log("Registration modal backdrop clicked");
              if (e.target === e.currentTarget) {
                setShowRegistration(false);
              }
            }}
          >
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Registrácia</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRegistration(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Meno *</label>
                    <Input
                      placeholder="Meno"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priezvisko *</label>
                    <Input
                      placeholder="Priezvisko"
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    placeholder="váš@email.cz"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefón *</label>
                  <Input
                    type="tel"
                    placeholder="+420 123 456 789"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Heslo *</label>
                  <Input
                    type="password"
                    placeholder="Minimálne 6 znakov"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Potvrdenie hesla *
                  </label>
                  <Input
                    type="password"
                    placeholder="Zopakujte heslo"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Adresa (voliteľné)
                  </label>
                  <Input
                    placeholder="Ulica a číslo"
                    value={regStreet}
                    onChange={(e) => setRegStreet(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mesto</label>
                    <Input
                      placeholder="Praha"
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">PSČ</label>
                    <Input
                      placeholder="110 00"
                      value={regPostalCode}
                      onChange={(e) => setRegPostalCode(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowRegistration(false)}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Zru��iť
                  </Button>
                  <Button
                    onClick={registerCustomer}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Registrujem...
                      </>
                    ) : (
                      "Registrovať sa"
                    )}
                  </Button>
                </div>

                <div className="text-center pt-2">
                  <Button
                    variant="link"
                    className="text-sm"
                    onClick={() => {
                      setShowRegistration(false);
                      // The login screen will show automatically
                    }}
                  >
                    Už máte účet? Prihláste sa
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Main app interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-foreground/20 p-2 rounded-lg">
              <Carrot className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">ZpoleDomu</h1>
              <p className="text-primary-foreground/80 text-sm">
                Vitajte, {currentCustomer.firstName}!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative hover:bg-primary-foreground/20"
            >
              <Bell className="h-5 w-5" />
              {notifications.filter((n) => !n.isRead).length > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.filter((n) => !n.isRead).length}
                </div>
              )}
            </Button>
            {cart.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="relative hover:bg-primary-foreground/20"
              >
                <ShoppingCart className="h-5 w-5" />
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </div>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="absolute top-16 right-4 left-4 bg-white rounded-lg shadow-lg border z-50 max-h-80 overflow-y-auto">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifikace</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg mb-2 ${
                  notification.isRead
                    ? "bg-gray-50"
                    : "bg-blue-50 border border-blue-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-1 rounded-full ${
                      notification.type === "delivery"
                        ? "bg-green-100"
                        : notification.type === "loyalty"
                          ? "bg-purple-100"
                          : notification.type === "promo"
                            ? "bg-orange-100"
                            : "bg-blue-100"
                    }`}
                  >
                    {notification.type === "delivery" && (
                      <Truck className="h-4 w-4 text-green-600" />
                    )}
                    {notification.type === "loyalty" && (
                      <Gift className="h-4 w-4 text-purple-600" />
                    )}
                    {notification.type === "promo" && (
                      <Star className="h-4 w-4 text-orange-600" />
                    )}
                    {notification.type === "order" && (
                      <Package className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">
                      {notification.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.date).toLocaleString("cs-CZ")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="main-content pb-24 min-h-screen">
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Načítavanie z WooCommerce...</span>
          </div>
        )}
        {/* Home Tab */}
        {activeTab === "home" && (
          <div className="p-4 space-y-4">
            {/* Delivery Area Warning */}
            {currentCustomer && !currentCustomer.canOrder && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-full">
                      <MapPin className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-800">
                        Nedoručujeme do vašej oblasti
                      </h3>
                      <p className="text-sm text-red-700">
                        {currentCustomer.deliveryMessage ||
                          "Do vašej oblasti momentálne nedoručujeme."}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Oblasť: {currentCustomer.address.city}{" "}
                        {currentCustomer.address.postalCode}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Order Alert */}
            {orders.find((o) => o.status === "on-route") && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-full">
                      <Truck className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-orange-800">
                        Objednávka na cestě!
                      </h3>
                      <p className="text-sm text-orange-700">
                        Řidič{" "}
                        {
                          orders.find((o) => o.status === "on-route")
                            ?.driverName
                        }{" "}
                        dorazí okolo{" "}
                        {
                          orders.find((o) => o.status === "on-route")
                            ?.estimatedDelivery
                        }
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveTab("orders")}
                      className="border-orange-300 text-orange-700"
                    >
                      <Package className="h-4 w-4 mr-1" />
                      Detaily
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search and Filter */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Hľadať produkty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 py-3 text-base"
                />
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="relative">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-32 object-cover"
                    />
                    {product.salePrice && (
                      <Badge className="absolute top-2 right-2 bg-red-500">
                        -
                        {Math.round(
                          (1 - product.salePrice / product.price) * 100,
                        )}
                        %
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{product.name}</h3>
                      </div>
                      <div className="text-right">
                        {product.salePrice ? (
                          <div>
                            <span className="text-lg font-bold text-red-600">
                              {formatPrice(product.salePrice)}
                            </span>
                            <div className="text-sm text-muted-foreground line-through">
                              {formatPrice(product.price)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-lg font-bold">
                            {formatPrice(product.price)}
                          </span>
                        )}
                        <div className="text-xs text-muted-foreground">
                          za {product.unit}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.floor(product.rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {product.rating} ({product.reviews})
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCartItemCount(product.id) > 0 ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFromCart(product.id)}
                              className="h-8 w-8 p-0"
                              disabled={!currentCustomer?.canOrder}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-medium px-2">
                              {getCartItemCount(product.id)}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => addToCart(product)}
                              className="h-8 w-8 p-0"
                              disabled={!currentCustomer?.canOrder}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => addToCart(product)}
                            className="flex items-center gap-2"
                            disabled={!currentCustomer?.canOrder}
                            title={
                              !currentCustomer?.canOrder
                                ? "Nedoručujeme do vašej oblasti"
                                : ""
                            }
                          >
                            <Plus className="h-4 w-4" />
                            {!currentCustomer?.canOrder
                              ? "Nedostupné"
                              : "Přidat"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Shopping Cart Summary */}
            {cart.length > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Košík</h3>
                      <p className="text-sm text-muted-foreground">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                        položek
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {formatPrice(calculateCartTotal())}
                      </div>
                      <Button
                        size="sm"
                        className="mt-1"
                        onClick={openCheckout}
                        disabled={isLoading || !currentCustomer?.canOrder}
                        title={
                          !currentCustomer?.canOrder
                            ? "Nedoručujeme do vašej oblasti"
                            : ""
                        }
                      >
                        {!currentCustomer?.canOrder ? "Nedostupné" : "Objednat"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Moje objednávky</h2>
              <Badge variant="outline">{orders.length} objednávek</Badge>
            </div>

            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">#{order.id}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.date).toLocaleDateString("cs-CZ")}
                      </p>
                    </div>
                    <Badge
                      className={`${getStatusColor(order.status)} text-white`}
                    >
                      {getStatusText(order.status)}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.product.name} × {item.quantity}
                        </span>
                        <span>
                          {formatPrice(
                            (item.product.salePrice || item.product.price) *
                              item.quantity,
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-3" />

                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold">Celkem:</span>
                    <span className="font-bold text-lg">
                      {formatPrice(order.total)}
                    </span>
                  </div>

                  <div className="text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{order.deliveryAddress}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4" />
                      <span>{order.deliveryTime}</span>
                      {order.estimatedDelivery && (
                        <Badge variant="outline" className="text-info">
                          Odhadované doručení: {order.estimatedDelivery}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {order.loyaltyPointsEarned && (
                    <div className="flex items-center gap-2 text-sm text-purple-600 mb-3">
                      <Gift className="h-4 w-4" />
                      <span>
                        Získali jste {order.loyaltyPointsEarned} věrnostních
                        bodů
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => reorderItems(order)}
                      className="flex items-center gap-2"
                    >
                      <Repeat className="h-4 w-4" />
                      Opakovat
                    </Button>

                    {order.status === "on-route" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          alert(
                            "Objednávka je na cestě! Řidič vás bude brzy kontaktovat.",
                          )
                        }
                        className="flex items-center gap-2"
                      >
                        <Truck className="h-4 w-4" />
                        Na cestě
                      </Button>
                    )}

                    {order.driverPhone && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          (window.location.href = `tel:${order.driverPhone}`)
                        }
                        className="flex items-center gap-2"
                      >
                        <Phone className="h-4 w-4" />
                        Volat
                      </Button>
                    )}

                    {order.status === "delivered" && !order.rating && (
                      <Button
                        size="sm"
                        onClick={() => setOrderToRate(order)}
                        className="flex items-center gap-2"
                      >
                        <Star className="h-4 w-4" />
                        Hodnotit
                      </Button>
                    )}
                  </div>

                  {order.rating && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">
                          Vaše hodnocení:
                        </span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < order.rating!
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {order.reviewComment && (
                        <p className="text-sm text-muted-foreground">
                          "{order.reviewComment}"
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Account Tab */}
        {activeTab === "account" && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Můj účet</h2>
              <Button variant="outline" size="sm" onClick={logoutCustomer}>
                <LogOut className="h-4 w-4 mr-2" />
                Odhlásit
              </Button>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {currentCustomer.firstName} {currentCustomer.lastName}
                    </h3>
                    <p className="text-muted-foreground">
                      {currentCustomer.email}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {currentCustomer.membershipLevel.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {currentCustomer.totalOrders}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Objednávek
                    </div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatPrice(currentCustomer.totalSpent)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Celkem utraceno
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Doručovací adresa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>{currentCustomer.address.street}</p>
                  <p>
                    {currentCustomer.address.city}{" "}
                    {currentCustomer.address.postalCode}
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Upravit adresu
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Kontaktní údaje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <strong>Telefon:</strong> {currentCustomer.phone}
                  </p>
                  <p>
                    <strong>Email:</strong> {currentCustomer.email}
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Upravit kontakt
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Nastavení notifikací
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Stav objednávky</span>
                    <Button variant="outline" size="sm">
                      Zapnuto
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Promo akce</span>
                    <Button variant="outline" size="sm">
                      Zapnuto
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Věrnostní program</span>
                    <Button variant="outline" size="sm">
                      Zapnuto
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loyalty Tab */}
        {activeTab === "loyalty" && (
          <div className="p-4 space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Věrnostní program</h2>
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-lg">
                <div className="text-3xl font-bold mb-2">
                  {currentCustomer.loyaltyPoints}
                </div>
                <div className="text-purple-100">Věrnostních bodů</div>
                <Badge className="mt-2 bg-white/20 text-white">
                  {currentCustomer.membershipLevel.toUpperCase()} člen
                </Badge>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Dostupné odměny
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loyaltyRewards.map((reward) => (
                    <div
                      key={reward.id}
                      className={`p-4 border rounded-lg ${
                        reward.isAvailable
                          ? "border-green-200 bg-green-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{reward.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {reward.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">
                              {reward.pointsCost} bodů
                            </Badge>
                            {!reward.isAvailable && (
                              <Badge variant="destructive" className="text-xs">
                                Nedostupné
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          disabled={
                            !reward.isAvailable ||
                            currentCustomer.loyaltyPoints < reward.pointsCost
                          }
                          className="whitespace-nowrap"
                        >
                          {currentCustomer.loyaltyPoints >= reward.pointsCost
                            ? "Vyměnit"
                            : "Málo bodů"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Jak získat body?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <ShoppingCart className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Za každou objednávku</div>
                      <div className="text-sm text-muted-foreground">
                        1 bod za každých 10 Kč
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Star className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Hodnocení objednávky</div>
                      <div className="text-sm text-muted-foreground">
                        5 bodů za hodnocení
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <Heart className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">Doporučení příteli</div>
                      <div className="text-sm text-muted-foreground">
                        50 bodů za nového zákazníka
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <CardContent className="p-4 text-center">
                <Award className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                <h3 className="font-semibold text-amber-800">
                  Další úroveň: GOLD
                </h3>
                <p className="text-sm text-amber-700">
                  Ještě {5000 - currentCustomer.totalSpent} Kč do upgradu!
                </p>
                <div className="w-full bg-amber-200 rounded-full h-2 mt-3">
                  <div
                    className="bg-amber-600 h-2 rounded-full"
                    style={{
                      width: `${(currentCustomer.totalSpent / 5000) * 100}%`,
                    }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Info Tab */}
        {activeTab === "info" && (
          <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold">Informace</h2>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Carrot className="h-5 w-5 text-primary" />O ZpoleDomu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">
                  Každý den přinášíme čerstvé, kvalitní produkty přímo k vám
                  domů.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-green-600" />
                    <span className="text-sm">100% lokální produkty</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Udržitelné zem��dělství</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Podpora místní komunity</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kontakt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4" />
                    <span>+420 123 456 789</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4" />
                    <span>info@zpoledomu.cz</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4" />
                    <span>Praha, Česká republika</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Často kladené otázky</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <details className="border rounded p-3">
                    <summary className="font-medium cursor-pointer">
                      Jak funguje doručování?
                    </summary>
                    <p className="text-sm text-muted-foreground mt-2">
                      Doručujeme každý den v předem domluvených časových oknech.
                      Naši řidiči vás budou kontaktovat 30 minut před doručením.
                    </p>
                  </details>
                  <details className="border rounded p-3">
                    <summary className="font-medium cursor-pointer">
                      Jak funguje věrnostní program?
                    </summary>
                    <p className="text-sm text-muted-foreground mt-2">
                      Za každou objednávku z��skáváte body, které můžete vyměnit
                      za slevy a bezplatné produkty.
                    </p>
                  </details>
                  <details className="border rounded p-3">
                    <summary className="font-medium cursor-pointer">
                      Můžu změnit objednávku?
                    </summary>
                    <p className="text-sm text-muted-foreground mt-2">
                      Objednávku můžete změnit do 2 hodin před doručením.
                      Kontaktujte nás telefonicky nebo emailem.
                    </p>
                  </details>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aplikace</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong>Verze:</strong> 1.0.0 MVP
                  </p>
                  <p>
                    <strong>Posledná aktualizace:</strong> Leden 2024
                  </p>
                  <p>
                    <strong>Platform:</strong> PWA (Progressive Web App)
                  </p>
                </div>
                <Button variant="outline" size="sm" className="mt-3">
                  Kontrolovat aktualizace
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Dokončenie objednávky</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCheckout(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Summary */}
              <div>
                <h3 className="font-semibold mb-3">Zhrnutie objednávky</h3>
                <div className="space-y-2 text-sm">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span>
                        {item.product.name} × {item.quantity}
                      </span>
                      <span>
                        {formatPrice(
                          (item.product.salePrice || item.product.price) *
                            item.quantity,
                        )}
                      </span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Celkem:</span>
                    <span>{formatPrice(calculateCartTotal())}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <h3 className="font-semibold mb-3">Doručovací adresa</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="current-address"
                      checked={useCurrentAddress}
                      onChange={() => setUseCurrentAddress(true)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="current-address" className="text-sm">
                      Použiť moju adresu
                    </label>
                  </div>
                  {useCurrentAddress && currentCustomer?.address && (
                    <div className="ml-6 text-sm text-muted-foreground">
                      {currentCustomer.address.street}
                      <br />
                      {currentCustomer.address.city}{" "}
                      {currentCustomer.address.postalCode}
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="custom-address"
                      checked={!useCurrentAddress}
                      onChange={() => setUseCurrentAddress(false)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="custom-address" className="text-sm">
                      Iná adresa
                    </label>
                  </div>
                  {!useCurrentAddress && (
                    <div className="ml-6">
                      <Input
                        placeholder="Zadajte adresu..."
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Time */}
              <div>
                <h3 className="font-semibold mb-3">Čas doručenia</h3>
                <select
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="9:00-12:00">9:00 - 12:00</option>
                  <option value="12:00-15:00">12:00 - 15:00</option>
                  <option value="15:00-18:00">15:00 - 18:00</option>
                  <option value="18:00-20:00">18:00 - 20:00</option>
                </select>
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="font-semibold mb-3">Spôsob platby</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="w-4 h-4"
                    />
                    <label htmlFor="cod" className="text-sm">
                      Hotovosťou pri doručen��
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="card"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                      className="w-4 h-4"
                    />
                    <label htmlFor="card" className="text-sm">
                      Online platba kartou
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="bank"
                      checked={paymentMethod === "bank"}
                      onChange={() => setPaymentMethod("bank")}
                      className="w-4 h-4"
                    />
                    <label htmlFor="bank" className="text-sm">
                      Bankový prevod
                    </label>
                  </div>
                </div>
              </div>

              {/* Order Notes */}
              <div>
                <h3 className="font-semibold mb-3">Poznámka k objednávke</h3>
                <Textarea
                  placeholder="Napríklad: Prosím, zazvonit pri dverách..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCheckout(false)}
                  className="flex-1"
                >
                  Zrušiť
                </Button>
                <Button
                  onClick={createOrder}
                  disabled={
                    isLoading || (!useCurrentAddress && !deliveryAddress.trim())
                  }
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Vytvára sa...
                    </>
                  ) : (
                    `Objednať za ${formatPrice(calculateCartTotal())}`
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rating Dialog */}
      {orderToRate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Hodnocení objednávky</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOrderToRate(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Jak hodnotíte objednávku #{orderToRate.id}?
                  </p>
                  <div className="flex justify-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`p-1 ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
                      >
                        <Star className="h-8 w-8 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Komentář (nepovinné)
                  </label>
                  <Textarea
                    placeholder="Jak jste spokojen s kvalitou produkt�� a doručením?"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => submitRating(orderToRate)}
                    disabled={rating === 0}
                    className="flex-1"
                  >
                    Odeslat hodnocení
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setOrderToRate(null)}
                  >
                    Zrušit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
            )}
      </div>

      {/* FIXED BOTTOM NAVIGATION - ALWAYS VISIBLE AFTER LOGIN */}
      <div
        style={{
          position: 'fixed',
          bottom: '0',
          left: '0',
          right: '0',
          backgroundColor: 'white',
          borderTop: '1px solid #e5e7eb',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          zIndex: '999999',
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px',
            width: '100%',
            padding: '8px'
          }}
        >
          <button
            onClick={() => setActiveTab("home")}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 4px',
              background: activeTab === "home" ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
              color: activeTab === "home" ? '#22c55e' : '#6b7280',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '11px',
              minHeight: '50px'
            }}
          >
            <Home style={{ width: '20px', height: '20px', marginBottom: '4px' }} />
            <span>Domov</span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 4px',
              background: activeTab === "orders" ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
              color: activeTab === "orders" ? '#22c55e' : '#6b7280',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '11px',
              minHeight: '50px',
              position: 'relative'
            }}
          >
            <Package style={{ width: '20px', height: '20px', marginBottom: '4px' }} />
            <span>Objednávky</span>
            {orders.filter((o) => o.status === "on-route").length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "8px",
                  background: "#f97316",
                  color: "white",
                  fontSize: "10px",
                  borderRadius: "50%",
                  width: "16px",
                  height: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {orders.filter((o) => o.status === "on-route").length}
              </div>
            )}
          </button>

          <button
            onClick={() => setActiveTab("account")}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 4px',
              background: activeTab === "account" ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
              color: activeTab === "account" ? '#22c55e' : '#6b7280',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '11px',
              minHeight: '50px'
            }}
          >
            <User style={{ width: '20px', height: '20px', marginBottom: '4px' }} />
            <span>Účet</span>
          </button>

          <button
            onClick={() => setActiveTab("loyalty")}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 4px',
              background: activeTab === "loyalty" ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
              color: activeTab === "loyalty" ? '#22c55e' : '#6b7280',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '11px',
              minHeight: '50px'
            }}
          >
            <Gift style={{ width: '20px', height: '20px', marginBottom: '4px' }} />
            <span>Věrnost</span>
          </button>

          <button
            onClick={() => setActiveTab("info")}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 4px',
              background: activeTab === "info" ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
              color: activeTab === "info" ? '#22c55e' : '#6b7280',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '11px',
              minHeight: '50px'
            }}
          >
            <Info style={{ width: '20px', height: '20px', marginBottom: '4px' }} />
            <span>Info</span>
          </button>
        </div>
      </div>
    </div>
  );
}