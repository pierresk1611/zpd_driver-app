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
  Copy,
  ChefHat,
  Users,
  BookOpen,
  Utensils,
} from "lucide-react";

// Import recipes data
import { Recipe, getAllRecipes, getRecommendedRecipes, getRecipeById } from "../data/recipes";

// Import push notifications
import { pushNotificationClient } from "../lib/push-notifications";

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
    "home" | "orders" | "account" | "loyalty" | "recipes" | "info"
  >("home");

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [orderToRate, setOrderToRate] = useState<Order | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [showDriverMap, setShowDriverMap] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Checkout state
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [useCurrentAddress, setUseCurrentAddress] = useState(true);
  const [deliveryTime, setDeliveryTime] = useState("9:00-12:00");
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [orderNotes, setOrderNotes] = useState("");

  // Recipes states
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipesFilter, setRecipesFilter] = useState<'all' | 'recommended' | 'easy'>('all');
  const [showRecipeDetail, setShowRecipeDetail] = useState(false);

  // Detailed address fields
  const [customStreet, setCustomStreet] = useState("");
  const [customNumber, setCustomNumber] = useState("");
  const [customPostalCode, setCustomPostalCode] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [isAddressValid, setIsAddressValid] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  // Registration state
  const [showRegistration, setShowRegistration] = useState(false);

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

    // Reset address fields
    setDeliveryAddress("");
    setCustomStreet("");
    setCustomNumber("");
    setCustomPostalCode("");
    setCustomCity("");
    setIsAddressValid(false);
    setAvailableTimeSlots([]);
    setUseCurrentAddress(true);
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

  // Load data on mount
  useEffect(() => {
    loadWooCommerceData();

    // Listen for recipe notification clicks
    const handleShowRecipes = (event: CustomEvent) => {
      setActiveTab('recipes');
      if (event.detail?.source === 'notification') {
        console.log('📱 Switched to recipes from notification');
      }
    };

    window.addEventListener('showRecipes', handleShowRecipes as EventListener);

    return () => {
      window.removeEventListener('showRecipes', handleShowRecipes as EventListener);
    };
  }, []);

  // Initialize push notifications when customer logs in
  useEffect(() => {
    if (currentCustomer?.phone) {
      initializePushNotifications(currentCustomer.phone);
    }
  }, [currentCustomer?.phone]);

  // Initialize push notifications
  const initializePushNotifications = async (customerPhone: string) => {
    try {
      if (pushNotificationClient.isSupported()) {
        console.log('📱 Initializing push notifications for:', customerPhone);
        await pushNotificationClient.initialize(customerPhone);

        // Load notification inbox
        const inbox = await pushNotificationClient.getNotificationInbox();

        // Ensure inbox is an array before mapping
        if (Array.isArray(inbox) && inbox.length > 0) {
          setNotifications(inbox.map(notif => ({
            id: notif.id,
            title: notif.title,
            message: notif.body,
            date: notif.createdAt,
            type: 'delivery',
            isRead: notif.read
          })));
        } else {
          console.log('📱 No notifications in inbox or invalid format');
          setNotifications([]);
        }
      } else {
        console.log('📱 Push notifications not supported on this device');
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };

  const loadWooCommerceData = async () => {
    setIsLoading(true);
    try {
      await loadProductsFromWooCommerce();
    } catch (error) {
      console.error("Error loading WooCommerce data:", error);
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
      const responseText = await response.text();
      const jsonPart = responseText.split("<script>")[0];
      const data = JSON.parse(jsonPart);

      if (data.success && data.products) {
        const cleanProducts = data.products.map((product: any) => ({
          id: product.id,
          name: product.name,
          description: product.description || "Čerstvý kvalitný produkt",
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

  const loadOldMockData = () => {
    // Basic mock products
    setProducts([
      {
        id: "1",
        name: "Farmárske Brambory",
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
        description: "Čerstvá žlutá cibule z moravsk��ch polí",
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
        description: "Přírodný květov�� med od místních včela��ů",
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
        origin: "Místn�� včelaři",
        nutritionalInfo: "Přírodné cukry, minerály",
      },
    ]);

    setOrders([
      {
        id: "ORD-2024-003",
        date: new Date().toISOString().split("T")[0],
        status: "on-route",
        total: 320,
        items: [],
        deliveryAddress: "Václavské náměstí 1, Praha 110 00",
        deliveryTime: "15:00-18:00",
        estimatedDelivery: "15:45",
        driverName: "Petr Svoboda",
        driverPhone: "+420 602 333 444",
        loyaltyPointsEarned: 32,
      },
      {
        id: "ORD-2024-001",
        date: "2024-01-20",
        status: "delivered",
        total: 285,
        items: [],
        deliveryAddress: "Václavské náměstí 1, Praha 110 00",
        deliveryTime: "9:00-12:00",
        driverName: "Jan Novák",
        driverPhone: "+420 601 111 222",
        rating: 5,
        reviewComment: "Výborná kvalita, rychlé doručení!",
        loyaltyPointsEarned: 28,
      },
    ]);
  };

  // Address validation and delivery availability
  const validateAddressAndCheckAvailability = async () => {
    console.log("🔍 Validating address and checking delivery availability...");

    if (!customStreet || !customNumber || !customPostalCode || !customCity) {
      setIsAddressValid(false);
      setAvailableTimeSlots([]);
      return;
    }

    // Mock validation - in real app this would call delivery area API
    const validPostalCodes = [
      "110 00",
      "111 00",
      "120 00",
      "130 00",
      "140 00",
      "150 00",
      "160 00",
    ];
    const isValidArea = validPostalCodes.some((code) =>
      customPostalCode.replace(/\s/g, "").includes(code.replace(/\s/g, "")),
    );

    if (isValidArea) {
      setIsAddressValid(true);

      // Mock available time slots based on postal code and date
      const baseSlots = [
        "9:00-12:00",
        "12:00-15:00",
        "15:00-18:00",
        "18:00-20:00",
      ];

      // Simulate some slots being unavailable
      const availableSlots = baseSlots.filter((slot, index) => {
        const rand = (customPostalCode.charCodeAt(0) + index) % 4;
        return rand !== 0; // Remove some slots randomly
      });

      setAvailableTimeSlots(
        availableSlots.length > 0 ? availableSlots : ["15:00-18:00"],
      );

      if (availableSlots.length > 0) {
        setDeliveryTime(availableSlots[0]);
      }
    } else {
      setIsAddressValid(false);
      setAvailableTimeSlots([]);
    }
  };

  const loadBasicMockData = () => {
    console.log("📦 Loading mock products...");

    const mockProducts: Product[] = [
      {
        id: "1",
        name: "Čerstvé mrkvy",
        description:
          "Lahodné bio mrkvy z lokálnej farmy. Bohaté na vitamíny a minerály.",
        price: 45,
        salePrice: 35,
        images: ["/placeholder.svg"],
        category: "Zelenina",
        inStock: true,
        stockQuantity: 50,
        rating: 4.8,
        reviews: 24,
        unit: "kg",
        origin: "Bio farma Novák",
        nutritionalInfo: "Vitamín A, beta-karotén, vláknina",
      },
      {
        id: "2",
        name: "Čerstvé rajčiny",
        description:
          "Šťavnaté rajčiny ideálne na šaláty či varenie. Pestované bez pesticídov.",
        price: 85,
        images: ["/placeholder.svg"],
        category: "Zelenina",
        inStock: true,
        stockQuantity: 30,
        rating: 4.6,
        reviews: 18,
        unit: "kg",
        origin: "Farma Zelený háj",
      },
      {
        id: "3",
        name: "Čerstvé brambory",
        description:
          "Kvalitné brambory na varenie, pečenie alebo prípravu hranolkov.",
        price: 25,
        images: ["/placeholder.svg"],
        category: "Zelenina",
        inStock: true,
        stockQuantity: 100,
        rating: 4.5,
        reviews: 32,
        unit: "kg",
        origin: "Halbich - Bramborárna",
      },
      {
        id: "4",
        name: "Bio salát",
        description:
          "Čerstvý hlávkový salát. Perfektný základ pre zdravé šaláty.",
        price: 35,
        salePrice: 28,
        images: ["/placeholder.svg"],
        category: "Zelenina",
        inStock: true,
        stockQuantity: 25,
        rating: 4.7,
        reviews: 15,
        unit: "ks",
        origin: "Farma Zelený háj",
      },
      {
        id: "5",
        name: "Čerstvé cibule",
        description:
          "Kvalitné žlté cibule. Nepostrádateľná súčasť každej kuchyne.",
        price: 20,
        images: ["/placeholder.svg"],
        category: "Zelenina",
        inStock: true,
        stockQuantity: 80,
        rating: 4.3,
        reviews: 12,
        unit: "kg",
        origin: "Sklad - Rudná",
      },
    ];

    setProducts(mockProducts);

    const mockNotifications: Notification[] = [
      {
        id: "1",
        title: "Nová objednávka potvrdená",
        message:
          "Vaša objednávka #1001 bola úspešne spracovaná a odoslána na doručenie.",
        isRead: false,
        date: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        type: "order",
      },
      {
        id: "2",
        title: "Zľava na bio produkty",
        message:
          "Tento týždeň máme 20% zľavu na všetky bio produkty. Nenechajte si ujsť túto príležitosť!",
        isRead: false,
        date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        type: "promo",
      },
    ];

    // Notifications will be loaded from push notification service
    console.log("✅ Mock data loaded successfully");
  };

  const loginCustomer = async (email?: string, password?: string) => {
    console.log("🔄 Demo login started...");
    setIsLoading(true);
    try {
      const loginEmail = email || "jana.novakova@email.cz";
      const loginPassword = password || "password123";

      console.log("✅ Setting customer data...");

      // Mock successful login
      const customerData = {
        id: "1",
        email: loginEmail,
        firstName: "Jana",
        lastName: "Nováková",
        phone: "+420 123 456 789",
        address: {
          street: "Václavské náměstí 1",
          city: "Praha",
          postalCode: "110 00",
        },
        loyaltyPoints: 450,
        membershipLevel: "silver" as const,
        totalOrders: 12,
        totalSpent: 3250,
        canOrder: true,
      };

      setCurrentCustomer(customerData);
      console.log("✅ Customer set:", customerData);

      loadBasicMockData();
      console.log("✅ Demo login completed!");
    } catch (error) {
      console.error("❌ Error during login:", error);
      alert("Chyba pri prihlasovaní: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `${price} Kč`;
  };

  // Get unread notifications count
  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

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

  // Filtered products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Login screen if no customer
  if (!currentCustomer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-amber-50 p-3 rounded-lg">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2Ff3633e12daac412e91e11e78fe974d05%2F694ef1aed4c64b0287d248cc8560765c?format=webp&width=800"
                  alt="ZpoleDomu.cz logo"
                  className="h-12 w-12 object-contain"
                />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-700">
              ZpoleDomu.cz
            </CardTitle>
            <p className="text-green-600">Zákaznická aplikace</p>
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
                onClick={() => setShowRegistration(true)}
              >
                Nemáte účet? Registrujte se
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main app interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Ff3633e12daac412e91e11e78fe974d05%2F694ef1aed4c64b0287d248cc8560765c?format=webp&width=800"
                alt="ZpoleDomu.cz logo"
                className="h-6 w-6 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold">ZpoleDomu.cz</h1>
              <p className="text-white/80 text-sm">
                Vitajte, {currentCustomer.firstName}!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("info")}
              className="hover:bg-primary-foreground/20"
            >
              <Info className="h-5 w-5" />
            </Button>
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

      {/* TOP NAVIGATION - ALWAYS VISIBLE */}
      <div
        style={{
          backgroundColor: "white",
          borderBottom: "1px solid #e5e7eb",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          padding: "8px",
          position: "sticky",
          top: "0",
          zIndex: "1000",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "8px",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          <button
            onClick={() => setActiveTab("home")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 4px",
              background:
                activeTab === "home" ? "rgba(34, 197, 94, 0.1)" : "transparent",
              color: activeTab === "home" ? "#22c55e" : "#6b7280",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "11px",
              minHeight: "50px",
            }}
          >
            <Home
              style={{ width: "20px", height: "20px", marginBottom: "4px" }}
            />
            <span>Domů</span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 4px",
              background:
                activeTab === "orders"
                  ? "rgba(34, 197, 94, 0.1)"
                  : "transparent",
              color: activeTab === "orders" ? "#22c55e" : "#6b7280",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "11px",
              minHeight: "50px",
              position: "relative",
            }}
          >
            <Package
              style={{ width: "20px", height: "20px", marginBottom: "4px" }}
            />
            <span>Objednávky</span>
          </button>

          <button
            onClick={() => setActiveTab("account")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 4px",
              background:
                activeTab === "account"
                  ? "rgba(34, 197, 94, 0.1)"
                  : "transparent",
              color: activeTab === "account" ? "#22c55e" : "#6b7280",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "11px",
              minHeight: "50px",
              position: "relative",
            }}
          >
            <User
              style={{ width: "20px", height: "20px", marginBottom: "4px" }}
            />
            <span>Účet</span>
            {unreadNotificationsCount > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px",
                  fontSize: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                }}
              >
                {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
              </div>
            )}
          </button>

          <button
            onClick={() => setActiveTab("loyalty")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 4px",
              background:
                activeTab === "loyalty"
                  ? "rgba(34, 197, 94, 0.1)"
                  : "transparent",
              color: activeTab === "loyalty" ? "#22c55e" : "#6b7280",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "11px",
              minHeight: "50px",
            }}
          >
            <Gift
              style={{ width: "20px", height: "20px", marginBottom: "4px" }}
            />
            <span>Věrnost</span>
          </button>

          <button
            onClick={() => setActiveTab("recipes")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 4px",
              background:
                activeTab === "recipes" ? "rgba(34, 197, 94, 0.1)" : "transparent",
              color: activeTab === "recipes" ? "#22c55e" : "#6b7280",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              flex: 1,
              fontSize: "12px",
              fontWeight: "500",
            }}
          >
            <ChefHat
              style={{ width: "20px", height: "20px", marginBottom: "4px" }}
            />
            <span>Recepty</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="min-h-screen pb-32"
        style={{
          overflowY: "auto",
          height: "calc(100vh - 140px)",
          minHeight: "320px", // Support for iPhone SE (320px width)
        }}
      >
        {/* Home Tab */}
        {activeTab === "home" && (
          <div className="p-4 space-y-4">
            {/* Search */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Hľadať produkty... (napr. brambory, mrkev)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 py-3 text-base"
                  title="Vyhľadajte produkty podľa názvu"
                />
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
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
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => addToCart(product)}
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Přidat
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Shopping Cart Summary - Fixed Position */}
            {cart.length > 0 && !showCheckout && (
              <div
                style={{
                  position: "fixed",
                  bottom: "70px",
                  left: "16px",
                  right: "16px",
                  zIndex: "1000",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  border: "1px solid rgba(34, 197, 94, 0.2)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  padding: "16px",
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-green-800">Košík</h3>
                    <p className="text-sm text-muted-foreground">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                      položiek
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {formatPrice(calculateCartTotal())}
                    </div>
                    <Button
                      size="sm"
                      className="mt-2 bg-green-600 hover:bg-green-700 px-6 py-2"
                      onClick={() => setShowCheckout(true)}
                      disabled={isLoading}
                      title="Prejsť na objednávku - zadajte dodacie údaje"
                    >
                      Objednat
                    </Button>
                  </div>
                </div>
              </div>
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
                    <Badge className="bg-green-500 text-white">Doručená</Badge>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold">Celkem:</span>
                    <span className="font-bold text-lg">
                      {formatPrice(order.total)}
                    </span>
                  </div>

                  {/* Order Actions */}
                  <div className="flex gap-2 mb-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Reorder functionality
                        const mockItems = [
                          {
                            product: {
                              id: "1",
                              name: "Farmársk�� Brambory",
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
                        ];
                        setCart(mockItems);
                        setActiveTab("home");
                        alert("Produkty pridané do košíka!");
                      }}
                      className="flex items-center gap-2"
                    >
                      <Repeat className="h-4 w-4" />
                      Opakovať
                    </Button>

                    {order.status === "on-route" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDriverMap(true);
                        }}
                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600"
                        title="Kliknite pre zobrazenie trasy doručenia"
                      >
                        <Navigation className="h-4 w-4" />
                        Sledovať vodiča
                      </Button>
                    )}

                    {order.status === "delivered" && !order.rating && (
                      <Button
                        size="sm"
                        onClick={() => setOrderToRate(order)}
                        className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600"
                      >
                        <Star className="h-4 w-4" />
                        Hodnotiť
                      </Button>
                    )}
                  </div>

                  {/* Show rating if exists */}
                  {order.rating && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">
                          Vaše hodnotenie:
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
              <h2 className="text-xl font-bold">Môj účet</h2>
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
              </CardContent>
            </Card>

            {/* Push Notifications Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Push notifikácie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Info className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-800 mb-1">
                          Prečo zapnúť notifikácie?
                        </h4>
                        <p className="text-sm text-blue-700">
                          Budeme vás informovať o stave vašich objednávok v
                          reálnom čase
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium">Stav objednávky</div>
                          <div className="text-sm text-muted-foreground">
                            "Objednávka potvrdená", "Na ceste k vám"
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-green-50 border-green-200 text-green-700 min-h-[44px] px-4"
                        onClick={() => {
                          alert("Notifikácie o stave objednávky sú zapnuté");
                        }}
                      >
                        Zapnuté
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Truck className="h-5 w-5 text-orange-600" />
                        <div>
                          <div className="font-medium">Doručenie</div>
                          <div className="text-sm text-muted-foreground">
                            "Vodič je 5 min od vás", "Objednávka doručená"
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-green-50 border-green-200 text-green-700 min-h-[44px] px-4"
                        onClick={() => {
                          alert("Notifikácie o doručení sú zapnuté");
                        }}
                      >
                        Zapnuté
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Star className="h-5 w-5 text-purple-600" />
                        <div>
                          <div className="font-medium">Akcie a odmeny</div>
                          <div className="text-sm text-muted-foreground">
                            "Nové produkty", "Vernostné body", "Zľavy"
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-50 border-gray-200 text-gray-600 min-h-[44px] px-4"
                        onClick={() => {
                          alert(
                            "Notifikácie o akciách a odmenách sú vypnuté. Kliknite pre zapnutie.",
                          );
                        }}
                      >
                        Vypnuté
                      </Button>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      // OneSignal integration would go here
                      alert(
                        "Notifikácie zapnuté! Budeme vás informovať o stave objednávok.",
                      );
                    }}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Zapnúť push notifikácie
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Notifikácie môžete kedykoľvek vypnúť v nastaveniach telefónu
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Notification Inbox */}
            {notifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifikácie ({unreadNotificationsCount} neprecítaných)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border rounded-lg ${
                          !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                        }`}
                        onClick={() => {
                          if (!notification.isRead) {
                            pushNotificationClient.markAsRead(notification.id);
                            setNotifications(prev =>
                              prev.map(n =>
                                n.id === notification.id ? { ...n, isRead: true } : n
                              )
                            );
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${
                            notification.type === 'delivery' ? 'bg-green-100' :
                            notification.type === 'order' ? 'bg-blue-100' :
                            'bg-purple-100'
                          }`}>
                            {notification.type === 'delivery' ? (
                              <Truck className="h-4 w-4 text-green-600" />
                            ) : notification.type === 'order' ? (
                              <Package className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Star className="h-4 w-4 text-purple-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className={`font-medium ${!notification.isRead ? 'text-blue-800' : ''}`}>
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(notification.date).toLocaleString('cs-CZ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {notifications.length > 5 && (
                      <div className="text-center">
                        <Button variant="outline" size="sm">
                          Zobraziť všetky notifikácie
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Loyalty Tab */}
        {activeTab === "loyalty" && (
          <div className="p-4 space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-4">Věrnostní program</h2>
            </div>

            {/* Coming soon */}
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="p-8 text-center">
                <div className="bg-gray-100 p-4 rounded-full w-fit mx-auto mb-4">
                  <Gift className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-700 mb-3">
                  Spúšťame čoskoro!
                </h3>
                <p className="text-gray-500 text-lg">
                  Věrnostní program bude k dispozici již brzy.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recipes Tab */}
        {activeTab === "recipes" && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ChefHat className="h-6 w-6 text-green-600" />
                Recepty
              </h2>
              {!showRecipeDetail && (
                <select
                  value={recipesFilter}
                  onChange={(e) => setRecipesFilter(e.target.value as 'all' | 'recommended' | 'easy')}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="all">Všechny recepty</option>
                  <option value="recommended">Doporučené</option>
                  <option value="easy">Jednoduché</option>
                </select>
              )}
            </div>

            {showRecipeDetail && selectedRecipe ? (
              // Recipe Detail View
              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => setShowRecipeDetail(false)}
                  className="mb-4"
                >
                  ← Zpět na recepty
                </Button>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">{selectedRecipe.title}</CardTitle>
                    <p className="text-muted-foreground">{selectedRecipe.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <img
                      src={selectedRecipe.image}
                      alt={selectedRecipe.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="flex flex-col items-center">
                        <Clock className="h-5 w-5 text-gray-500 mb-1" />
                        <span className="text-sm font-medium">{selectedRecipe.prepTime} min</span>
                        <span className="text-xs text-gray-500">Příprava</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Users className="h-5 w-5 text-gray-500 mb-1" />
                        <span className="text-sm font-medium">{selectedRecipe.servings} porce</span>
                        <span className="text-xs text-gray-500">Mno��ství</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Star className="h-5 w-5 text-gray-500 mb-1" />
                        <span className="text-sm font-medium capitalize">{selectedRecipe.difficulty}</span>
                        <span className="text-xs text-gray-500">Obtížnost</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Ingredience:</h3>
                      <div className="grid gap-2">
                        {selectedRecipe.ingredients.map((ingredient, index) => (
                          <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                            <span>{ingredient.name}</span>
                            <span className="text-sm text-gray-600">{ingredient.amount} {ingredient.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Postup přípravy:</h3>
                      <ol className="space-y-2">
                        {selectedRecipe.instructions.map((step, index) => (
                          <li key={index} className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <span className="text-sm">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {selectedRecipe.nutritionInfo && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Nutriční hodnoty (na porci):</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Kalorie: {selectedRecipe.nutritionInfo.calories} kcal</div>
                          <div>Bílkoviny: {selectedRecipe.nutritionInfo.protein}g</div>
                          <div>Sacharidy: {selectedRecipe.nutritionInfo.carbs}g</div>
                          <div>Tuky: {selectedRecipe.nutritionInfo.fat}g</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              // Recipes List View
              <div className="space-y-4">
                {(() => {
                  let recipesToShow = getAllRecipes();

                  if (recipesFilter === 'recommended') {
                    // Get recommended recipes based on last order
                    const lastOrderItems = mockOrders.length > 0
                      ? mockOrders[0].items.map(item => item.name)
                      : ['Brambory', 'Mrkev']; // fallback
                    recipesToShow = getRecommendedRecipes(lastOrderItems);
                  } else if (recipesFilter === 'easy') {
                    recipesToShow = recipesToShow.filter(recipe => recipe.difficulty === 'easy');
                  }

                  if (recipesToShow.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">Žádné recepty nenalezeny</p>
                      </div>
                    );
                  }

                  return recipesToShow.map((recipe) => (
                    <Card key={recipe.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent
                        className="p-4"
                        onClick={() => {
                          setSelectedRecipe(recipe);
                          setShowRecipeDetail(true);
                        }}
                      >
                        <div className="flex gap-4">
                          <img
                            src={recipe.image}
                            alt={recipe.title}
                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold mb-1">{recipe.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {recipe.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {recipe.prepTime} min
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {recipe.servings} porce
                              </span>
                              <Badge variant={recipe.difficulty === 'easy' ? 'default' : recipe.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                                {recipe.difficulty}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {recipe.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ));
                })()}
              </div>
            )}
          </div>
        )}

        {/* Info Tab */}
        {activeTab === "info" && (
          <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold">Informace</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2Ff3633e12daac412e91e11e78fe974d05%2F694ef1aed4c64b0287d248cc8560765c?format=webp&width=800"
                    alt="ZpoleDomu.cz logo"
                    className="h-5 w-5 object-contain"
                  />
                  O ZpoleDomu.cz
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">
                  Každý den přinášíme čerstvé, kvalitní produkty přímo k vám
                  domů.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          style={{ zIndex: "9999" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCheckout(false);
            }
          }}
        >
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
                    <div className="ml-6 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600">
                            Ulica *
                          </label>
                          <Input
                            placeholder="Napríklad: Václavské náměstí"
                            value={customStreet}
                            onChange={(e) => setCustomStreet(e.target.value)}
                            onBlur={validateAddressAndCheckAvailability}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">
                            Číslo *
                          </label>
                          <Input
                            placeholder="Napríklad: 1"
                            value={customNumber}
                            onChange={(e) => setCustomNumber(e.target.value)}
                            onBlur={validateAddressAndCheckAvailability}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600">
                            PSČ *
                          </label>
                          <Input
                            placeholder="Napríklad: 110 00"
                            value={customPostalCode}
                            onChange={(e) =>
                              setCustomPostalCode(e.target.value)
                            }
                            onBlur={validateAddressAndCheckAvailability}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">
                            Mesto *
                          </label>
                          <Input
                            placeholder="Napríklad: Praha"
                            value={customCity}
                            onChange={(e) => setCustomCity(e.target.value)}
                            onBlur={validateAddressAndCheckAvailability}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      {/* Address validation feedback */}
                      {(customStreet ||
                        customNumber ||
                        customPostalCode ||
                        customCity) && (
                        <div
                          className={`p-2 rounded text-xs ${isAddressValid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                        >
                          {isAddressValid ? (
                            <div className="flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              Doručenie dostupné na túto adresu
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <X className="h-3 w-3" />
                              Na túto adresu momentálne nedoručujeme. Skúste inú
                              adresu v Prahe.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Date and Time */}
              <div className="space-y-4">
                {/* Delivery Date */}
                <div>
                  <h3 className="font-semibold mb-3">Dátum doručenia</h3>
                  <Input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => {
                      setDeliveryDate(e.target.value);
                      if (!useCurrentAddress) {
                        validateAddressAndCheckAvailability();
                      }
                    }}
                    min={(() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      return tomorrow.toISOString().split("T")[0];
                    })()}
                    max={(() => {
                      const maxDate = new Date();
                      maxDate.setDate(maxDate.getDate() + 14); // 2 weeks in advance
                      return maxDate.toISOString().split("T")[0];
                    })()}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Doručujeme od nasledujúceho dňa až do 2 t��ždňov vopred
                  </p>
                </div>

                {/* Delivery Time */}
                <div>
                  <h3 className="font-semibold mb-3">Čas doručenia</h3>
                  {!useCurrentAddress &&
                  !isAddressValid &&
                  (customStreet ||
                    customNumber ||
                    customPostalCode ||
                    customCity) ? (
                    <div className="p-3 bg-gray-100 rounded text-sm text-gray-600">
                      Najprv overte adresu pre zobrazenie dostupných časov
                      doručenia
                    </div>
                  ) : (
                    <select
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="w-full p-2 border rounded-md"
                      disabled={!useCurrentAddress && !isAddressValid}
                    >
                      {(useCurrentAddress
                        ? [
                            "9:00-12:00",
                            "12:00-15:00",
                            "15:00-18:00",
                            "18:00-20:00",
                          ]
                        : availableTimeSlots
                      ).map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  )}
                  {availableTimeSlots.length > 0 && !useCurrentAddress && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ {availableTimeSlots.length} časových slotov dostupných
                      pre vašu adresu
                    </p>
                  )}
                </div>
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
                      Hotovosťou pri doručení
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
                  onClick={() => {
                    if (!useCurrentAddress && !isAddressValid) {
                      alert("Prosím, zadajte platnú adresu doručenia.");
                      return;
                    }

                    // Create order with detailed information
                    const orderData = {
                      items: cart,
                      total: calculateCartTotal(),
                      deliveryDate,
                      deliveryTime,
                      address: useCurrentAddress
                        ? `${currentCustomer?.address?.street}, ${currentCustomer?.address?.city} ${currentCustomer?.address?.postalCode}`
                        : `${customStreet} ${customNumber}, ${customCity} ${customPostalCode}`,
                      paymentMethod,
                      notes: orderNotes,
                      customer: currentCustomer,
                    };

                    console.log("📦 Creating order:", orderData);
                    alert(
                      `Objednávka úspešne vytvorená na ${deliveryDate} v čase ${deliveryTime}! Ďakujeme za nákup.`,
                    );

                    // Reset form
                    setCart([]);
                    setShowCheckout(false);
                    setCustomStreet("");
                    setCustomNumber("");
                    setCustomPostalCode("");
                    setCustomCity("");
                    setIsAddressValid(false);
                    setAvailableTimeSlots([]);
                    setUseCurrentAddress(true);
                  }}
                  disabled={
                    isLoading ||
                    (!useCurrentAddress &&
                      (!isAddressValid ||
                        !customStreet ||
                        !customNumber ||
                        !customPostalCode ||
                        !customCity)) ||
                    cart.length === 0
                  }
                  className="flex-1 bg-green-600 hover:bg-green-700"
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

      {/* Rating Modal */}
      {orderToRate && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          style={{ zIndex: "9999" }}
        >
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Hodnotenie objednávky</CardTitle>
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
                    Ako hodnotíte objednávku #{orderToRate.id}?
                  </p>
                  <div className="flex justify-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`p-1 transition-colors ${
                          star <= rating ? "text-yellow-400" : "text-gray-300"
                        }`}
                      >
                        <Star className="h-8 w-8 fill-current" />
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    {rating === 1 && "Veľmi nespokojný"}
                    {rating === 2 && "Nespokojný"}
                    {rating === 3 && "Priemerný"}
                    {rating === 4 && "Spokojný"}
                    {rating === 5 && "Veľmi spokojný"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Komentár (nepovinné)
                  </label>
                  <Textarea
                    placeholder="Ako ste spokojní s kvalitou produktov a doručením?"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (rating === 0) {
                        alert("Prosím, vyberte hodnotenie");
                        return;
                      }

                      // Update order with rating
                      setOrders((prev) =>
                        prev.map((o) =>
                          o.id === orderToRate.id
                            ? { ...o, rating, reviewComment }
                            : o,
                        ),
                      );

                      // Reset rating state
                      setOrderToRate(null);
                      setRating(0);
                      setReviewComment("");

                      alert("Ďakujeme za hodnotenie!");
                    }}
                    disabled={rating === 0}
                    className="flex-1"
                  >
                    Odoslať hodnotenie
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOrderToRate(null);
                      setRating(0);
                      setReviewComment("");
                    }}
                  >
                    Zrušiť
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Driver Map Modal */}
      {showDriverMap && selectedOrder && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          style={{ zIndex: "9999" }}
        >
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sledovanie vodiča</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDriverMap(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Driver Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Truck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">
                      Vodič: {selectedOrder.driverName}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Objednávka #{selectedOrder.id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>ETA: {selectedOrder.estimatedDelivery}</span>
                  <Badge
                    variant="outline"
                    className="bg-green-100 border-green-300 text-green-700"
                  >
                    Na ceste
                  </Badge>
                </div>
              </div>

              {/* Simulated Map */}
              <div
                className="relative bg-gray-100 rounded-lg overflow-hidden"
                style={{ height: "300px" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100">
                  {/* Mock map background */}
                  <div className="w-full h-full relative">
                    {/* Road lines */}
                    <svg className="absolute inset-0 w-full h-full">
                      <path
                        d="M 20 50 Q 150 20 280 80 Q 350 120 380 200 Q 400 250 350 280"
                        stroke="#6B7280"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray="5,5"
                      />
                    </svg>

                    {/* Destination marker */}
                    <div
                      className="absolute bg-red-500 text-white p-2 rounded-full shadow-lg"
                      style={{ top: "270px", left: "340px" }}
                    >
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div
                      className="absolute bg-white text-xs px-2 py-1 rounded shadow-lg border"
                      style={{ top: "250px", left: "310px" }}
                    >
                      Váš domov
                    </div>

                    {/* Driver marker - animated */}
                    <div
                      className="absolute bg-blue-500 text-white p-2 rounded-full shadow-lg animate-pulse"
                      style={{ top: "120px", left: "280px" }}
                    >
                      <Truck className="h-4 w-4" />
                    </div>
                    <div
                      className="absolute bg-white text-xs px-2 py-1 rounded shadow-lg border"
                      style={{ top: "100px", left: "250px" }}
                    >
                      {selectedOrder.driverName}
                    </div>

                    {/* Distance indicator */}
                    <div className="absolute top-4 left-4 bg-white p-2 rounded-lg shadow-lg">
                      <div className="text-xs text-muted-foreground">
                        Vzdialenosť
                      </div>
                      <div className="font-bold">~2.3 km</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Updates */}
              <div className="space-y-2">
                <h4 className="font-medium">Aktualizácie trasy</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>15:20 - Vodič načítal objednávku</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>15:35 - Na ceste k vám</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>15:42 - Približuje sa (2.3 km)</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span>~15:45 - Predpokladané doručenie</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    window.location.href = `tel:${selectedOrder.driverPhone}`;
                  }}
                  className="flex-1"
                  variant="outline"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Zavolať vodičovi
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      selectedOrder.driverPhone || "",
                    );
                    alert("Telefónne číslo skopírované!");
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-center">
                <Button
                  onClick={() => setShowDriverMap(false)}
                  variant="outline"
                  className="w-full"
                >
                  Zavrieť mapu
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
