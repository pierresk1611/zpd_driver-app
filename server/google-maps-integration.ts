import fetch from "node-fetch";

// Google Maps API Configuration
const GOOGLE_MAPS_CONFIG = {
  apiKey: "AIzaSyCOb7tmFyCwrAJ3idJ8u69cMYS9rOzo1SA",
  baseUrl: "https://maps.googleapis.com/maps/api",
};

interface GoogleMapsGeocodeResult {
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
      location_type: string;
    };
    place_id: string;
    types: string[];
  }>;
  status: string;
}

interface GoogleMapsDistanceMatrixResult {
  destination_addresses: string[];
  origin_addresses: string[];
  rows: Array<{
    elements: Array<{
      distance: {
        text: string;
        value: number;
      };
      duration: {
        text: string;
        value: number;
      };
      status: string;
    }>;
  }>;
  status: string;
}

interface OptimizedRoutePoint {
  orderId: string;
  address: string;
  coordinates: { lat: number; lng: number };
  estimatedArrival: string;
  distanceFromPrevious: number;
  durationFromPrevious: number;
}

// Geocode address to GPS coordinates
export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `${GOOGLE_MAPS_CONFIG.baseUrl}/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_CONFIG.apiKey}&region=cz&language=cs`;

    const response = await fetch(url);
    const data: GoogleMapsGeocodeResult = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      console.log(`📍 Geocoded: ${address} → ${location.lat}, ${location.lng}`);
      return {
        lat: location.lat,
        lng: location.lng,
      };
    } else {
      console.warn(
        `⚠️ Geocoding failed for: ${address}, status: ${data.status}`,
      );
      return null;
    }
  } catch (error) {
    console.error("Google Maps Geocoding error:", error);
    return null;
  }
}

// Batch geocode multiple addresses
export async function batchGeocodeAddresses(
  addresses: string[],
): Promise<
  Array<{ address: string; coordinates: { lat: number; lng: number } | null }>
> {
  const results = [];

  // Process in batches to respect API limits
  const batchSize = 5;
  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);
    const batchPromises = batch.map(async (address) => ({
      address,
      coordinates: await geocodeAddress(address),
    }));

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Add delay between batches to respect rate limits
    if (i + batchSize < addresses.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return results;
}

// Calculate distance matrix between locations
export async function calculateDistanceMatrix(
  origins: Array<{ lat: number; lng: number }>,
  destinations: Array<{ lat: number; lng: number }>,
): Promise<GoogleMapsDistanceMatrixResult | null> {
  try {
    const originsStr = origins.map((o) => `${o.lat},${o.lng}`).join("|");
    const destinationsStr = destinations
      .map((d) => `${d.lat},${d.lng}`)
      .join("|");

    const url = `${GOOGLE_MAPS_CONFIG.baseUrl}/distancematrix/json?origins=${originsStr}&destinations=${destinationsStr}&units=metric&language=cs&key=${GOOGLE_MAPS_CONFIG.apiKey}`;

    const response = await fetch(url);
    const data: GoogleMapsDistanceMatrixResult = await response.json();

    if (data.status === "OK") {
      return data;
    } else {
      console.warn(`⚠️ Distance Matrix failed, status: ${data.status}`);
      return null;
    }
  } catch (error) {
    console.error("Google Maps Distance Matrix error:", error);
    return null;
  }
}

// Optimize delivery route using real Google Maps data
export async function optimizeDeliveryRoute(
  orders: Array<{
    id: string;
    address: string;
    coordinates?: { lat: number; lng: number };
  }>,
  driverLocation: { lat: number; lng: number },
): Promise<{
  success: boolean;
  optimizedRoute?: OptimizedRoutePoint[];
  totalDistance?: number;
  totalDuration?: number;
  error?: string;
}> {
  try {
    console.log(
      `🗺️ Optimizing route for ${orders.length} orders using Google Maps API`,
    );

    // Step 1: Geocode addresses that don't have coordinates
    const ordersWithCoordinates = await Promise.all(
      orders.map(async (order) => {
        if (order.coordinates) {
          return { ...order, coordinates: order.coordinates };
        }

        const coordinates = await geocodeAddress(order.address);
        return {
          ...order,
          coordinates: coordinates || { lat: 50.0755, lng: 14.4378 }, // Fallback to Prague center
        };
      }),
    );

    // Step 2: Calculate distance matrix from driver location to all orders
    const destinations = ordersWithCoordinates.map((o) => o.coordinates);
    const distanceMatrix = await calculateDistanceMatrix(
      [driverLocation],
      destinations,
    );

    if (!distanceMatrix) {
      throw new Error("Failed to get distance matrix from Google Maps");
    }

    // Step 3: Simple greedy optimization (nearest neighbor)
    const optimizedRoute: OptimizedRoutePoint[] = [];
    let currentLocation = driverLocation;
    let remainingOrders = [...ordersWithCoordinates];
    let totalDistance = 0;
    let totalDuration = 0;
    let currentTime = new Date();

    while (remainingOrders.length > 0) {
      // Find nearest order
      const distances = await calculateDistanceMatrix(
        [currentLocation],
        remainingOrders.map((o) => o.coordinates),
      );

      if (!distances || !distances.rows[0]) {
        break;
      }

      let nearestIndex = 0;
      let shortestDistance = Infinity;

      distances.rows[0].elements.forEach((element, index) => {
        if (
          element.status === "OK" &&
          element.distance.value < shortestDistance
        ) {
          shortestDistance = element.distance.value;
          nearestIndex = index;
        }
      });

      const nearestOrder = remainingOrders[nearestIndex];
      const element = distances.rows[0].elements[nearestIndex];

      if (element.status === "OK") {
        // Calculate estimated arrival time
        currentTime = new Date(
          currentTime.getTime() + element.duration.value * 1000,
        );
        const estimatedArrival = `${currentTime.getHours().toString().padStart(2, "0")}:${currentTime.getMinutes().toString().padStart(2, "0")}`;

        optimizedRoute.push({
          orderId: nearestOrder.id,
          address: nearestOrder.address,
          coordinates: nearestOrder.coordinates,
          estimatedArrival,
          distanceFromPrevious:
            Math.round((element.distance.value / 1000) * 100) / 100, // km
          durationFromPrevious: Math.round(element.duration.value / 60), // minutes
        });

        totalDistance += element.distance.value;
        totalDuration += element.duration.value;
        currentLocation = nearestOrder.coordinates;
      }

      // Remove processed order
      remainingOrders.splice(nearestIndex, 1);
    }

    console.log(
      `✅ Route optimized: ${Math.round(totalDistance / 1000)}km, ${Math.round(totalDuration / 60)}min`,
    );

    return {
      success: true,
      optimizedRoute,
      totalDistance: Math.round(totalDistance / 1000), // Convert to km
      totalDuration: Math.round(totalDuration / 60), // Convert to minutes
    };
  } catch (error) {
    console.error("Route optimization error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Get directions URL for Waze/Google Maps
export function getDirectionsUrl(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  provider: "waze" | "google" | "mapy" = "waze",
): string {
  switch (provider) {
    case "waze":
      return `https://waze.com/ul?ll=${to.lat},${to.lng}&navigate=yes`;

    case "google":
      return `https://www.google.com/maps/dir/${from.lat},${from.lng}/${to.lat},${to.lng}`;

    case "mapy":
      return `https://mapy.cz/zakladni?x=${to.lng}&y=${to.lat}&z=17&source=coor&id=${to.lng},${to.lat}`;

    default:
      return `https://waze.com/ul?ll=${to.lat},${to.lng}&navigate=yes`;
  }
}

// Calculate travel time between two points
export async function getTravelTime(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<{ distance: number; duration: number } | null> {
  try {
    const distanceMatrix = await calculateDistanceMatrix([from], [to]);

    if (
      distanceMatrix &&
      distanceMatrix.rows[0]?.elements[0]?.status === "OK"
    ) {
      const element = distanceMatrix.rows[0].elements[0];
      return {
        distance: Math.round((element.distance.value / 1000) * 100) / 100, // km
        duration: Math.round(element.duration.value / 60), // minutes
      };
    }

    return null;
  } catch (error) {
    console.error("Travel time calculation error:", error);
    return null;
  }
}

// Validate Czech postal code and get region info
export function validateCzechPostalCode(postalCode: string): {
  isValid: boolean;
  region?: string;
  city?: string;
} {
  // Basic Czech postal code validation (5 digits with optional space)
  const cleanCode = postalCode.replace(/\s/g, "");
  const isValid = /^\d{5}$/.test(cleanCode);

  if (!isValid) {
    return { isValid: false };
  }

  // Basic region mapping based on first digits
  const firstTwo = parseInt(cleanCode.substring(0, 2));
  let region = "Neznámý";

  if (firstTwo >= 10 && firstTwo <= 19) region = "Praha";
  else if (firstTwo >= 20 && firstTwo <= 29) region = "Středočeský";
  else if (firstTwo >= 30 && firstTwo <= 39) region = "Jihočeský";
  else if (firstTwo >= 40 && firstTwo <= 49) region = "Plzeňský";
  else if (firstTwo >= 50 && firstTwo <= 59) region = "Karlovarský";
  else if (firstTwo >= 60 && firstTwo <= 69) region = "Ústecký";
  else if (firstTwo >= 70 && firstTwo <= 79) region = "Liberecký";
  else if (firstTwo >= 80 && firstTwo <= 89) region = "Královéhradecký";

  return {
    isValid: true,
    region,
    city: firstTwo >= 10 && firstTwo <= 19 ? "Praha" : undefined,
  };
}

// Check if location is within delivery zone
export function isWithinDeliveryZone(
  coordinates: { lat: number; lng: number },
  deliveryCenter = { lat: 50.0755, lng: 14.4378 }, // Prague center
  maxRadiusKm = 50,
): boolean {
  const distance = calculateStraightLineDistance(coordinates, deliveryCenter);
  return distance <= maxRadiusKm;
}

// Calculate straight-line distance between two points (Haversine formula)
function calculateStraightLineDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number },
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * (Math.PI / 180);
  const dLng = (point2.lng - point1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * (Math.PI / 180)) *
      Math.cos(point2.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
