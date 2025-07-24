// Existing demo interfaces
export interface DemoResponse {
  message: string;
}

// WooCommerce API interfaces
export interface WooCommerceOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  billingAddress: {
    address1: string;
    address2?: string;
    city: string;
    postcode: string;
    country: string;
  };
  shippingAddress: {
    address1: string;
    address2?: string;
    city: string;
    postcode: string;
    country: string;
  };
  lineItems: WooCommerceLineItem[];
  status: string;
  dateCreated: string;
  deliveryTime?: string;
  notes?: string;
  metadata: { [key: string]: any };
}

export interface WooCommerceLineItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: string;
  metadata: { [key: string]: any };
}

export interface WooCommerceProduct {
  id: string;
  name: string;
  description: string;
  categories: WooCommerceCategory[];
  price: number;
  inStock: boolean;
  farmer?: string;
}

export interface WooCommerceCategory {
  id: string;
  name: string;
  slug: string;
}

// Route optimization interfaces
export interface RoutePoint {
  orderId: string;
  address: string;
  customerName: string;
  coordinates: Coordinates;
  deliveryTime: string;
  estimatedArrival: string;
  priority: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface OptimizedRoute {
  points: RoutePoint[];
  totalDuration: number; // minutes
  totalDistance: number; // kilometers
  startLocation: Coordinates;
  estimatedCompletionTime: string;
}

export interface DistanceMatrix {
  origins: Coordinates[];
  destinations: Coordinates[];
  distances: number[][]; // meters
  durations: number[][]; // seconds
}

// SMS/WhatsApp interfaces
export interface SMSNotification {
  to: string;
  message: string;
  type: "sms" | "whatsapp";
  timestamp: string;
  status: "pending" | "sent" | "failed";
}

export interface NotificationTemplate {
  type: "on_route" | "delay" | "cancellation" | "delivery_confirmation";
  template: string;
  variables: string[];
}

// Driver and delivery interfaces
export interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  isActive: boolean;
  currentLocation?: Coordinates;
  assignedPostalCodes: string[];
}

export interface DeliveryRoute {
  driverId: string;
  date: string;
  orders: RoutePoint[];
  status: "planned" | "in_progress" | "completed";
  startTime?: string;
  completionTime?: string;
  totalDistance: number;
  totalDuration: number;
}

export interface LoadingList {
  farmerId: string;
  farmerName: string;
  items: LoadingItem[];
  isCompletelyLoaded: boolean;
  loadedAt?: string;
}

export interface LoadingItem {
  productId: string;
  productName: string;
  quantity: number;
  isLoaded: boolean;
  loadedAt?: string;
}

// Postal code and territory interfaces
export interface PostalCodeTerritory {
  postalCode: string;
  city: string;
  district?: string;
  assignedDriverId: string;
  deliveryDays: string[]; // ["monday", "wednesday", "friday"]
  isActive: boolean;
}

export interface DeliveryTerritory {
  id: string;
  name: string;
  postalCodes: string[];
  driverId: string;
  deliverySchedule: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
}

// API Response interfaces
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface OrdersResponse extends APIResponse {
  data: {
    orders: WooCommerceOrder[];
    totalCount: number;
    date: string;
  };
}

export interface RouteOptimizationResponse extends APIResponse {
  data: {
    optimizedRoute: OptimizedRoute;
    originalRoute?: RoutePoint[];
    improvementPercentage: number;
  };
}

export interface SMSResponse extends APIResponse {
  data: {
    messageId: string;
    status: string;
    cost?: number;
  };
}

// Farmer and product category interfaces
export interface Farmer {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  productCategories: string[];
  isActive: boolean;
  deliveryDays: string[];
}

export interface ProductCategory {
  id: string;
  name: string;
  farmerId: string;
  products: string[];
  orderIndex: number; // For loading order (FIFO)
}

// Analytics and reporting interfaces
export interface DeliveryStats {
  date: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  delayedOrders: number;
  averageDeliveryTime: number; // minutes
  totalDistance: number; // kilometers
  fuelCost?: number;
}

export interface DriverPerformance {
  driverId: string;
  period: {
    start: string;
    end: string;
  };
  stats: {
    totalDeliveries: number;
    onTimeDeliveries: number;
    delayedDeliveries: number;
    cancelledDeliveries: number;
    averageDeliveryTime: number;
    customerRating?: number;
  };
}

// Configuration interfaces
export interface AppConfig {
  woocommerce: {
    url: string;
    consumerKey: string;
    consumerSecret: string;
  };
  sms: {
    provider: "twilio" | "textmagic" | "nexmo";
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
  maps: {
    googleMapsApiKey: string;
    defaultCenter: Coordinates;
  };
  delivery: {
    workingHours: {
      start: string; // "08:00"
      end: string; // "18:00"
    };
    timeSlots: string[]; // ["09:00-12:00", "12:00-15:00", "15:00-18:00"]
    maxDeliveryRadius: number; // kilometers
  };
}
