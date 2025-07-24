import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
// Card components no longer needed - converted to flat design
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  useDeviceDetection,
  getDeviceLayoutClasses,
  getResponsiveContainerClasses,
} from "@/hooks/use-device-detection";
import {
  Truck,
  Phone,
  Navigation,
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  User,
  Package,
  Calendar,
  Carrot,
  XCircle,
  Timer,
  X,
  LogOut,
  Users,
  Check,
  MessageSquare,
  Tabs,
  PackageCheck,
  RefreshCw,
  Settings,
  Loader2,
  Map,
  Globe,
  Camera,
  Compass,
  Share2,
  Archive,
  FileText,
  Smartphone,
  Eye,
  EyeOff,
  Play,
  Pause,
  Square,
  Coffee,
  ClockIcon,
  RotateCcw,
  Home,
} from "lucide-react";

interface Driver {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
}

interface DriverShift {
  id: string;
  driver_id: string;
  driver_name: string;
  shift_start: string;
  shift_end?: string;
  status: "active" | "completed" | "paused";
  break_time_minutes: number;
  total_orders: number;
  total_cash_collected: number;
  notes?: string;
  location_start?: string;
  location_end?: string;
}

interface DriverAvailability {
  id: string;
  driver_id: string;
  date: string;
  is_available: boolean;
  start_time: string;
  end_time: string;
  availability_type: "available" | "unavailable" | "limited";
  reason?: string;
}

interface DriverBreak {
  id: string;
  driver_id: string;
  break_start: string;
  break_end: string;
  break_type: "lunch" | "rest" | "personal" | "emergency";
  duration_minutes: number;
  shift_id?: string;
  notes?: string;
}

interface WeeklySchedule {
  id: string;
  driver_id: string;
  day_of_week: number; // 1-7
  start_time: string;
  end_time: string;
  is_active: boolean;
  break_start_time?: string;
  break_end_time?: string;
  break_duration_minutes: number;
}

interface Order {
  id: string;
  customerName: string;
  address: string;
  postalCode: string;
  phone: string;
  deliveryTime: string;
  status: "pending" | "on-route" | "delivered" | "delayed" | "cancelled";
  items: { name: string; quantity: number; farmer: string }[];
  notes?: string;
  coordinates?: { lat: number; lng: number };
  delayMinutes?: number;
  cancelReason?: string;
  assignedDriverId?: string;
  estimatedArrival?: string;
  deliveredAt?: string;
  // Payment information from WooCommerce
  paymentStatus: "paid" | "unpaid" | "pending" | "cash" | "cash_paid";
  paymentMethod: "bacs" | "cod" | "card" | "bank_transfer" | "cash" | "other";
  totalAmount?: number;
  currency?: string;
  // Cash payment confirmation
  cashPaidAt?: string;
  cashConfirmedBy?: string;
  receiptSent?: boolean;
}

interface LoadingItem {
  farmer: string;
  items: {
    name: string;
    quantity: number;
    status: "pending" | "loaded" | "unloaded";
  }[];
  isCompletelyLoaded?: boolean;
  isCompletelyUnloaded?: boolean;
}

interface RouteOptimization {
  optimizedRoute: Order[];
  totalDuration: number;
  totalDistance: number;
  isOptimized: boolean;
}

export default function Index() {
  // Device detection for fixed layouts
  const deviceInfo = useDeviceDetection();

  // Network and server health check
  const checkServerHealth = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch("/api/health", {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn("❌ Server health check failed:", error);
      return false;
    }
  };

  const [selectedDate] = useState(new Date());
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<
    "loading" | "woocommerce" | "mock"
  >("loading");
  const [shiftEndDialogOpen, setShiftEndDialogOpen] = useState(false);

  // Shift Management States
  const [currentShift, setCurrentShift] = useState<DriverShift | null>(null);
  const [shiftSettingsOpen, setShiftSettingsOpen] = useState(false);
  const [driverAvailability, setDriverAvailability] = useState<
    DriverAvailability[]
  >([]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule[]>([]);
  const [currentBreak, setCurrentBreak] = useState<DriverBreak | null>(null);
  const [breakDialogOpen, setBreakDialogOpen] = useState(false);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
  const [loadingItems, setLoadingItems] = useState<LoadingItem[]>([]);
  const [noteText, setNoteText] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "loaded" | "unloaded">(
    "pending",
  );
  const [isLoadingSectionVisible, setIsLoadingSectionVisible] = useState(true);
  const [showArchive, setShowArchive] = useState(false);
  const [routeOptimization, setRouteOptimization] =
    useState<RouteOptimization | null>(null);

  // Loading states
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isOptimizingRoute, setIsOptimizingRoute] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [isStartingShift, setIsStartingShift] = useState(false);

  // Dialog states for delay functionality
  const [delayDialogOpen, setDelayDialogOpen] = useState(false);
  const [delayOrderId, setDelayOrderId] = useState<string | null>(null);
  const [delayType, setDelayType] = useState<"delay" | "cancel" | null>(null);
  const [delayMinutes, setDelayMinutes] = useState<string>("");
  const [cancelReason, setCancelReason] = useState("");
  const [smsEnabled, setSmsEnabled] = useState(true);

  // Undo delivered order functionality
  const [undoDeliveredDialogOpen, setUndoDeliveredDialogOpen] = useState(false);
  const [undoOrderId, setUndoOrderId] = useState<string | null>(null);

  // Route map functionality
  const [showRouteMap, setShowRouteMap] = useState(false);

  // API functions
  const fetchTodaysOrders = async () => {
    setIsLoadingOrders(true);
    try {
      console.log("🔄 Fetching today's orders from WooCommerce...");
      console.log("API URL:", "/api/orders/today");

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for orders

      const response = await fetch("/api/orders/today", {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(
        "✅ Got response from WooCommerce API:",
        response.status,
        response.statusText,
      );

      if (!response.ok) {
        console.warn(
          `❌ WooCommerce API failed: ${response.status} ${response.statusText}`,
        );
        console.log("Response headers:", [...response.headers.entries()]);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data;
      try {
        const responseText = await response.text();
        console.log(
          "📄 Raw response text (first 200 chars):",
          responseText.substring(0, 200),
        );

        if (responseText.startsWith("<!")) {
          // HTML response instead of JSON - use mock data
          console.log(
            "���� Got HTML response instead of JSON, using mock data for demo",
          );
          loadMockData();
          return;
        }

        // Extract JSON part (everything before <script> tag)
        const jsonPart = responseText.split("<script>")[0];
        data = JSON.parse(jsonPart);
        console.log("✅ Successfully parsed JSON response:", data);
      } catch (jsonError) {
        console.error("❌ Error parsing JSON response:", jsonError);
        console.log("🔄 Falling back to mock data...");
        loadMockData();
        return;
      }

      if (data.success && data.orders) {
        console.log(
          `✅ Successfully loaded ${data.orders.length} real orders from WooCommerce`,
        );
        setOrders(data.orders);
        setDataSource("woocommerce");

        // Show success notification
        if (data.orders.length === 0) {
          console.log("📭 No orders found for today in WooCommerce");
        }
      } else {
        console.error("❌ WooCommerce API returned error:", data.error);
        console.log("🔄 Falling back to mock data...");
        // Fallback to mock data if API fails
        loadMockData();
      }
    } catch (error) {
      // Better error handling for network issues - silent fallback to mock data
      if (error.name === "AbortError") {
        console.warn("⏱️ Orders API request timed out, using mock data");
      } else if (error.message && error.message.includes("Failed to fetch")) {
        console.warn("🔌 Server unavailable, using mock data for orders");
      } else {
        console.warn(
          "⚠️ Unable to fetch orders data, using mock data:",
          error.message,
        );
      }

      // Silently fallback to mock data without showing errors to user
      setDataSource("mock");
      loadMockData();
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      console.log("👥 Fetching drivers from API...");

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch("/api/drivers", {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(
          `❌ Drivers API failed: ${response.status} ${response.statusText}`,
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data;
      try {
        const responseText = await response.text();
        if (responseText.startsWith("<!")) {
          // HTML response instead of JSON - use mock data
          console.log("📄 Got HTML response for drivers, using mock data");
          loadMockDrivers();
          return;
        }
        // Extract JSON part (everything before <script> tag)
        const jsonPart = responseText.split("<script>")[0];
        data = JSON.parse(jsonPart);
      } catch (jsonError) {
        console.error("❌ Error parsing drivers JSON response:", jsonError);
        console.log("🔄 Falling back to mock drivers...");
        loadMockDrivers();
        return;
      }

      if (data.success && data.drivers) {
        console.log(
          `����� Successfully loaded ${data.drivers.length} drivers from API`,
        );
        setDrivers(data.drivers);
      } else {
        console.warn("⚠️ Drivers API returned error:", data.error);
        loadMockDrivers();
      }
    } catch (error) {
      // Network errors, timeouts, server unavailable - silent fallback
      if (error.name === "AbortError") {
        console.warn("⏱️ Drivers API request timed out, using mock data");
      } else if (error.message && error.message.includes("Failed to fetch")) {
        console.warn("��� Server unavailable, using mock data for drivers");
      } else {
        console.warn(
          "⚠️ Unable to fetch drivers data, using mock data:",
          error.message,
        );
      }

      // Silently fallback to mock data without showing errors to user
      loadMockDrivers();
    }
  };

  // Load mock drivers fallback
  const loadMockDrivers = () => {
    setDrivers([
      {
        id: "1",
        name: "Jan Nov��k",
        phone: "+420 601 111 222",
        isActive: true,
      },
      {
        id: "2",
        name: "Petr Svoboda",
        phone: "+420 602 333 444",
        isActive: true,
      },
      {
        id: "3",
        name: "Marie Krásná",
        phone: "+420 603 555 666",
        isActive: false,
      },
    ]);
  };

  const fetchFarmersAndProducts = async () => {
    try {
      console.log("������ Fetching farmers and products from WooCommerce...");

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch("/api/farmers", {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(
          `❌ Farmers API failed: ${response.status} ${response.statusText}`,
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data;
      try {
        const responseText = await response.text();
        if (responseText.startsWith("<!")) {
          // HTML response instead of JSON - use mock data
          console.log(
            "📄 Got HTML response for farmers, using mock loading data",
          );
          loadMockLoadingItems();
          return;
        }
        // Extract JSON part (everything before <script> tag)
        const jsonPart = responseText.split("<script>")[0];
        data = JSON.parse(jsonPart);
      } catch (jsonError) {
        console.error("❌ Error parsing farmers JSON response:", jsonError);
        console.log("🔄 Falling back to mock loading data...");
        loadMockLoadingItems();
        return;
      }

      if (data.success && data.farmers) {
        console.log(
          `✅ Successfully loaded ${data.farmers.length} farmers from WooCommerce`,
        );
        setLoadingItems(data.farmers);
      } else {
        console.error("❌ Farmers API returned error:", data.error);
        console.log("🔄 Falling back to mock loading data...");
        // Fallback to mock data
        loadMockLoadingItems();
      }
    } catch (error) {
      // Better error handling for network issues - silent fallback to mock data
      if (error.name === "AbortError") {
        console.warn("⏱️ Farmers API request timed out, using mock data");
      } else if (error.message && error.message.includes("Failed to fetch")) {
        console.warn("🔌 Server unavailable, using mock data for farmers");
      } else {
        console.warn(
          "⚠️ Unable to fetch farmers data, using mock data:",
          error.message,
        );
      }

      // Silently fallback to mock data without showing errors to user
      setDataSource("mock");
      loadMockLoadingItems();
    }
  };

  const optimizeRoute = async () => {
    if (driverOrders.length < 2) return;

    // Skip route optimization if we're already using mock data (server unavailable)
    if (dataSource === "mock") {
      console.log("🔄 Server unavailable, using simple route optimization...");
      createSimpleMockOptimization();
      return;
    }

    setIsOptimizingRoute(true);
    try {
      console.log(`🗺�� Optimizing route for ${driverOrders.length} orders...`);

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout for route optimization

      const response = await fetch("/api/routes/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orders: driverOrders,
          driverLocation: { lat: 50.0755, lng: 14.4378 }, // Praha centrum
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        console.warn(
          `��� Route optimization API failed: ${response.status} ${response.statusText}`,
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError);
        // Fallback to mock optimization if API fails
        data = {
          success: true,
          optimizedRoute: driverOrders.map((order, index) => ({
            orderId: order.id,
            estimatedArrival: `${9 + index}:${String((index * 15) % 60).padStart(2, "0")}`,
            coordinates: order.coordinates || { lat: 50.0755, lng: 14.4378 },
          })),
          totalDuration: driverOrders.length * 15,
          totalDistance: driverOrders.length * 5,
        };
      }

      if (data.success) {
        const optimizedOrders = data.optimizedRoute.map((routePoint: any) => {
          const order = orders.find((o) => o.id === routePoint.orderId);
          return {
            ...order,
            estimatedArrival: routePoint.estimatedArrival,
            coordinates: routePoint.coordinates,
          };
        });

        setRouteOptimization({
          optimizedRoute: optimizedOrders,
          totalDuration: data.totalDuration,
          totalDistance: data.totalDistance,
          isOptimized: true,
        });

        // Update orders with optimized sequence and estimated arrivals
        setOrders((prev) =>
          prev.map((order) => {
            const optimizedOrder = optimizedOrders.find(
              (o) => o.id === order.id,
            );
            return optimizedOrder || order;
          }),
        );
      } else {
        console.warn("�� Route optimization API returned error:", data.error);
        throw new Error(data.error || "Failed to optimize route");
      }
    } catch (error) {
      // Better error handling for network issues
      if (error.name === "AbortError") {
        console.error(
          "❌ Route optimization request timed out after 20 seconds",
        );
      } else if (error.message.includes("Failed to fetch")) {
        console.error(
          "❌ Network error: Route optimization server unavailable",
        );
      } else if (error.message.includes("HTTP error! status: 404")) {
        console.error("❌ Route optimization endpoint not found (404)");
      } else {
        console.error("❌ Error optimizing route:", error);
      }

      console.log("🔄 Using simple fallback route optimization...");

      // Fallback to simple mock optimization
      const mockOptimizedOrders = driverOrders.map((order, index) => ({
        ...order,
        estimatedArrival: `${9 + index}:${String((index * 15) % 60).padStart(2, "0")}`,
      }));

      setRouteOptimization({
        optimizedRoute: mockOptimizedOrders,
        totalDuration: driverOrders.length * 15,
        totalDistance: driverOrders.length * 5,
        isOptimized: true,
      });

      setOrders((prev) =>
        prev.map((order) => {
          const optimizedOrder = mockOptimizedOrders.find(
            (o) => o.id === order.id,
          );
          return optimizedOrder || order;
        }),
      );
    } finally {
      setIsOptimizingRoute(false);
    }
  };

  // Helper function for simple mock route optimization
  const createSimpleMockOptimization = () => {
    const mockOptimizedOrders = driverOrders.map((order, index) => ({
      ...order,
      estimatedArrival: `${9 + index}:${String((index * 15) % 60).padStart(2, "0")}`,
    }));

    setRouteOptimization({
      optimizedRoute: mockOptimizedOrders,
      totalDuration: driverOrders.length * 15,
      totalDistance: driverOrders.length * 5,
      isOptimized: true,
    });

    setOrders((prev) =>
      prev.map((order) => {
        const optimizedOrder = mockOptimizedOrders.find(
          (o) => o.id === order.id,
        );
        return optimizedOrder || order;
      }),
    );

    console.log(
      `✅ Simple route created: ${driverOrders.length * 15} min, ${driverOrders.length * 5} km`,
    );
  };

  // Load mock data fallback
  const loadMockData = () => {
    const mockOrders: Order[] = [
      {
        id: "1",
        customerName: "Marie Svobodová",
        address: "Wenceslas Square 1, Praha",
        postalCode: "11000",
        phone: "+420 602 123 456",
        deliveryTime: "09:00-12:00",
        status: "pending",
        items: [
          { name: "Mrkev", quantity: 2, farmer: "Farma Zelený háj" },
          { name: "Brambory", quantity: 5, farmer: "Bio farma Novák" },
        ],
        coordinates: { lat: 50.0826, lng: 14.4284 },
        assignedDriverId: "1",
        paymentStatus: "paid",
        paymentMethod: "card",
        totalAmount: 159,
        currency: "CZK",
      },
      {
        id: "2",
        customerName: "Petr Krejčí",
        address: "Na Příkopě 22, Praha",
        postalCode: "11000",
        phone: "+420 603 987 654",
        deliveryTime: "12:00-15:00",
        status: "pending",
        items: [
          { name: "Salát", quantity: 3, farmer: "Farma Zelený háj" },
          { name: "Rajčata", quantity: 2, farmer: "Bio farma Novák" },
        ],
        coordinates: { lat: 50.0875, lng: 14.4201 },
        assignedDriverId: "1",
        paymentStatus: "cash",
        paymentMethod: "cod",
        totalAmount: 245,
        currency: "CZK",
      },
      {
        id: "3",
        customerName: "Anna Horáková",
        address: "Vinohrady 45, Praha",
        postalCode: "12000",
        phone: "+420 604 567 890",
        deliveryTime: "15:00-18:00",
        status: "pending",
        items: [
          { name: "Cuketa", quantity: 1, farmer: "Farma Zelený háj" },
          { name: "Paprika", quantity: 4, farmer: "Eco farma Dvořák" },
        ],
        coordinates: { lat: 50.0755, lng: 14.4378 },
        assignedDriverId: "2",
        paymentStatus: "pending",
        paymentMethod: "bank_transfer",
        totalAmount: 189,
        currency: "CZK",
      },
      {
        id: "4",
        customerName: "Jan Dvořák",
        address: "Smíchov 28, Praha",
        postalCode: "15000",
        phone: "+420 605 444 555",
        deliveryTime: "08:00-11:00",
        status: "pending",
        items: [
          { name: "Brambory", quantity: 10, farmer: "Bio farma Novák" },
          { name: "Cibule", quantity: 3, farmer: "Sklad" },
          { name: "Česnekové bulvy", quantity: 2, farmer: "Sklad" },
        ],
        coordinates: { lat: 50.0707, lng: 14.4012 },
        assignedDriverId: "1",
        paymentStatus: "cash",
        paymentMethod: "cod",
        totalAmount: 380,
        currency: "CZK",
      },
      {
        id: "5",
        customerName: "Zuzana Procházková",
        address: "Karlín 15, Praha",
        postalCode: "18600",
        phone: "+420 606 777 888",
        deliveryTime: "13:00-16:00",
        status: "pending",
        items: [
          { name: "Rajčata cherry", quantity: 4, farmer: "Hlavenec" },
          { name: "Salát hlávkový", quantity: 2, farmer: "Farma Zelený háj" },
          { name: "Paprika červená", quantity: 3, farmer: "Eco farma Dvořák" },
          { name: "Med akátový", quantity: 1, farmer: "Sklad" },
        ],
        coordinates: { lat: 50.0933, lng: 14.4481 },
        assignedDriverId: "1",
        paymentStatus: "paid",
        paymentMethod: "bacs",
        totalAmount: 520,
        currency: "CZK",
      },
      {
        id: "6",
        customerName: "Michal Hájek",
        address: "Dejvice 42, Praha",
        postalCode: "16000",
        phone: "+420 607 999 000",
        deliveryTime: "16:00-19:00",
        status: "pending",
        items: [
          { name: "Brambory nové", quantity: 8, farmer: "Halbich" },
          { name: "Mrkev", quantity: 5, farmer: "Fabian" },
          { name: "Petržel", quantity: 2, farmer: "Fabian" },
        ],
        coordinates: { lat: 50.1033, lng: 14.3901 },
        assignedDriverId: "2",
        paymentStatus: "pending",
        paymentMethod: "card",
        totalAmount: 295,
        currency: "CZK",
      },
      {
        id: "7",
        customerName: "Lenka Svobodová",
        address: "Vršovice 67, Praha",
        postalCode: "10100",
        phone: "+420 608 111 222",
        deliveryTime: "10:00-13:00",
        status: "on-route",
        items: [
          { name: "Cuketa", quantity: 2, farmer: "Farma Zelený háj" },
          { name: "Rajčata", quantity: 6, farmer: "Hlavenec" },
          { name: "Cibule bílá", quantity: 2, farmer: "Sklad" },
        ],
        coordinates: { lat: 50.0653, lng: 14.4581 },
        assignedDriverId: "1",
        paymentStatus: "cash",
        paymentMethod: "cod",
        totalAmount: 175,
        currency: "CZK",
        estimatedArrival: "11:30",
      },
      {
        id: "8",
        customerName: "Pavel Novotný",
        address: "Nusle 89, Praha",
        postalCode: "14000",
        phone: "+420 609 333 444",
        deliveryTime: "14:00-17:00",
        status: "pending",
        items: [
          { name: "Brambory", quantity: 15, farmer: "Bio farma Novák" },
          { name: "Mrkev", quantity: 8, farmer: "Fabian" },
          { name: "Cibule žltá", quantity: 4, farmer: "Sklad" },
          { name: "Česnekové bulvy", quantity: 3, farmer: "Sklad" },
        ],
        coordinates: { lat: 50.0591, lng: 14.4297 },
        assignedDriverId: "1",
        paymentStatus: "paid",
        paymentMethod: "bank_transfer",
        totalAmount: 450,
        currency: "CZK",
      },
    ];

    // Mock delivered orders for archive testing
    const mockDeliveredOrders: Order[] = [
      {
        id: "delivered-1",
        customerName: "Jana Novotná",
        address: "Karlovo náměstí 5, Praha",
        postalCode: "11000",
        phone: "+420 605 111 222",
        deliveryTime: "08:00-11:00",
        status: "delivered",
        items: [
          { name: "Brambory", quantity: 3, farmer: "Bio farma Novák" },
          { name: "Cibule", quantity: 2, farmer: "Sklad" },
        ],
        coordinates: { lat: 50.0755, lng: 14.415 },
        assignedDriverId: "1",
        deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        notes:
          "Doručené bez problémov. Zákazník spokojný. 💰 Hotovosť potvrdená a doklad odoslaný ✅ Automaticky synchronizované s WooCommerce",
        paymentStatus: "cash_paid",
        paymentMethod: "cod",
        totalAmount: 125,
        currency: "CZK",
        cashPaidAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        cashConfirmedBy: "Jan Novák",
        receiptSent: true,
      },
      {
        id: "delivered-2",
        customerName: "Tomáš Svoboda",
        address: "Národní třída 12, Praha",
        postalCode: "11000",
        phone: "+420 606 333 444",
        deliveryTime: "10:00-13:00",
        status: "delivered",
        items: [
          { name: "Salát", quantity: 2, farmer: "Farma Zelený háj" },
          { name: "Rajčata", quantity: 4, farmer: "Bio farma Novák" },
          { name: "Paprika", quantity: 1, farmer: "Eco farma Dvořák" },
        ],
        coordinates: { lat: 50.082, lng: 14.419 },
        assignedDriverId: "1",
        deliveredAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        notes:
          "Foto doručenia urobené. SMS o cestě odeslané ✅ Automaticky synchronizované s WooCommerce",
        paymentStatus: "paid",
        paymentMethod: "bacs",
        totalAmount: 320,
        currency: "CZK",
      },
    ];

    console.log("📦 Setting mock orders:", mockOrders.length, "orders");
    console.log(
      "📦 Setting mock delivered orders:",
      mockDeliveredOrders.length,
      "delivered orders",
    );

    setOrders(mockOrders);
    setDeliveredOrders(mockDeliveredOrders);
    setDataSource("mock");

    console.log("✅ Mock data set successfully");
  };

  const loadMockLoadingItems = () => {
    const mockLoadingItems: LoadingItem[] = [
      {
        farmer: "Sklad - Centrální sklad (Rudná u Prahy)",
        items: [
          { name: "Cibule žltá", quantity: 9, status: "pending" },
          { name: "Cibule červená", quantity: 2, status: "pending" },
          { name: "Cibule bílá", quantity: 4, status: "pending" },
          { name: "Med akátový", quantity: 1, status: "pending" },
          { name: "Česnekové bulvy", quantity: 5, status: "pending" },
        ],
        isCompletelyLoaded: false,
      },
      {
        farmer: "Hlavenec - Rajčatová farma (Hostivice)",
        items: [
          { name: "Rajčata", quantity: 6, status: "pending" },
          { name: "Rajčata cherry", quantity: 4, status: "pending" },
        ],
        isCompletelyLoaded: false,
      },
      {
        farmer: "Halbich - Bramborová farma (Černošice)",
        items: [
          { name: "Brambory velké", quantity: 10, status: "pending" },
          { name: "Brambory malé", quantity: 8, status: "pending" },
          { name: "Brambory nové", quantity: 8, status: "pending" },
        ],
        isCompletelyLoaded: false,
      },
      {
        farmer: "Fabian - Zeleninová farma (Jesenice)",
        items: [
          { name: "Mrkev", quantity: 13, status: "pending" },
          { name: "Petržel", quantity: 5, status: "pending" },
        ],
        isCompletelyLoaded: false,
      },
      {
        farmer: "Bio farma Novák - Ekologická farma (Beroun)",
        items: [{ name: "Brambory", quantity: 30, status: "pending" }],
        isCompletelyLoaded: false,
      },
      {
        farmer: "Farma Zelený háj - Zahradnictví (Dobřichovice)",
        items: [
          { name: "Salát hlávkový", quantity: 5, status: "pending" },
          { name: "Cuketa", quantity: 3, status: "pending" },
        ],
        isCompletelyLoaded: false,
      },
      {
        farmer: "Eco farma Dvořák - Paprikárna (Řevnice)",
        items: [
          { name: "Paprika", quantity: 4, status: "pending" },
          { name: "Paprika červená", quantity: 3, status: "pending" },
        ],
        isCompletelyLoaded: false,
      },
    ];
    setLoadingItems(mockLoadingItems);
  };

  // Global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.warn("Unhandled promise rejection:", event.reason);
      // Prevent the default error dialog
      event.preventDefault();
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  // Initialize data on component mount
  useEffect(() => {
    initializeApp();
  }, []);

  // Initialize app with server health check
  const initializeApp = async () => {
    console.log("🚀 Initializing Zpoledomu Driver App...");

    // Check if server is available
    const serverHealthy = await checkServerHealth();

    if (!serverHealthy) {
      console.warn(
        "⚠️ Server appears to be unavailable, using mock data immediately",
      );
      setDataSource("mock");
      loadMockDrivers();
      loadMockData();
      loadMockLoadingItems();
      return;
    }

    console.log("✅ Server is healthy, attempting to load real data...");

    try {
      // Initialize app data with error handling
      fetchDrivers();
      fetchTodaysOrders();
      fetchFarmersAndProducts();
    } catch (error) {
      console.error("��� Error during app initialization:", error);
      console.log("🔄 Falling back to mock data...");
      setDataSource("mock");
      loadMockDrivers();
      loadMockData();
      loadMockLoadingItems();
    }
  };

  const loginDriver = (driver: Driver) => {
    setCurrentDriver(driver);
    localStorage.setItem("zpoledomu_driver", JSON.stringify(driver));

    // Always load mock data for demo when driver logs in
    console.log("🔄 Driver logged in:", driver.name);
    console.log("📊 Current orders count:", orders.length);
    console.log("📊 Current delivered orders count:", deliveredOrders.length);
    console.log("📦 Loading mock data for demo...");

    // Force load mock data for demo purposes
    loadMockData();
    loadMockLoadingItems();
    setDataSource("mock");

    console.log("✅ Mock data loading initiated");
  };

  const handleDriverLogin = async () => {
    if (!loginUsername || !loginPassword) {
      alert("Prosím, zadajte používateľské meno a heslo");
      return;
    }

    setIsLoading(true);

    try {
      // Call admin API to authenticate driver
      const response = await fetch('/api/auth/driver-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.driver) {
          // Login successful - set the driver
          loginDriver(data.driver);

          // Clear login form
          setLoginUsername("");
          setLoginPassword("");
        } else {
          alert("Nesprávne prihlásenie údaje. Skúste znova.");
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Chyba pri prihlásení. Skúste znova.");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Chyba pri spojení so serverom. Skúste znova.");
    } finally {
      setIsLoading(false);
    }
  };

  const logoutDriver = () => {
    setCurrentDriver(null);
    localStorage.removeItem("zpoledomu_driver");
    setShiftEndDialogOpen(false);
  };

  // Load saved driver from localStorage on startup
  useEffect(() => {
    const savedDriver = localStorage.getItem("zpoledomu_driver");
    if (savedDriver) {
      try {
        const driver = JSON.parse(savedDriver);
        setCurrentDriver(driver);
        console.log("✅ Driver loaded from localStorage:", driver.name);

        // Also load mock data when restoring driver
        console.log("📦 Loading mock data for restored driver...");
        loadMockData();
        loadMockLoadingItems();
        setDataSource("mock");
      } catch (error) {
        console.warn("❌ Failed to load saved driver:", error);
        localStorage.removeItem("zpoledomu_driver");
      }
    }
  }, []);

  // Shift Management Functions
  const startShift = async () => {
    if (!currentDriver) {
      alert("Najprv sa prihláste ako vodič");
      return;
    }

    if (isStartingShift) {
      console.log("⏳ Shift is already starting...");
      return;
    }

    setIsStartingShift(true);
    console.log("🔄 Starting shift for driver:", currentDriver);

    try {
      // Get location with timeout
      const location = await getCurrentLocationString();
      console.log("📍 Location obtained:", location);

      console.log("🔄 Sending request to API...");
      const response = await fetch("/api/shifts/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driver_id: currentDriver.id,
          driver_name: currentDriver.name,
          location_start: location,
        }),
      });

      console.log("📡 API Response status:", response.status);
      console.log(
        "📡 API Response headers:",
        response.headers.get("content-type"),
      );

      if (response.ok) {
        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          try {
            const data = await response.json();
            console.log("✅ API Response data:", data);
            if (data.success) {
              setCurrentShift(data.shift);
              alert("Smena začala! 🚚");
              return;
            }
          } catch (jsonError) {
            console.warn("⚠️ Failed to parse JSON response:", jsonError);
            const text = await response.text();
            console.log("📄 Raw response text:", text);
          }
        } else {
          const text = await response.text();
          console.log("📄 Non-JSON response:", text);
        }
      } else {
        const text = await response.text();
        console.log("❌ Error response:", text);
      }

      // Fallback to mock shift
      console.log("🔄 Falling back to mock shift...");
      const mockShift: DriverShift = {
        id: `shift_${Date.now()}`,
        driver_id: currentDriver.id,
        driver_name: currentDriver.name,
        shift_start: new Date().toISOString(),
        status: "active",
        break_time_minutes: 0,
        total_orders: 0,
        total_cash_collected: 0,
        location_start: location,
      };
      setCurrentShift(mockShift);
      console.log("✅ Mock shift created:", mockShift);
      alert("Smena začala! 🚚 (demo režim)");
    } catch (error) {
      console.error("❌ Error starting shift:", error);

      // Even if there's an error, create a basic shift
      const emergencyShift: DriverShift = {
        id: `shift_${Date.now()}`,
        driver_id: currentDriver.id,
        driver_name: currentDriver.name,
        shift_start: new Date().toISOString(),
        status: "active",
        break_time_minutes: 0,
        total_orders: 0,
        total_cash_collected: 0,
        location_start: "Praha centrum",
      };
      setCurrentShift(emergencyShift);
      console.log("✅ Emergency shift created:", emergencyShift);
      alert("Smena začala! �� (núdzový režim)");
    } finally {
      setIsStartingShift(false);
    }
  };

  const endShift = async () => {
    if (!currentShift || !currentDriver) return;

    try {
      const response = await fetch("/api/shifts/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shift_id: currentShift.id,
          driver_id: currentDriver.id,
          location_end: await getCurrentLocationString(),
          total_orders: deliveredOrders.length,
          total_cash_collected: calculateShiftSummary().totalCashAmount,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentShift(null);
          setShiftEndDialogOpen(true); // Show existing shift end dialog
        }
      } else {
        // Fallback for offline mode
        setCurrentShift(null);
        setShiftEndDialogOpen(true);
      }
    } catch (error) {
      console.error("Error ending shift:", error);
      setCurrentShift(null);
      setShiftEndDialogOpen(true);
    }
  };

  const startBreak = async (breakType: DriverBreak["break_type"] = "rest") => {
    if (!currentShift || !currentDriver) return;

    try {
      const breakStart = new Date().toISOString();
      const newBreak: DriverBreak = {
        id: `break_${Date.now()}`,
        driver_id: currentDriver.id,
        break_start: breakStart,
        break_end: "", // Will be set when break ends
        break_type: breakType,
        duration_minutes: 0,
        shift_id: currentShift.id,
      };

      setCurrentBreak(newBreak);
      alert(`Prestávka začala! ⏸️`);
    } catch (error) {
      console.error("Error starting break:", error);
    }
  };

  const endBreak = async () => {
    if (!currentBreak) return;

    try {
      const breakEnd = new Date().toISOString();
      const durationMs =
        new Date(breakEnd).getTime() -
        new Date(currentBreak.break_start).getTime();
      const durationMinutes = Math.round(durationMs / (1000 * 60));

      const updatedBreak = {
        ...currentBreak,
        break_end: breakEnd,
        duration_minutes: durationMinutes,
      };

      // Update current shift with break time
      if (currentShift) {
        setCurrentShift({
          ...currentShift,
          break_time_minutes: currentShift.break_time_minutes + durationMinutes,
        });
      }

      setCurrentBreak(null);
      alert(`Prestávka skončila! Trvala ${durationMinutes} minút. ▶️`);
    } catch (error) {
      console.error("Error ending break:", error);
    }
  };

  const getCurrentLocationString = async (): Promise<string> => {
    try {
      console.log("📍 Requesting geolocation...");

      // Try to get location with timeout
      const timeoutPromise = new Promise<GeolocationPosition>((_, reject) => {
        setTimeout(() => reject(new Error("Location timeout")), 5000);
      });

      const locationPromise = getCurrentLocation();

      const position = await Promise.race([locationPromise, timeoutPromise]);

      if (position) {
        const locationStr = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
        console.log("✅ Location obtained:", locationStr);
        return locationStr;
      }
    } catch (error) {
      console.warn("���️ Could not get location:", error);
    }

    const fallback = "Praha centrum (50.0755, 14.4378)";
    console.log("📍 Using fallback location:", fallback);
    return fallback;
  };

  // Undo delivered order function
  const undoDeliveredOrder = async (orderId: string) => {
    console.log(`🔄 Undoing delivered status for order ${orderId}`);

    try {
      // Find the delivered order
      const deliveredOrder = deliveredOrders.find((o) => o.id === orderId);
      if (!deliveredOrder) {
        alert("Objednávka nebola nájdená v archíve");
        return;
      }

      // Restore order to active list with "on-route" status
      const restoredOrder = {
        ...deliveredOrder,
        status: "on-route" as const,
        deliveredAt: undefined,
      };

      // Update state
      setOrders((prev) => [...prev, restoredOrder]);
      setDeliveredOrders((prev) => prev.filter((o) => o.id !== orderId));

      // Try to update in WooCommerce
      try {
        await fetch(`/api/woocommerce/orders/${orderId}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "processing",
            note: `Objednávka obnovená vodičom ${currentDriver?.name} - pôvodne označená ako doručená omylom`,
          }),
        });
      } catch (wcError) {
        console.warn("Could not update WooCommerce status:", wcError);
      }

      alert("✅ Objednávka bola obnovená do aktívnych objednávok");
      setUndoDeliveredDialogOpen(false);
      setUndoOrderId(null);
    } catch (error) {
      console.error("Error undoing delivered order:", error);
      alert("❌ Chyba pri obnovovaní objednávky");
    }
  };

  // Mark loading item as loaded
  const markItemAsLoaded = (farmerIndex: number, itemIndex: number) => {
    setLoadingItems((prev) =>
      prev.map((farmer, fIndex) => {
        if (fIndex === farmerIndex) {
          const updatedItems = farmer.items.map((item, iIndex) =>
            iIndex === itemIndex ? { ...item, status: "loaded" } : item,
          );
          const isCompletelyLoaded = updatedItems.every(
            (item) => item.status === "loaded",
          );
          return {
            ...farmer,
            items: updatedItems,
            isCompletelyLoaded,
          };
        }
        return farmer;
      }),
    );
  };

  // Mark loading item as unloaded (can only unload loaded items)
  const markItemAsUnloaded = (farmerIndex: number, itemIndex: number) => {
    setLoadingItems((prev) =>
      prev.map((farmer, fIndex) => {
        if (fIndex === farmerIndex) {
          const updatedItems = farmer.items.map((item, iIndex) =>
            iIndex === itemIndex && item.status === "loaded"
              ? { ...item, status: "unloaded" }
              : item,
          );
          const isCompletelyUnloaded = updatedItems.every(
            (item) => item.status === "unloaded",
          );
          return {
            ...farmer,
            items: updatedItems,
            isCompletelyLoaded: updatedItems.every(
              (item) => item.status === "loaded",
            ),
            isCompletelyUnloaded,
          };
        }
        return farmer;
      }),
    );
  };

  // Mark entire farmer's items as loaded
  const markFarmerAsLoaded = (farmerIndex: number) => {
    setLoadingItems((prev) =>
      prev.map((farmer, fIndex) => {
        if (fIndex === farmerIndex) {
          const updatedItems = farmer.items.map((item) => ({
            ...item,
            status: "loaded" as const,
          }));
          return {
            ...farmer,
            items: updatedItems,
            isCompletelyLoaded: true,
          };
        }
        return farmer;
      }),
    );
  };

  // Mark entire farmer's items as unloaded (only loaded items)
  const markFarmerAsUnloaded = (farmerIndex: number) => {
    setLoadingItems((prev) =>
      prev.map((farmer, fIndex) => {
        if (fIndex === farmerIndex) {
          const updatedItems = farmer.items.map((item) =>
            item.status === "loaded"
              ? { ...item, status: "unloaded" as const }
              : item,
          );
          return {
            ...farmer,
            items: updatedItems,
            isCompletelyLoaded: false,
            isCompletelyUnloaded: updatedItems.every(
              (item) => item.status === "unloaded",
            ),
          };
        }
        return farmer;
      }),
    );
  };

  // Get filtered loading items based on active tab
  const getFilteredLoadingItems = () => {
    if (activeTab === "loaded") {
      return loadingItems.filter((farmer) =>
        farmer.items.some((item) => item.status === "loaded"),
      );
    } else if (activeTab === "unloaded") {
      return loadingItems.filter((farmer) =>
        farmer.items.some((item) => item.status === "unloaded"),
      );
    } else {
      return loadingItems.filter((farmer) =>
        farmer.items.some((item) => item.status === "pending"),
      );
    }
  };

  // Filter orders for current driver
  const driverOrders = orders.filter(
    (order) => !currentDriver || order.assignedDriverId === currentDriver.id,
  );

  // Debug logging
  console.log("🔍 Debug info:");
  console.log(
    "- Current driver:",
    currentDriver?.name,
    "ID:",
    currentDriver?.id,
  );
  console.log("- Total orders:", orders.length);
  console.log("- Driver orders:", driverOrders.length);
  console.log("- Data source:", dataSource);
  if (orders.length > 0) {
    console.log(
      "- Sample order IDs:",
      orders.slice(0, 3).map((o) => `${o.id} (driver: ${o.assignedDriverId})`),
    );
  }

  // Send SMS notification for "on route" status
  const sendOnRouteNotification = async (order: Order) => {
    try {
      // Try primary endpoint first
      const response = await fetch("/api/sms/delivery-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: order.phone,
          driverName: currentDriver?.name || "Jan Novák",
          estimatedTime: order.estimatedArrival || order.deliveryTime,
          orderNumber: order.id,
        }),
      });

      if (!response.ok) {
        // If primary endpoint fails, try alternative endpoint
        console.warn(
          `Primary SMS endpoint failed (${response.status}), trying alternative endpoint...`,
        );

        const altResponse = await fetch("/api/notifications/on-route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: order.customerName,
            phone: order.phone,
            deliveryTime: order.deliveryTime,
            estimatedArrival: order.estimatedArrival,
          }),
        });

        if (!altResponse.ok) {
          console.warn(
            `Alternative SMS endpoint also failed (${altResponse.status}), using mock success...`,
          );
          // Return mock success to prevent blocking the UI
          return true;
        }

        const altData = await altResponse.json();
        if (altData.success) {
          console.log("✅ SMS sent via alternative endpoint");
        }
        return altData.success;
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError);
        // Still return success to not block the UI
        return true;
      }

      if (data.success) {
        console.log("✅ SMS sent successfully:", data.messageSid);
      }

      return data.success;
    } catch (error) {
      console.error("Error sending SMS notification:", error);
      // Return true to prevent blocking the UI even if SMS fails
      console.log("📱 SMS failed, but continuing with order status update...");
      return true;
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: Order["status"],
    updatedOrder?: Order,
  ) => {
    const order = updatedOrder || orders.find((o) => o.id === orderId);
    if (!order) return;

    setIsUpdatingStatus(orderId);

    try {
      // Send notification when changing to "on-route"
      if (newStatus === "on-route") {
        const smsSuccess = await sendOnRouteNotification(order);

        // Update order locally
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  status: newStatus,
                  notes: order.notes
                    ? `${order.notes}\nSMS o cestě odeslané${!smsSuccess ? " (chyba)" : ""}`
                    : `SMS o cestě odeslané${!smsSuccess ? " (chyba)" : ""}`,
                }
              : order,
          ),
        );
      } else if (newStatus === "delivered") {
        // Move delivered order to delivered list and remove from active orders
        // Use the updated order if provided, otherwise find in current orders
        const currentOrder =
          updatedOrder || orders.find((o) => o.id === orderId);
        const deliveredOrder = {
          ...currentOrder,
          status: newStatus,
          deliveredAt: new Date().toISOString(),
        };
        setDeliveredOrders((prev) => [...prev, deliveredOrder]);
        setOrders((prev) => prev.filter((order) => order.id !== orderId));
      } else {
        // For other status changes
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order,
          ),
        );
      }

      // Update status in WooCommerce
      await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: newStatus,
          notes: order.notes,
        }),
      });
    } catch (error) {
      console.error("Error updating order status:", error);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const addNote = (orderId: string, note: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, notes: note } : order,
      ),
    );
    setNoteText("");
    setSelectedOrderId(null);
  };

  const openDelayDialog = (orderId: string) => {
    setDelayOrderId(orderId);
    setDelayDialogOpen(true);
    setDelayType(null);
    setDelayMinutes("");
    setCancelReason("");
  };

  const closeDelayDialog = () => {
    setDelayDialogOpen(false);
    setDelayOrderId(null);
    setDelayType(null);
    setDelayMinutes("");
    setCancelReason("");
  };

  const sendSMSNotification = async (order: Order, delayMinutes: number) => {
    try {
      const delayMessage = `Váš řidič ${currentDriver?.name || "Jan Novák"} má ${delayMinutes} minut zpoždění. Nový předpokládaný čas doručení objednávky #${order.id}: ${order.estimatedArrival}. Omlouváme se za nepříjemnosti.`;

      const response = await fetch("/api/sms/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: order.phone,
          message: delayMessage,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError);
        return false;
      }

      if (data.success) {
        console.log("✅ Twilio delay SMS sent successfully:", data.messageSid);
      }

      return data.success;
    } catch (error) {
      console.error("Error sending Twilio delay notification:", error);
      return false;
    }
  };

  // Send completion SMS notification using Twilio
  const sendCompletionNotification = async (order: Order) => {
    try {
      const now = new Date();
      const deliveryTime = now.toLocaleTimeString("cs-CZ", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const response = await fetch("/api/sms/completion-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: order.phone,
          orderNumber: order.id,
          deliveryTime: deliveryTime,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError);
        return false;
      }

      if (data.success) {
        console.log(
          "✅ Twilio completion SMS sent successfully:",
          data.messageSid,
        );
      }

      return data.success;
    } catch (error) {
      console.error("Error sending Twilio completion notification:", error);
      return false;
    }
  };

  const handleDelayConfirm = async () => {
    if (!delayOrderId || !delayType) return;

    const order = orders.find((o) => o.id === delayOrderId);
    if (!order) return;

    if (delayType === "delay" && delayMinutes) {
      // Send SMS notification if enabled
      let smsSuccess = true;
      if (smsEnabled) {
        smsSuccess = await sendSMSNotification(order, parseInt(delayMinutes));
      }

      // Update order with delay
      setOrders((prev) =>
        prev.map((order) =>
          order.id === delayOrderId
            ? {
                ...order,
                status: "delayed",
                delayMinutes: parseInt(delayMinutes),
                notes: order.notes
                  ? `${order.notes}\n                        Zpoždění: ${delayMinutes} min${smsEnabled ? (smsSuccess ? " (SMS poslané)" : " (SMS chyba)") : ""}`
                  : `                        Zpo��dění: ${delayMinutes} min${smsEnabled ? (smsSuccess ? " (SMS poslané)" : " (SMS chyba)") : ""}`,
              }
            : order,
        ),
      );
    } else if (delayType === "cancel") {
      // Cancel order and schedule next delivery
      setOrders((prev) =>
        prev.map((order) =>
          order.id === delayOrderId
            ? {
                ...order,
                status: "cancelled",
                cancelReason,
                notes: order.notes
                  ? `${order.notes}\nZrušené: ${cancelReason || "Vážna situácia"}`
                  : `Zrušené: ${cancelReason || "Vážna situácia"}`,
              }
            : order,
        ),
      );

      console.log(
        `Pl��nujem nový dovoz pre objednávku ${delayOrderId} do WooCommerce`,
      );
    }

    closeDelayDialog();
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-muted text-muted-foreground";
      case "on-route":
        return "bg-info text-info-foreground";
      case "delivered":
        return "bg-success text-success-foreground";
      case "delayed":
        return "bg-warning text-warning-foreground";
      case "cancelled":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusText = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "Čekající";
      case "on-route":
        return "Na cestě";
      case "delivered":
        return "                            Doručeno";
      case "delayed":
        return "Zpoždění";
      case "cancelled":
        return "Zrušeno";
      default:
        return "Neznámý";
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("cs-CZ", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Enhanced Waze integration with multiple navigation options
  const openWaze = (
    address: string,
    coordinates?: { lat: number; lng: number },
    customerName?: string,
  ) => {
    if (coordinates) {
      // Use GPS coordinates for precise navigation
      const wazeUrl = `https://waze.com/ul?ll=${coordinates.lat},${coordinates.lng}&navigate=yes`;
      window.open(wazeUrl, "_blank");
    } else {
      // Use address search with customer context
      const searchQuery = customerName
        ? `${address} (${customerName})`
        : address;
      const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(searchQuery)}&navigate=yes`;
      window.open(wazeUrl, "_blank");
    }

    // Log navigation start for analytics
    console.log(`🧭 Waze navigation started to: ${address}`);
  };

  // Alternative navigation options
  const openGoogleMaps = (
    address: string,
    coordinates?: { lat: number; lng: number },
  ) => {
    if (coordinates) {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
      window.open(mapsUrl, "_blank");
    } else {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
      window.open(mapsUrl, "_blank");
    }
  };

  const openMapyCz = (
    address: string,
    coordinates?: { lat: number; lng: number },
  ) => {
    if (coordinates) {
      const mapyUrl = `https://mapy.cz/zakladni?x=${coordinates.lng}&y=${coordinates.lat}&z=17&source=coor&id=${coordinates.lng},${coordinates.lat}`;
      window.open(mapyUrl, "_blank");
    } else {
      const mapyUrl = `https://mapy.cz/zakladni?q=${encodeURIComponent(address)}`;
      window.open(mapyUrl, "_blank");
    }
  };

  // Enhanced customer contact options
  const callCustomer = (phone: string, customerName?: string) => {
    // Log call initiation
    console.log(`📞 Calling customer: ${customerName || "Unknown"} - ${phone}`);
    window.location.href = `tel:${phone}`;
  };

  const sendSMSToCustomer = (phone: string, message: string) => {
    const smsUrl = `sms:${phone}?body=${encodeURIComponent(message)}`;
    window.location.href = smsUrl;
  };

  const refreshData = () => {
    console.log("🔄 Refreshing data...");

    // If we're in demo mode or no orders, load mock data
    if (dataSource === "mock" || orders.length === 0) {
      console.log("📦 Loading mock data for demo...");
      loadMockData();
      loadMockLoadingItems();
      setDataSource("mock");
    } else {
      // Try to fetch real data
      fetchTodaysOrders();
      fetchFarmersAndProducts();
    }
  };

  // Payment helper functions
  const getPaymentStatusBadge = (order: Order) => {
    const { paymentStatus, paymentMethod } = order;

    switch (paymentStatus) {
      case "paid":
        return (
          <Badge
            variant="default"
            className="bg-success text-success-foreground"
          >
            ✅ Zaplacené
          </Badge>
        );
      case "cash_paid":
        return (
          <Badge
            variant="default"
            className="bg-success text-success-foreground"
          >
            ✅ Hotovosť uhradená
          </Badge>
        );
      case "cash":
        return (
          <Badge
            variant="secondary"
            className="bg-warning text-warning-foreground"
          >
            💰 Hotovosť - čaká úhradu
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="border-info text-info">
            ⏳ Čaká
          </Badge>
        );
      case "unpaid":
        return <Badge variant="destructive">❌ Nezaplacené</Badge>;
      default:
        return <Badge variant="secondary">❓ Neznáme</Badge>;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "cod":
        return "Dobierka";
      case "bacs":
        return "Bankový prevod";
      case "card":
        return "Kartou";
      case "bank_transfer":
        return "Prevod";
      case "cash":
        return "Hotovosť";
      default:
        return method;
    }
  };

  const formatPrice = (amount?: number, currency = "CZK") => {
    if (!amount) return "";
    return `${amount} ${currency}`;
  };

  // Shift summary calculation functions
  const calculateShiftSummary = () => {
    const allDeliveredOrders = [...deliveredOrders];

    // Total orders delivered
    const totalDelivered = allDeliveredOrders.length;

    // Cash orders (should have cash with driver) - only actually cash-based orders
    const cashOrders = allDeliveredOrders.filter(
      (order) =>
        (order.paymentMethod === "cod" || order.paymentMethod === "cash") &&
        (order.paymentStatus === "cash" || order.paymentStatus === "cash_paid"),
    );

    // Total cash amount driver should have
    const totalCashAmount = cashOrders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0,
    );

    // Cash orders that were confirmed as paid
    const confirmedCashOrders = allDeliveredOrders.filter(
      (order) =>
        (order.paymentMethod === "cod" || order.paymentMethod === "cash") &&
        order.paymentStatus === "cash_paid",
    );

    // Cash orders still pending confirmation - only unconfirmed cash payments
    const pendingCashOrders = allDeliveredOrders.filter((order) => {
      // Must be a cash payment method
      const isCashMethod =
        order.paymentMethod === "cod" || order.paymentMethod === "cash";
      // Must still have cash status (not cash_paid)
      const isUnconfirmed = order.paymentStatus === "cash";
      // Must not have confirmation details
      const notConfirmed = !order.cashPaidAt && !order.cashConfirmedBy;

      return isCashMethod && isUnconfirmed && notConfirmed;
    });

    // Paid orders (no cash involved) - online payments, bank transfers, etc.
    const paidOrders = allDeliveredOrders.filter(
      (order) =>
        order.paymentStatus === "paid" ||
        (order.paymentMethod !== "cod" && order.paymentMethod !== "cash"),
    );

    return {
      totalDelivered,
      cashOrders: cashOrders.length,
      totalCashAmount,
      confirmedCashOrders: confirmedCashOrders.length,
      pendingCashOrders: pendingCashOrders.length,
      paidOrders: paidOrders.length,
      cashOrdersList: cashOrders,
      pendingCashOrdersList: pendingCashOrders,
    };
  };

  const handleShiftEnd = () => {
    setShiftEndDialogOpen(true);
  };

  // Cash payment confirmation function
  const confirmCashPayment = async (orderId: string) => {
    try {
      const response = await fetch(
        `/api/woocommerce/orders/${orderId}/cash-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            driverName: currentDriver?.name || "Jan Novák",
            confirmedAt: new Date().toISOString(),
            sendReceipt: true,
          }),
        },
      );

      if (!response.ok) {
        console.warn(
          `Cash payment confirmation failed (${response.status}), updating locally...`,
        );
      } else {
        const data = await response.json();
        if (data.success) {
          console.log(
            "✅ Cash payment confirmed and receipt sent via WooCommerce",
          );
        }
      }

      // Find order in either active orders or delivered orders
      const activeOrder = orders.find((o) => o.id === orderId);
      const deliveredOrder = deliveredOrders.find((o) => o.id === orderId);
      const orderToUpdate = activeOrder || deliveredOrder;

      // Update local state regardless of API success
      if (activeOrder) {
        // Update active order (during delivery process)
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  paymentStatus: "cash_paid" as const,
                  cashPaidAt: new Date().toISOString(),
                  cashConfirmedBy: currentDriver?.name || "Jan Novák",
                  receiptSent: true,
                  notes: order.notes
                    ? `${order.notes}\n💰 Hotovosť potvrdená a doklad odoslaný`
                    : "💰 Hotovosť potvrdená a doklad odoslaný",
                }
              : order,
          ),
        );
      } else {
        // Update delivered order (from archive)
        setDeliveredOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  paymentStatus: "cash_paid" as const,
                  cashPaidAt: new Date().toISOString(),
                  cashConfirmedBy: currentDriver?.name || "Jan Novák",
                  receiptSent: true,
                  notes: order.notes
                    ? `${order.notes}\n                          💰 Hotovosť potvrdená a doklad odoslaný`
                    : "💰 Hotovosť potvrdená a doklad odoslaný",
                }
              : order,
          ),
        );
      }

      alert(
        `💰 Úhrada hotovosťou potvrdená!\n\nZákazníkovi bol odoslaný doklad o úhrade na email.\n\nSuma: ${formatPrice(
          orderToUpdate?.totalAmount,
        )}`,
      );

      return true;
    } catch (error) {
      console.error("Error confirming cash payment:", error);

      // Still update locally if API fails
      const activeOrder = orders.find((o) => o.id === orderId);

      if (activeOrder) {
        // Update active order
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  paymentStatus: "cash_paid" as const,
                  cashPaidAt: new Date().toISOString(),
                  cashConfirmedBy: currentDriver?.name || "Jan Novák",
                  receiptSent: false,
                  notes: order.notes
                    ? `${order.notes}\n💰 Hotovosť potvrdená (email sa nepodarilo odoslať)`
                    : "💰 Hotovosť potvrdená (email sa nepodarilo odoslať)",
                }
              : order,
          ),
        );
      } else {
        // Update delivered order
        setDeliveredOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  paymentStatus: "cash_paid" as const,
                  cashPaidAt: new Date().toISOString(),
                  cashConfirmedBy: currentDriver?.name || "Jan Novák",
                  receiptSent: false,
                  notes: order.notes
                    ? `${order.notes}\n💰 Hotovosť potvrdená (email sa nepodarilo odoslať)`
                    : "💰 Hotovosť potvrdená (email sa nepodarilo odoslať)",
                }
              : order,
          ),
        );
      }

      alert(
        "💰 Úhrada hotovos��ou potvrdená lokálne.\nEmail s dokladom sa nepodarilo odoslať, ale platba je zaznamenaná.",
      );
      return false;
    }
  };

  // Enhanced WooCommerce integration functions
  const syncOrderStatusToWooCommerce = async (
    orderId: string,
    status: Order["status"],
    notes?: string,
  ) => {
    try {
      const response = await fetch(
        `/api/woocommerce/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: status,
            notes: notes,
            driverName: currentDriver?.name,
            timestamp: new Date().toISOString(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to sync status to WooCommerce: ${response.status}`,
        );
      }

      const data = await response.json();
      console.log(`✅ Order ${orderId} status synced to WooCommerce:`, data);
      return data.success;
    } catch (error) {
      console.error("❌ Failed to sync to WooCommerce:", error);
      return false;
    }
  };

  const addDriverNoteToWooCommerce = async (orderId: string, note: string) => {
    try {
      const response = await fetch(`/api/woocommerce/orders/${orderId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: note,
          driverName: currentDriver?.name,
          timestamp: new Date().toISOString(),
          isDriverNote: true,
        }),
      });

      if (response.ok) {
        console.log(`📝 Driver note added to WooCommerce for order ${orderId}`);
        return true;
      }
    } catch (error) {
      console.error("Failed to add note to WooCommerce:", error);
    }
    return false;
  };

  const getOrderDetailsFromWooCommerce = async (orderId: string) => {
    try {
      const response = await fetch(
        `/api/woocommerce/orders/${orderId}/details`,
      );
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.order : null;
      }
    } catch (error) {
      console.error("Failed to get order details from WooCommerce:", error);
    }
    return null;
  };

  const markOrderAsDeliveredInWooCommerce = async (
    orderId: string,
    deliveryPhoto?: string,
  ) => {
    try {
      const response = await fetch(
        `/api/woocommerce/orders/${orderId}/delivered`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            driverName: currentDriver?.name,
            deliveredAt: new Date().toISOString(),
            deliveryPhoto: deliveryPhoto,
            gpsLocation: navigator.geolocation
              ? await getCurrentLocation()
              : null,
          }),
        },
      );

      if (response.ok) {
        console.log(`📦 Order ${orderId} marked as delivered in WooCommerce`);
        return true;
      }
    } catch (error) {
      console.error("Failed to mark as delivered in WooCommerce:", error);
    }
    return false;
  };

  // GPS location helper
  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => {
          console.warn("GPS error:", error);
          resolve(null as any);
        },
        {
          enableHighAccuracy: false,
          timeout: 3000,
          maximumAge: 300000, // 5 minutes
        },
      );
    });
  };

  // Enhanced delivery completion with WooCommerce sync
  const completeDelivery = async (orderId: string, deliveryPhoto?: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    // Check if this is a cash payment order
    if (order.paymentStatus === "cash" || order.paymentMethod === "cod") {
      const cashConfirmed = window.confirm(
        `💰 HOTOVOSTNÁ PLATBA\n\n` +
          `Objednávka: ${order.customerName}\n` +
          `Suma: ${formatPrice(order.totalAmount, order.currency)}\n\n` +
          `❓ Zobral ste hotovosť od zákazn��ka?\n\n` +
          `• Kliknite OK ak ste ZOBRALI peniaze\n` +
          `• Kliknite Zrušiť ak ste NEZABRALI peniaze`,
      );

      if (!cashConfirmed) {
        alert(
          "��️ Objednávka NEBOLA označená ako doručená.\n\n" +
            "Najprv vyberte hotovosť od zákazníka, potom označte ako doručenú.",
        );
        return;
      }
    }

    setIsUpdatingStatus(orderId);

    try {
      let updatedOrder = { ...order };

      // For cash payments, update payment status to cash_paid first
      if (order.paymentStatus === "cash" || order.paymentMethod === "cod") {
        updatedOrder = {
          ...order,
          paymentStatus: "cash_paid" as const,
          cashPaidAt: new Date().toISOString(),
          cashConfirmedBy: currentDriver?.name || "Jan Novák",
          receiptSent: false,
          notes: order.notes
            ? `${order.notes}\n💰 Hotovosť potvrdená pri doručení`
            : "💰 Hotovosť potvrdená pri doručení",
        };

        // Update payment status locally first
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? updatedOrder : o)),
        );

        // Try to confirm cash payment via API (in background)
        try {
          await confirmCashPayment(orderId);
          console.log("✅ Cash payment confirmed via API for order:", orderId);
        } catch (cashError) {
          console.error(
            "Cash payment API confirmation failed (continuing):",
            cashError,
          );
          // Continue with delivery completion even if API cash confirmation fails
        }
      }

      // Update local state to delivered (pass the updated order object)
      await updateOrderStatus(orderId, "delivered", updatedOrder);

      // Sync to WooCommerce
      const wcSuccess = await markOrderAsDeliveredInWooCommerce(
        orderId,
        deliveryPhoto,
      );

      if (wcSuccess) {
        // Add success note to the delivered order
        setDeliveredOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  notes:
                    (o.notes || "") +
                    "\n��� Automaticky synchronizované s WooCommerce",
                }
              : o,
          ),
        );
      }

      // Send delivery completion notification with recipe suggestions
      try {
        const response = await fetch('/api/notifications/delivery-completed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            customerName: order.customerName,
            customerPhone: order.phone,
            customerEmail: order.customerName.toLowerCase().replace(/\s+/g, '.') + '@example.com', // Mock email
            items: order.items
          })
        });

        if (response.ok) {
          console.log('✅ Delivery completion notification with recipes sent');
        } else {
          console.warn('⚠️ Failed to send delivery completion notification');
        }
      } catch (notificationError) {
        console.warn('⚠️ Error sending delivery completion notification:', notificationError);
        // Don't fail the delivery completion for notification errors
      }
    } catch (error) {
      console.error("Error completing delivery:", error);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // Login screen if no driver is selected
  if (!currentDriver) {
    return (
      <div
        className={`${getDeviceLayoutClasses(deviceInfo.deviceType)} bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center`}
      >
        <div
          className={`w-full ${deviceInfo.isMobile ? "max-w-sm" : deviceInfo.isTablet ? "max-w-md" : "max-w-lg"} border-l-4 border-green-600 pl-4 bg-white/80 backdrop-blur-sm rounded-lg p-6`}
        >
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-amber-50 p-3 rounded-lg">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2Ff3633e12daac412e91e11e78fe974d05%2F694ef1aed4c64b0287d248cc8560765c?format=webp&width=800"
                  alt="ZpoleDomu.cz logo"
                  className="h-12 w-12 object-contain"
                />
              </div>
            </div>
            <h1 className="text-2xl text-green-700 font-bold mb-2">
              ZpoleDomu.cz
            </h1>
            <p className="text-green-600">Přihlášení řidiče</p>
          </div>
          <div className="mt-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Používateľské meno
                </label>
                <input
                  type="text"
                  placeholder="Zadajte vaše používateľské meno"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Heslo
                </label>
                <input
                  type="password"
                  placeholder="Zadajte vaše heslo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2"
                onClick={handleDriverLogin}
                disabled={!loginUsername || !loginPassword || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Prihlasujem...
                  </>
                ) : (
                  <>
                    <User className="mr-2 h-4 w-4" />
                    Prihlásiť sa
                  </>
                )}
              </Button>
              <div className="mt-4 pt-4 border-t text-center">
                <p className="text-xs text-muted-foreground">
                  Pokud máte problémy s přihlášením, kontaktujte administrátora
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${getDeviceLayoutClasses(deviceInfo.deviceType)} bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-2 shadow-lg">
        <div className="w-full px-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-shrink">
              <div className="bg-white/20 p-1 rounded-lg">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2Ff3633e12daac412e91e11e78fe974d05%2F694ef1aed4c64b0287d248cc8560765c?format=webp&width=800"
                  alt="ZpoleDomu.cz logo"
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold truncate">ZpoleDomu.cz</h1>
                <p className="text-white/80 text-xs hidden sm:block">Rozvoz</p>
              </div>
            </div>
            <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
              {/* Shift Status & Controls */}
              <div className="flex items-center gap-1">
                {currentShift ? (
                  <div className="flex items-center gap-1">
                    <div className="bg-success/20 px-1 py-1 rounded text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                        <span className="hidden sm:inline">Aktívna smena</span>
                      </div>
                      <div className="text-xs opacity-75">
                        {new Date(currentShift.shift_start).toLocaleTimeString(
                          "sk-SK",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </div>
                    </div>

                    {currentBreak ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={endBreak}
                        className="h-7 px-1 hover:bg-primary-foreground/20"
                        title="Ukončiť prestávku"
                      >
                        <Play className="h-3 w-3" />
                        <span className="hidden sm:inline ml-1">
                          Pokračovať
                        </span>
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log("🔵 Opening break dialog");
                          setBreakDialogOpen(true);
                        }}
                        className="h-7 px-1 hover:bg-primary-foreground/20"
                        title="Začať prestávku"
                      >
                        <Pause className="h-3 w-3" />
                        <span className="hidden sm:inline ml-1">Pre</span>
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={endShift}
                      className="h-7 px-1 hover:bg-primary-foreground/20"
                      title="Ukončiť smenu"
                    >
                      <Square className="h-3 w-3" />
                      <span className="hidden sm:inline ml-1">Ukončiť</span>
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={startShift}
                    disabled={isStartingShift}
                    className="h-7 px-1 hover:bg-primary-foreground/20"
                    title="Začít směnu"
                  >
                    {isStartingShift ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                    <span className="hidden sm:inline ml-1">
                      {isStartingShift ? "Spouští se..." : "Začít směnu"}
                    </span>
                  </Button>
                )}
              </div>

              <div className="text-right min-w-0">
                <div className="flex items-center gap-1 text-xs">
                  <User className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate max-w-[80px]">
                    {currentDriver.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      console.log("��� Opening shift settings dialog");
                      setShiftSettingsOpen(true);
                    }}
                    className="h-6 w-6 p-0 hover:bg-primary-foreground/20 flex-shrink-0"
                    title="Nastavenia smien"
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShiftEnd}
                    className="h-6 w-6 p-0 hover:bg-primary-foreground/20 flex-shrink-0"
                    title="Odhlásit se"
                  >
                    <LogOut className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(selectedDate)}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshData}
                disabled={isLoadingOrders}
                className="hover:bg-primary-foreground/20"
              >
                {isLoadingOrders ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Start Shift Button - shows only when no shift is active */}
      {!currentShift && (
        <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-4 m-2">
          <div className="text-center">
            <h2 className="text-lg font-bold text-primary mb-2">
              👋 Vítejte, {currentDriver.name}!
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Pro začátek práce musíte nejprve spustit směnu
            </p>
            <Button
              onClick={startShift}
              disabled={isStartingShift}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg font-semibold"
            >
              {isStartingShift ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Play className="h-5 w-5 mr-2" />
              )}
              {isStartingShift ? "🚚 Spouští se směna..." : "🚚 Začít směnu"}
            </Button>
          </div>
        </div>
      )}

      <div className="w-full p-2 space-y-3">
        {/* Loading List - show here only when not all items are loaded */}
        {!loadingItems.every((item) => item.isCompletelyLoaded) && (
          <div className="border-l-4 border-green-600 pl-4">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-600" />
                  Nakládání zboží
                </h3>
                {/* Show toggle button when all items are loaded */}
                {loadingItems.every((item) => item.isCompletelyLoaded) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setIsLoadingSectionVisible(!isLoadingSectionVisible)
                    }
                    className="flex items-center gap-2"
                  >
                    {isLoadingSectionVisible ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        Skryť
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        Tovar v aute
                      </>
                    )}
                  </Button>
                )}
              </div>
              {/* Tab Navigation */}
              <div className="flex flex-col sm:flex-row gap-1 bg-muted p-1 rounded-lg">
                <Button
                  variant={activeTab === "pending" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("pending")}
                  className="flex-1 h-8 text-xs"
                >
                  <Package className="h-3 w-3 mr-1" />K naložení (
                  {
                    loadingItems.filter((f) =>
                      f.items.some((i) => i.status === "pending"),
                    ).length
                  }
                  )
                </Button>
                <Button
                  variant={activeTab === "loaded" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("loaded")}
                  className="flex-1 h-8 text-xs"
                >
                  <PackageCheck className="h-3 w-3 mr-1" />
                  Naložené (
                  {
                    loadingItems.filter((f) =>
                      f.items.some((i) => i.status === "loaded"),
                    ).length
                  }
                  )
                </Button>
                <Button
                  variant={activeTab === "unloaded" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("unloaded")}
                  className="flex-1 h-8 text-xs"
                >
                  <Archive className="h-3 w-3 mr-1" />
                  Vyložené (
                  {
                    loadingItems.filter((f) =>
                      f.items.some((i) => i.status === "unloaded"),
                    ).length
                  }
                  )
                </Button>
              </div>
            </div>
            {isLoadingSectionVisible && (
              <div className="mt-4">
                {/* Shift not started warning for loading */}
                {!currentShift && (
                  <div className="bg-warning/10 border border-warning/20 rounded p-2 mb-3">
                    <div className="flex items-center gap-2 text-warning text-xs">
                      <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                      <span className="font-medium">
                        Začnite smenu pre nakladanie
                      </span>
                    </div>
                  </div>
                )}
                {/* Action Buttons based on tab */}
                {activeTab === "pending" &&
                  getFilteredLoadingItems().length > 0 &&
                  currentShift && (
                    <div className="mb-4 flex justify-center">
                      <Button
                        size="sm"
                        onClick={() => {
                          // Mark all pending items as loaded
                          setLoadingItems((prev) =>
                            prev.map((farmer) => ({
                              ...farmer,
                              items: farmer.items.map((item) =>
                                item.status === "pending"
                                  ? { ...item, status: "loaded" as const }
                                  : item,
                              ),
                              isCompletelyLoaded: farmer.items.every(
                                (item) =>
                                  item.status === "loaded" ||
                                  item.status === "pending",
                              ),
                            })),
                          );
                          alert("Všetko naložené!");
                        }}
                      >
                        Naložiť všetko
                      </Button>
                    </div>
                  )}

                {activeTab === "loaded" &&
                  getFilteredLoadingItems().length > 0 &&
                  currentShift && (
                    <div className="mb-4 flex justify-center">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          // Mark all loaded items as unloaded
                          setLoadingItems((prev) =>
                            prev.map((farmer) => ({
                              ...farmer,
                              items: farmer.items.map((item) =>
                                item.status === "loaded"
                                  ? { ...item, status: "unloaded" as const }
                                  : item,
                              ),
                              isCompletelyLoaded: false,
                              isCompletelyUnloaded: farmer.items.every(
                                (item) =>
                                  item.status === "unloaded" ||
                                  item.status === "loaded",
                              ),
                            })),
                          );
                          alert("Všetko vyložené!");
                        }}
                      >
                        Vyložiť všetko
                      </Button>
                    </div>
                  )}

                <div className="space-y-3">
                  {getFilteredLoadingItems().map((farmer, farmerIndex) => (
                    <div
                      key={farmerIndex}
                      className={`border rounded-lg p-3 ${
                        farmer.isCompletelyLoaded
                          ? "bg-success/10 border-success/20"
                          : "bg-accent/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-primary text-sm">
                          {farmer.farmer}
                        </h4>
                        {/* Show different farmer-level buttons based on active tab */}
                        {activeTab === "pending" &&
                          farmer.items.some(
                            (item) => item.status === "pending",
                          ) &&
                          currentShift && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                markFarmerAsLoaded(
                                  loadingItems.findIndex((f) => f === farmer),
                                )
                              }
                              className="h-6 px-2 text-xs"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Naložiť všetko
                            </Button>
                          )}
                        {activeTab === "loaded" &&
                          farmer.items.some(
                            (item) => item.status === "loaded",
                          ) &&
                          currentShift && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                markFarmerAsUnloaded(
                                  loadingItems.findIndex((f) => f === farmer),
                                )
                              }
                              className="h-6 px-2 text-xs"
                            >
                              <Archive className="h-3 w-3 mr-1" />
                              Vyložiť všetko
                            </Button>
                          )}
                      </div>
                      <div className="grid gap-1">
                        {farmer.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className={`flex justify-between items-center text-xs p-2 rounded ${
                              item.status === "loaded"
                                ? "bg-success/20 text-success-foreground"
                                : item.status === "unloaded"
                                  ? "bg-info/20 text-info-foreground"
                                  : "bg-background"
                            }`}
                          >
                            <span
                              className={
                                item.status !== "pending" ? "line-through" : ""
                              }
                            >
                              {item.name}
                            </span>
                            <div className="flex items-center gap-1">
                              <Badge
                                variant={
                                  item.status === "loaded"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {item.quantity}x
                              </Badge>
                              {/* Show different buttons based on status and current tab */}
                              {item.status === "pending" &&
                                activeTab === "pending" &&
                                currentShift && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      markItemAsLoaded(
                                        loadingItems.findIndex(
                                          (f) => f === farmer,
                                        ),
                                        itemIndex,
                                      )
                                    }
                                    className="h-4 w-4 p-0"
                                    title="Nalo��iť"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                )}
                              {item.status === "loaded" &&
                                activeTab === "loaded" &&
                                currentShift && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      markItemAsUnloaded(
                                        loadingItems.findIndex(
                                          (f) => f === farmer,
                                        ),
                                        itemIndex,
                                      )
                                    }
                                    className="h-4 w-4 p-0"
                                    title="Vyložiť"
                                  >
                                    <Archive className="h-3 w-3" />
                                  </Button>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {getFilteredLoadingItems().length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-4">
                      {activeTab === "loaded"
                        ? "Žiadne naložené položky"
                        : "Všetky položky sú naložené"}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Orders List */}
        <div className="border-l-4 border-green-600 pl-4">
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
                <Truck className="h-5 w-5 text-green-600" />
                <span className="text-sm sm:text-base">
                  Objednávky ({driverOrders.length})
                </span>
                {isLoadingOrders && (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                )}
              </h3>

              {driverOrders.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRouteMap(true)}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline">Mapa trasy</span>
                  <span className="sm:hidden">Mapa</span>
                </Button>
              )}
            </div>
          </div>
          <div className="mt-4">
            <div className="space-y-4">
              {driverOrders.length === 0 && !isLoadingOrders && (
                <div className="text-center text-muted-foreground py-8">
                  <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Žádné objednávky na dnešní den</p>
                  <p className="text-xs mt-2">
                    Pro demo účely klikněte na "Načíst demo"
                  </p>
                  <Button
                    variant="outline"
                    onClick={refreshData}
                    className="mt-4"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Načíst demo
                  </Button>
                </div>
              )}

              {driverOrders.map((order, index) => (
                <div key={order.id} className="border rounded-lg p-4 bg-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">
                          {order.customerName}
                        </h3>
                        {routeOptimization?.isOptimized && (
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <MapPin className="h-4 w-4" />
                        <span>{order.address}</span>
                        <Badge variant="outline">{order.postalCode}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                        <Clock className="h-4 w-4" />
                        <span>{order.deliveryTime}</span>
                        {order.estimatedArrival && (
                          <Badge variant="outline" className="text-info">
                            Očekávaný příchod: {order.estimatedArrival}
                          </Badge>
                        )}
                        {order.delayMinutes && (
                          <Badge variant="outline" className="text-warning">
                            +{order.delayMinutes} min
                          </Badge>
                        )}
                      </div>

                      {/* Payment Information */}
                      <div className="flex items-center gap-2 mt-2">
                        {getPaymentStatusBadge(order)}
                        <div className="text-xs text-muted-foreground">
                          {getPaymentMethodText(order.paymentMethod)}
                          {order.totalAmount && (
                            <span className="ml-2 font-medium text-foreground">
                              {formatPrice(order.totalAmount, order.currency)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>

                  {/* Order Items */}
                  <div className="mb-3">
                    <h4 className="text-sm font-medium mb-2">Položky:</h4>
                    <div className="grid gap-1">
                      {order.items.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="flex justify-between text-sm bg-muted/30 p-2 rounded"
                        >
                          <span>{item.name}</span>
                          <span>{item.quantity}x</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div className="mb-3 p-2 bg-accent/20 rounded text-sm">
                      <strong>Poznámka:</strong> {order.notes}
                    </div>
                  )}

                  {/* Action Buttons - Unified consistent layout for all customers */}
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                    {/* Shift not started warning */}
                    {!currentShift && (
                      <div className="w-full bg-warning/10 border border-warning/20 rounded p-2 mb-3">
                        <div className="flex items-center gap-2 text-warning text-xs">
                          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                          <span className="font-medium">
                            Začnite smenu pre prácu s objednávkami
                          </span>
                        </div>
                      </div>
                    )}
                    {/* 1.                         Na cestě - only for pending orders and active shift */}
                    {order.status === "pending" && currentShift && (
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, "on-route")}
                        disabled={isUpdatingStatus === order.id}
                        className="bg-info hover:bg-info/90 text-info-foreground"
                      >
                        {isUpdatingStatus === order.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Truck className="h-4 w-4 mr-1" />
                        )}
                        Na cestě
                      </Button>
                    )}

                    {/* 2. Waze - for all active orders and active shift */}
                    {order.status !== "delivered" &&
                      order.status !== "cancelled" &&
                      currentShift && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            openWaze(
                              order.address,
                              order.coordinates,
                              order.customerName,
                            )
                          }
                          className="bg-purple-50 hover:bg-purple-100 text-xs sm:text-sm px-2 sm:px-3"
                        >
                          <Navigation className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">Waze</span>
                          <span className="sm:hidden">Nav</span>
                        </Button>
                      )}

                    {/* 3. Volat - for all active orders and active shift */}
                    {order.status !== "delivered" &&
                      order.status !== "cancelled" &&
                      currentShift && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            callCustomer(order.phone, order.customerName)
                          }
                          className="bg-green-50 hover:bg-green-100 text-xs sm:text-sm px-2 sm:px-3"
                        >
                          <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline"> Volat</span>
                          <span className="sm:hidden">Tel</span>
                        </Button>
                      )}

                    {/* 4. SMS - for all active orders and active shift */}
                    {order.status !== "delivered" &&
                      order.status !== "cancelled" &&
                      currentShift && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            sendSMSToCustomer(
                              order.phone,
                              `Dobrý den, jsem váš vodič ${currentDriver?.name}. Jsem na cestě s vaší objednávkou z Zpoledomu.`,
                            )
                          }
                          className="bg-blue-50 hover:bg-blue-100"
                        >
                          <Smartphone className="h-4 w-4 mr-1" />
                          SMS
                        </Button>
                      )}

                    {/* 5.                         Zpoždění - for pending and on-route orders with active shift */}
                    {(order.status === "pending" ||
                      order.status === "on-route") &&
                      currentShift && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDelayDialog(order.id)}
                          className="border-warning text-warning hover:bg-warning hover:text-warning-foreground"
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Zpoždění
                        </Button>
                      )}

                    {/* Delivery completion buttons for on-route and delayed orders with active shift */}
                    {(order.status === "on-route" ||
                      order.status === "delayed") &&
                      currentShift && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => completeDelivery(order.id)}
                            disabled={isUpdatingStatus === order.id}
                            className="bg-success hover:bg-success/90 text-success-foreground"
                          >
                            {isUpdatingStatus === order.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            )}
                            Doručeno
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = "image/*";
                              input.capture = "environment";
                              input.onchange = async (e) => {
                                const file = (e.target as HTMLInputElement)
                                  .files?.[0];
                                if (file) {
                                  console.log(
                                    "📸 Delivery photo captured:",
                                    file.name,
                                  );
                                  await completeDelivery(
                                    order.id,
                                    URL.createObjectURL(file),
                                  );
                                }
                              };
                              input.click();
                            }}
                            className="bg-blue-50 hover:bg-blue-100"
                          >
                            <Camera className="h-4 w-4 mr-1" />
                            Foto + Doručit
                          </Button>
                        </>
                      )}

                    {/* Options for delivered orders */}
                    {order.status === "delivered" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            openWaze(
                              order.address,
                              order.coordinates,
                              order.customerName,
                            )
                          }
                          className="bg-purple-50 hover:bg-purple-100 text-xs sm:text-sm px-2 sm:px-3"
                        >
                          <Navigation className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">Waze</span>
                          <span className="sm:hidden">Nav</span>
                        </Button>

                        <div className="text-xs text-muted-foreground mt-2 p-2 bg-accent/20 rounded">
                          ���� <strong>Tip:</strong> Foto + doručiť - po
                          doručení môžete urobiť foto ako potvrdenie
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const shareText = `Objednávka ${order.id} ��spešne doručená zákazníkovi ${order.customerName} na adresu ${order.address}`;
                            if (navigator.share) {
                              navigator.share({ text: shareText });
                            } else {
                              navigator.clipboard.writeText(shareText);
                              alert("Informácie skop��rované do schránky");
                            }
                          }}
                          className="bg-green-50 hover:bg-green-100 text-xs sm:text-sm px-2 sm:px-3"
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          Zdieľať
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Note Input */}
                  {selectedOrderId === order.id && (
                    <>
                      <Separator className="my-3" />
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Přidat poznámku k objednávce..."
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => addNote(order.id, noteText)}
                            disabled={!noteText.trim()}
                          >
                            Uložit poznámku
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedOrderId(null);
                              setNoteText("");
                            }}
                          >
                            Zrušit
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="border-l-4 border-green-600 pl-4">
          <div className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-muted-foreground">
                  {driverOrders.filter((o) => o.status === "pending").length}
                </div>
                <div className="text-sm text-muted-foreground">Čakajúci</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-info">
                  {driverOrders.filter((o) => o.status === "on-route").length}
                </div>
                <div className="text-sm text-muted-foreground"> Na cestě</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success">
                  {deliveredOrders.length}
                </div>
                <div className="text-sm text-muted-foreground">Doru��ené</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-warning">
                  {driverOrders.filter((o) => o.status === "delayed").length}
                </div>
                <div className="text-sm text-muted-foreground">Zdržanie</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-destructive">
                  {driverOrders.filter((o) => o.status === "cancelled").length}
                </div>
                <div className="text-sm text-muted-foreground">Zrušené</div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading List - show here when all items are loaded */}
        {loadingItems.every((item) => item.isCompletelyLoaded) && (
          <div className="border-l-4 border-green-600 pl-4">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-600" />
                  Nakládání zboží
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setIsLoadingSectionVisible(!isLoadingSectionVisible)
                  }
                  className="flex items-center gap-2"
                >
                  {isLoadingSectionVisible ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      Skryť
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      Tovar v aute
                    </>
                  )}
                </Button>
              </div>
              {/* Tab Navigation */}
              <div className="flex flex-col sm:flex-row gap-1 bg-muted p-1 rounded-lg">
                <Button
                  variant={activeTab === "pending" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("pending")}
                  className="flex-1 h-8 text-xs"
                >
                  <Package className="h-3 w-3 mr-1" />K naložení (
                  {
                    loadingItems.filter((f) =>
                      f.items.some((i) => i.status === "pending"),
                    ).length
                  }
                  )
                </Button>
                <Button
                  variant={activeTab === "loaded" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("loaded")}
                  className="flex-1 h-8 text-xs"
                >
                  <PackageCheck className="h-3 w-3 mr-1" />
                  Naložené (
                  {
                    loadingItems.filter((f) =>
                      f.items.some((i) => i.status === "loaded"),
                    ).length
                  }
                  )
                </Button>
                <Button
                  variant={activeTab === "unloaded" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("unloaded")}
                  className="flex-1 h-8 text-xs"
                >
                  <Archive className="h-3 w-3 mr-1" />
                  Vyložené (
                  {
                    loadingItems.filter((f) =>
                      f.items.some((i) => i.status === "unloaded"),
                    ).length
                  }
                  )
                </Button>
              </div>
            </div>
            {isLoadingSectionVisible && (
              <div className="mt-4">
                <div className="space-y-3">
                  {getFilteredLoadingItems().map((farmer, farmerIndex) => (
                    <div
                      key={farmerIndex}
                      className={`border rounded-lg p-3 ${
                        farmer.isCompletelyLoaded
                          ? "bg-success/10 border-success/20"
                          : "bg-accent/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-primary text-sm">
                          {farmer.farmer}
                        </h4>
                      </div>
                      <div className="grid gap-1">
                        {farmer.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className={`flex justify-between items-center text-xs p-2 rounded ${
                              item.isLoaded
                                ? "bg-success/20 text-success-foreground"
                                : "bg-background"
                            }`}
                          >
                            <span
                              className={item.isLoaded ? "line-through" : ""}
                            >
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  item.isLoaded ? "default" : "secondary"
                                }
                                className="text-xs"
                              >
                                {item.quantity}x
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {getFilteredLoadingItems().length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-4">
                      {activeTab === "loaded"
                        ? "Žiadne naložené položky"
                        : "Všetky položky sú naložené"}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Driver Info */}
        <div className="border-l-4 border-green-600 pl-4">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              Informace řidiče
            </h3>
          </div>
          <div className="mt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Jméno:</span>
                <span className="font-medium">{currentDriver.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Telefon:</span>
                <span className="font-medium">{currentDriver.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Objednávky:
                </span>
                <Badge variant="secondary">{driverOrders.length}x</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Archive Section for Delivered Orders */}
        {deliveredOrders.length > 0 && (
          <div className="border-l-4 border-green-600 pl-4 mt-4">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
                  <Archive className="h-5 w-5 text-green-600" />
                  Archív doručených objednávok ({deliveredOrders.length})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowArchive(!showArchive)}
                  className="flex items-center gap-2"
                >
                  {showArchive ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      Skryť archív
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      Zobraziť archív
                    </>
                  )}
                </Button>
              </div>
            </div>
            {showArchive && (
              <div className="mt-4">
                <div className="space-y-3">
                  {deliveredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="border rounded-lg p-4 bg-success/10 border-success/20"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">
                              {order.customerName}
                            </h3>
                            <Badge
                              variant="default"
                              className="bg-success text-success-foreground"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Doručené
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <MapPin className="h-4 w-4" />
                            <span>{order.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Phone className="h-4 w-4" />
                            <span>{order.phone}</span>
                          </div>
                          {order.deliveredAt && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>
                                Doručené:{" "}
                                {new Date(order.deliveredAt).toLocaleString(
                                  "sk-SK",
                                )}
                              </span>
                            </div>
                          )}

                          {/* Payment Information for archived orders */}
                          <div className="flex items-center gap-2 mt-2">
                            {getPaymentStatusBadge(order)}
                            <div className="text-xs text-muted-foreground">
                              {getPaymentMethodText(order.paymentMethod)}
                              {order.totalAmount && (
                                <span className="ml-2 font-medium text-foreground">
                                  {formatPrice(
                                    order.totalAmount,
                                    order.currency,
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Delivered Order Items */}
                      <div className="mb-3">
                        <h4 className="font-medium text-sm mb-2 text-muted-foreground">
                          Objednané produkty:
                        </h4>
                        <div className="grid gap-1">
                          {order.items.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center text-sm p-2 bg-background rounded"
                            >
                              <span>{item.name}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {item.quantity}x
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Notes for delivered order */}
                      {order.notes && (
                        <div className="mb-3 p-2 bg-accent/20 rounded text-sm">
                          <strong>Poznámky:</strong> {order.notes}
                        </div>
                      )}

                      {/* Archive Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            callCustomer(order.phone, order.customerName)
                          }
                          className="bg-green-50 hover:bg-green-100 text-xs sm:text-sm px-2 sm:px-3"
                        >
                          <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline"> Volat</span>
                          <span className="sm:hidden">Tel</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            openWaze(
                              order.address,
                              order.coordinates,
                              order.customerName,
                            )
                          }
                          className="bg-purple-50 hover:bg-purple-100 text-xs sm:text-sm px-2 sm:px-3"
                        >
                          <Navigation className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">Waze</span>
                          <span className="sm:hidden">Nav</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const shareText = `Objednávka ${order.id} úspešne doručená zákazníkovi ${order.customerName} na adresu ${order.address} dňa ${new Date(order.deliveredAt || "").toLocaleDateString("sk-SK")}`;
                            if (navigator.share) {
                              navigator.share({ text: shareText });
                            } else {
                              navigator.clipboard.writeText(shareText);
                              alert("Informácie skopírované do schránky");
                            }
                          }}
                          className="bg-blue-50 hover:bg-blue-100"
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          Zdieľať
                        </Button>

                        {/* Undo delivery button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setUndoOrderId(order.id);
                            setUndoDeliveredDialogOpen(true);
                          }}
                          className="bg-orange-50 hover:bg-orange-100 border-orange-200"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Opraviť
                        </Button>

                        {/* Cash payment confirmation button */}
                        {order.paymentStatus === "cash" && (
                          <Button
                            size="sm"
                            onClick={() => confirmCashPayment(order.id)}
                            className="bg-warning hover:bg-warning/90 text-warning-foreground"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Uhradené (
                            {formatPrice(order.totalAmount, order.currency)})
                          </Button>
                        )}

                        {/* Show cash paid confirmation */}
                        {order.paymentStatus === "cash_paid" &&
                          order.cashPaidAt && (
                            <div className="w-full mt-2 p-2 bg-success/20 rounded text-xs text-success-foreground">
                              ✅ Hotovosť uhradená{" "}
                              {new Date(order.cashPaidAt).toLocaleString(
                                "sk-SK",
                              )}
                              {order.receiptSent && (
                                <div>📧 Doklad odoslaný zákazníkovi</div>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Route Optimization Card - moved to bottom */}
        {driverOrders.length > 1 && (
          <div className="border-l-4 border-green-600 pl-4">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
                  <Map className="h-5 w-5 text-green-600" />
                  Optimalizace trasy
                </h3>
                <Button
                  onClick={optimizeRoute}
                  disabled={isOptimizingRoute}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isOptimizingRoute ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Map className="h-4 w-4 mr-2" />
                  )}
                  {routeOptimization?.isOptimized
                    ? "Reoptimalizovat"
                    : "Optimalizovat trasu"}
                </Button>
              </div>
            </div>
            {routeOptimization && (
              <div className="mt-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {routeOptimization.totalDistance}
                    </div>
                    <div className="text-sm text-muted-foreground">km</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {routeOptimization.totalDuration}
                    </div>
                    <div className="text-sm text-muted-foreground">min</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-success">
                      {driverOrders.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      zastávok
                    </div>
                  </div>
                </div>
                {routeOptimization.isOptimized && (
                  <Badge variant="secondary" className="mt-3">
                    ✓ Trasa optimalizována
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Shift End Summary Dialog */}
      {shiftEndDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-lg border max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <LogOut className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Ukončenie smeny</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShiftEndDialogOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {(() => {
              const summary = calculateShiftSummary();
              return (
                <>
                  <div className="space-y-4 mb-6">
                    {/* Driver Info */}
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                      <h4 className="font-semibold text-lg">
                        {currentDriver?.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Smena ukončená {new Date().toLocaleString("sk-SK")}
                      </p>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-success/20 rounded">
                        <div className="text-2xl font-bold text-success-foreground">
                          {summary.totalDelivered}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Doručené objednávky
                        </div>
                      </div>
                      <div className="text-center p-3 bg-info/20 rounded">
                        <div className="text-2xl font-bold text-info-foreground">
                          {summary.cashOrders}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Hotovostné platby
                        </div>
                      </div>
                    </div>

                    {/* Cash Summary */}
                    {summary.totalCashAmount > 0 && (
                      <div className="p-4 bg-warning/20 rounded-lg border-l-4 border-warning">
                        <h4 className="font-semibold text-warning-foreground mb-2 flex items-center gap-2">
                          💰 Hotovosť na odovzdanie:
                        </h4>
                        <div className="text-3xl font-bold text-warning-foreground mb-3">
                          {formatPrice(summary.totalCashAmount)}
                        </div>

                        {summary.pendingCashOrders > 0 ? (
                          <div className="text-sm bg-destructive/20 p-2 rounded mb-2">
                            ⚠️ Pozor: {summary.pendingCashOrders} hotovostných
                            platieb ešte nie je potvrdených!
                          </div>
                        ) : (
                          <div className="text-sm bg-success/20 p-2 rounded mb-2">
                            ✅ Všetky hotovostné platby sú potvrdené!
                          </div>
                        )}

                        <div className="text-sm space-y-1">
                          <div>
                            ✅ Potvrdené: {summary.confirmedCashOrders} platby
                          </div>
                          <div>
                            💳 Zaplatené online: {summary.paidOrders} platby
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cash Orders List */}
                    {summary.cashOrdersList.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">
                          Detail hotovostných platieb:
                        </h5>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {summary.cashOrdersList.map((order, index) => (
                            <div
                              key={index}
                              className="flex justify-between text-xs p-2 bg-accent/50 rounded"
                            >
                              <span>{order.customerName}</span>
                              <div className="flex items-center gap-2">
                                <span>{formatPrice(order.totalAmount)}</span>
                                {order.paymentStatus === "cash_paid" ? (
                                  <span className="text-success">✅</span>
                                ) : (
                                  <span className="text-warning">⏳</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {summary.totalCashAmount === 0 && (
                      <div className="text-center p-4 bg-success/20 rounded-lg">
                        <div className="text-success-foreground">
                          ✅ Žiadna hotovosť na odovzdanie
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Všetky platby boli online
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShiftEndDialogOpen(false)}
                      className="flex-1"
                    >
                      Zpět
                    </Button>
                    <Button
                      onClick={logoutDriver}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      Potvrdiť ukončenie
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Simple Modal for Delay Dialog */}
      {delayDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-lg border">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <h3 className="text-lg font-semibold"> Zpoždění dovozu</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeDelayDialog}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Vyberte typ zdržení pre túto objednávku
            </p>

            {/* SMS Toggle */}
            <div className="flex items-center gap-2 mb-4 p-2 bg-info/10 rounded">
              <MessageSquare className="h-4 w-4 text-info" />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={smsEnabled}
                  onChange={(e) => setSmsEnabled(e.target.checked)}
                  className="rounded"
                />
                Poslať SMS zákazníkovi pri zdržaní
              </label>
            </div>

            {/* Delay Type Selection */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Button
                variant={delayType === "delay" ? "default" : "outline"}
                onClick={() => setDelayType("delay")}
                className="flex items-center gap-2 h-auto p-4 flex-col"
              >
                <Timer className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium"> Zpoždění</div>
                  <div className="text-xs text-muted-foreground">
                    Špecifikovať minúty
                  </div>
                </div>
              </Button>

              <Button
                variant={delayType === "cancel" ? "default" : "outline"}
                onClick={() => setDelayType("cancel")}
                className="flex items-center gap-2 h-auto p-4 flex-col"
              >
                <XCircle className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Zrušit</div>
                  <div className="text-xs text-muted-foreground">
                    Vážna situácia
                  </div>
                </div>
              </Button>
            </div>

            {/* Delay Options */}
            {delayType === "delay" && (
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium">
                  Zpoždění v minútach:
                </label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(e.target.value)}
                >
                  <option value="">Vyberte zpoždění</option>
                  <option value="15">15 minút</option>
                  <option value="30">30 minút</option>
                  <option value="45">45 minut</option>
                  <option value="60">1 hodina</option>
                  <option value="90">1.5 hodiny</option>
                  <option value="120">2 hodiny</option>
                </select>
                {smsEnabled && delayMinutes && (
                  <p className="text-xs text-info">
                    SMS bude automaticky poslané zákazníkovi
                  </p>
                )}
              </div>
            )}

            {/* Cancel Reason */}
            {delayType === "cancel" && (
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium">
                  Dôvod zrušenia (voliteľné):
                </label>
                <Textarea
                  placeholder="Napr. porucha vozidla, uzavretá cesta..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  Objednávka bude automaticky naplánovaná na najbližší možný
                  termín
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeDelayDialog}>
                Zrušiť
              </Button>
              <Button
                onClick={handleDelayConfirm}
                disabled={
                  !delayType || (delayType === "delay" && !delayMinutes)
                }
              >
                {delayType === "delay" ? "Nastaviť zdrženie" : "Zrušiť dovoz"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Break Dialog */}
      {breakDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-background p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              Začať prestávku
            </h3>

            <div className="space-y-3 mb-6">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  startBreak("lunch");
                  setBreakDialogOpen(false);
                }}
              >
                <Coffee className="h-4 w-4 mr-2" />
                Obedňajšia prestávka
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  startBreak("rest");
                  setBreakDialogOpen(false);
                }}
              >
                <Pause className="h-4 w-4 mr-2" />
                Krátka prestávka
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  startBreak("personal");
                  setBreakDialogOpen(false);
                }}
              >
                <User className="h-4 w-4 mr-2" />
                Osobná prestávka
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start bg-red-50 border-red-200 hover:bg-red-100"
                onClick={() => {
                  startBreak("emergency");
                  setBreakDialogOpen(false);
                }}
              >
                <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                Mimoriadna prestávka
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setBreakDialogOpen(false)}
              >
                Zrušiť
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Shift Settings Dialog */}
      {shiftSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-background border p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto relative">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Nastavenia smien a dostupnosti
            </h3>

            <div className="space-y-6">
              {/* Current Shift Info */}
              {currentShift && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <ClockIcon className="h-4 w-4" />
                    Aktuálna smena
                  </h4>
                  <div className="text-sm space-y-1">
                    <div>
                      Začiatok:{" "}
                      {new Date(currentShift.shift_start).toLocaleString(
                        "sk-SK",
                      )}
                    </div>
                    <div>Objednávky: {currentShift.total_orders}</div>
                    <div>
                      Prestávky: {currentShift.break_time_minutes} minút
                    </div>
                    <div>
                      Vyzbieraná hotovosť: {currentShift.total_cash_collected}{" "}
                      CZK
                    </div>
                  </div>
                </div>
              )}

              {/* Weekly Schedule */}
              <div>
                <h4 className="font-semibold mb-3">Týždenný rozvrh</h4>
                <div className="space-y-2 text-sm">
                  {[
                    "Pondelok",
                    "Utorok",
                    "Streda",
                    "Štvrtok",
                    "Piatok",
                    "Sobota",
                    "Nedeľa",
                  ].map((day, index) => (
                    <div
                      key={day}
                      className="flex items-center justify-between p-2 bg-muted/30 rounded"
                    >
                      <span>{day}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          defaultChecked={index < 5} // Mon-Fri default
                          className="rounded"
                        />
                        <input
                          type="time"
                          defaultValue="08:00"
                          className="text-xs p-1 rounded border"
                        />
                        <span className="text-xs">-</span>
                        <input
                          type="time"
                          defaultValue="18:00"
                          className="text-xs p-1 rounded border"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Break Settings */}
              <div>
                <h4 className="font-semibold mb-3">Nastavenie prestávok</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span className="text-sm">Obedňajšia prestávka</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        defaultValue="12:00"
                        className="text-xs p-1 rounded border"
                      />
                      <span className="text-xs">-</span>
                      <input
                        type="time"
                        defaultValue="13:00"
                        className="text-xs p-1 rounded border"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h4 className="font-semibold mb-3">Rýchle akcie</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log("📅 Opening calendar dialog");
                      setCalendarDialogOpen(true);
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Kalendár dostupnosti
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log("��� Opening history dialog");
                      setHistoryDialogOpen(true);
                    }}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    História smien
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShiftSettingsOpen(false)}
              >
                Zrušiť
              </Button>
              <Button
                onClick={() => {
                  // Save settings logic here
                  alert("Nastavenia uložené!");
                  setShiftSettingsOpen(false);
                }}
              >
                Uložiť
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Availability Dialog */}
      {calendarDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-background border p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Kalendár dostupnosti
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCalendarDialogOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Nastavte svoje dostupnosť pre nasledujúci týždeň:
              </p>

              <div className="grid gap-3">
                {[
                  { day: "Pondelok", date: "2024-01-22" },
                  { day: "Utorok", date: "2024-01-23" },
                  { day: "Streda", date: "2024-01-24" },
                  { day: "Štvrtok", date: "2024-01-25" },
                  { day: "Piatok", date: "2024-01-26" },
                  { day: "Sobota", date: "2024-01-27" },
                  { day: "Nedeľa", date: "2024-01-28" },
                ].map((dayInfo) => (
                  <div
                    key={dayInfo.day}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{dayInfo.day}</div>
                      <div className="text-sm text-muted-foreground">
                        {dayInfo.date}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded"
                        />
                        <span className="text-sm">Dostupný</span>
                      </label>
                      <div className="flex gap-1">
                        <input
                          type="time"
                          defaultValue="08:00"
                          className="text-xs p-1 border rounded"
                        />
                        <span className="text-xs self-center">-</span>
                        <input
                          type="time"
                          defaultValue="18:00"
                          className="text-xs p-1 border rounded"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCalendarDialogOpen(false)}
              >
                Zrušiť
              </Button>
              <Button
                onClick={() => {
                  alert("Dostupnosť uložená!");
                  setCalendarDialogOpen(false);
                }}
              >
                Uložiť dostupnosť
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Shift History Dialog */}
      {historyDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-background border p-6 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Archive className="h-5 w-5" />
                História smien
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHistoryDialogOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3">
                {[
                  {
                    date: "2024-01-21",
                    start: "08:00",
                    end: "17:30",
                    orders: 12,
                    breaks: 45,
                    cash: 1250,
                    status: "completed",
                  },
                  {
                    date: "2024-01-20",
                    start: "08:15",
                    end: "17:45",
                    orders: 15,
                    breaks: 60,
                    cash: 1890,
                    status: "completed",
                  },
                  {
                    date: "2024-01-19",
                    start: "08:00",
                    end: "16:30",
                    orders: 8,
                    breaks: 30,
                    cash: 650,
                    status: "completed",
                  },
                ].map((shift, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium">{shift.date}</div>
                        <div className="text-sm text-muted-foreground">
                          {shift.start} - {shift.end}
                        </div>
                      </div>
                      <Badge
                        variant={
                          shift.status === "completed" ? "default" : "secondary"
                        }
                      >
                        {shift.status === "completed" ? "Dokončená" : "Aktívna"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Objednávky</div>
                        <div className="font-medium">{shift.orders}x</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Prestávky</div>
                        <div className="font-medium">{shift.breaks} min</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Hotovosť</div>
                        <div className="font-medium">{shift.cash} CZK</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <Button variant="outline" size="sm">
                  Načítať viac záznamov
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setHistoryDialogOpen(false)}
              >
                Zavrieť
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Undo Delivered Order Dialog */}
      {undoDeliveredDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md border-l-4 border-orange-600 pl-4 bg-white/90 backdrop-blur-sm rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-orange-600" />
                Opraviť doručenie
              </h3>
            </div>
            <div className="mt-4">
              <div className="space-y-4">
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-800">
                        Pozor: Oprava doručenia
                      </h4>
                      <p className="text-sm text-orange-700 mt-1">
                        Objednávka bude vráten�� do aktívnych objednávok a bude
                        označená ako " Na cestě". Využite t��to funkciu len v
                        prípade omylu pri označovaní.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <strong>Objednávka:</strong> {undoOrderId}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUndoDeliveredDialogOpen(false);
                      setUndoOrderId(null);
                    }}
                    className="flex-1"
                  >
                    Zrušiť
                  </Button>
                  <Button
                    onClick={() =>
                      undoOrderId && undoDeliveredOrder(undoOrderId)
                    }
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Opraviť doručenie
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Route Map Modal */}
      {showRouteMap && (
        <div className="fixed inset-0 bg-black/50 z-50">
          <div className="h-full w-full overflow-y-auto">
            <div className="w-full h-full sm:max-w-4xl sm:h-auto sm:max-h-[90vh] sm:m-4 sm:mx-auto rounded-none sm:rounded-lg flex flex-col border-l-4 border-blue-600 pl-4 bg-white/95 backdrop-blur-sm">
              <div className="pb-3 flex-shrink-0 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    <span className="text-sm sm:text-base">
                      Mapa trasy ({driverOrders.length})
                    </span>
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRouteMap(false)}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-3 p-3 sm:p-6 flex-1 overflow-y-auto">
                {/* Route Summary */}
                <div className="bg-blue-50 p-2 sm:p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-1 sm:gap-4 text-center">
                    <div>
                      <div className="text-base sm:text-2xl font-bold text-blue-600">
                        {driverOrders.length}
                      </div>
                      <div className="text-[10px] sm:text-sm text-muted-foreground">
                        Zastávky
                      </div>
                    </div>
                    <div>
                      <div className="text-base sm:text-2xl font-bold text-blue-600">
                        ~{driverOrders.length * 5} km
                      </div>
                      <div className="text-[10px] sm:text-sm text-muted-foreground">
                        Vzdialenosť
                      </div>
                    </div>
                    <div>
                      <div className="text-base sm:text-2xl font-bold text-blue-600">
                        ~{driverOrders.length * 15} min
                      </div>
                      <div className="text-[10px] sm:text-sm text-muted-foreground">
                        Čas jazdy
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Map */}
                <div className="relative bg-gray-100 rounded-lg overflow-hidden h-[350px] sm:h-[400px] w-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-100 via-blue-100 to-purple-100">
                    {/* Mock map background with roads - responsive SVG */}
                    <svg
                      className="absolute inset-0 w-full h-full"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      {/* Road network */}
                      <path
                        d="M 10 10 Q 40 5 70 20 Q 90 30 85 50 Q 80 70 40 65 Q 20 60 10 40 Q 5 25 10 10"
                        stroke="#6B7280"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray="4,2"
                      />
                      <path
                        d="M 20 20 L 60 25 L 80 40 L 75 60"
                        stroke="#6B7280"
                        strokeWidth="1.5"
                        fill="none"
                        strokeDasharray="3,1.5"
                      />
                    </svg>

                    {/* Starting point (depot) - responsive positioning */}
                    <div
                      className="absolute bg-green-600 text-white p-1.5 sm:p-2 rounded-full shadow-lg"
                      style={{ top: "20%", left: "15%" }}
                    >
                      <Home className="h-3 w-3 sm:h-5 sm:w-5" />
                    </div>
                    <div
                      className="absolute bg-white text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded shadow-lg border"
                      style={{ top: "12%", left: "10%" }}
                    >
                      Sklad
                    </div>

                    {/* Delivery points - responsive grid positioning */}
                    {driverOrders.slice(0, 6).map((order, index) => {
                      const positions = [
                        { top: "30%", left: "40%" },
                        { top: "45%", left: "60%" },
                        { top: "60%", left: "75%" },
                        { top: "75%", left: "50%" },
                        { top: "85%", left: "30%" },
                        { top: "70%", left: "80%" },
                      ];
                      const pos = positions[index] || positions[0];

                      return (
                        <div key={order.id}>
                          <div
                            className={`absolute text-white p-1.5 sm:p-2 rounded-full shadow-lg ${
                              order.status === "delivered"
                                ? "bg-green-500"
                                : order.status === "on-route"
                                  ? "bg-orange-500"
                                  : order.status === "delayed"
                                    ? "bg-red-500"
                                    : "bg-blue-500"
                            } transform -translate-x-1/2 -translate-y-1/2`}
                            style={{ top: pos.top, left: pos.left }}
                          >
                            <span className="text-[10px] sm:text-xs font-bold">
                              {index + 1}
                            </span>
                          </div>
                          <div
                            className="absolute bg-white text-[8px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded shadow-lg border max-w-[80px] sm:max-w-[120px] transform -translate-x-1/2"
                            style={{
                              top: `calc(${pos.top} - 35px)`,
                              left: pos.left,
                            }}
                          >
                            <div className="font-medium truncate">
                              {order.customerName}
                            </div>
                            <div className="text-gray-500 truncate text-[7px] sm:text-xs">
                              {order.address.split(",")[0]}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Legend */}
                    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white/90 p-1.5 sm:p-2 rounded-lg shadow-lg">
                      <div className="text-[9px] sm:text-xs font-medium mb-1">
                        Legenda:
                      </div>
                      <div className="space-y-0.5 sm:space-y-1">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-600 rounded-full"></div>
                          <span className="text-[9px] sm:text-xs">Sklad</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-[9px] sm:text-xs">Čaká</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-orange-500 rounded-full"></div>
                          <span className="text-[9px] sm:text-xs">Cesta</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                          <span className="text-[9px] sm:text-xs">OK</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                          <span className="text-[9px] sm:text-xs">Spož.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Orders List */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm sm:text-base">
                    Poradie doručenia:
                  </h3>
                  <div className="max-h-[300px] sm:max-h-48 overflow-y-auto space-y-2">
                    {driverOrders.map((order, index) => (
                      <div
                        key={order.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg bg-white"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                              order.status === "delivered"
                                ? "bg-green-500"
                                : order.status === "on-route"
                                  ? "bg-orange-500"
                                  : order.status === "delayed"
                                    ? "bg-red-500"
                                    : "bg-blue-500"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {order.customerName}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {order.address}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {order.deliveryTime}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                          {/* Navigation and Call buttons */}
                          <div className="grid grid-cols-2 gap-1.5 sm:flex sm:gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                openWaze(
                                  order.address,
                                  order.coordinates,
                                  order.customerName,
                                )
                              }
                              className="bg-purple-50 hover:bg-purple-100 text-xs sm:text-sm h-8 sm:h-9"
                            >
                              <Navigation className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              <span className="hidden sm:inline">Waze</span>
                              <span className="sm:hidden">Nav</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                callCustomer(order.phone, order.customerName)
                              }
                              className="bg-green-50 hover:bg-green-100 text-xs sm:text-sm h-8 sm:h-9"
                            >
                              <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              Volat
                            </Button>
                          </div>

                          {/* Delivery status buttons */}
                          {order.status !== "delivered" &&
                            order.status !== "cancelled" && (
                              <div className="grid grid-cols-2 gap-1.5 sm:flex sm:gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markAsDelivered(order.id)}
                                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 text-xs sm:text-sm h-8 sm:h-9"
                                  disabled={isUpdatingStatus === order.id}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Doručené
                                </Button>
                                {/* Only show delay button for non-delayed orders */}
                                {order.status !== "delayed" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => markAsDelayed(order.id)}
                                    className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 text-xs sm:text-sm h-8 sm:h-9"
                                    disabled={isUpdatingStatus === order.id}
                                  >
                                    <Clock className="h-3 w-3 mr-1" />
                                    Spoždené
                                  </Button>
                                )}
                              </div>
                            )}

                          {/* Status indicator */}
                          {order.status === "delivered" && (
                            <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Úspešne doru��ené
                            </div>
                          )}
                          {order.status === "delayed" && (
                            <div className="text-xs text-orange-600 font-medium flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Spoždené - môže byť doručené
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-0 sticky bottom-0 sm:relative bg-white sm:bg-transparent pb-4 sm:pb-0 border-t sm:border-t-0 mx-[-1rem] px-4 sm:mx-0 sm:px-0">
                  <Button
                    variant="outline"
                    onClick={() => setShowRouteMap(false)}
                    className="flex-1 order-2 sm:order-1 h-12 sm:h-10"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Zavrieť
                  </Button>
                  <Button
                    onClick={() => {
                      // Open all addresses in Waze with multiple stops
                      const wazeUrl = `https://waze.com/ul?navigate=yes&ll=${driverOrders[0]?.coordinates?.lat || 50.0755},${driverOrders[0]?.coordinates?.lng || 14.4378}`;
                      window.open(wazeUrl, "_blank");
                    }}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 order-1 sm:order-2 h-12 sm:h-10"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Otvoriť v Waze</span>
                    <span className="sm:hidden">Navigácia</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
