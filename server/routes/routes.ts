import { RequestHandler } from "express";
import { OptimizedRoute, RoutePoint } from "@shared/api";

// Google Maps API konfigurácia
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

interface Coordinates {
  lat: number;
  lng: number;
}

interface DeliveryPoint {
  orderId: string;
  address: string;
  coordinates?: Coordinates;
  customerName: string;
  deliveryTime: string;
  priority: number;
}

// Geocoding - konverzia adresy na súradnice
const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
      };
    }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

// Distance Matrix API - kalkulácia vzdialeností
const getDistanceMatrix = async (
  origins: Coordinates[],
  destinations: Coordinates[],
): Promise<number[][]> => {
  try {
    const originsStr = origins
      .map((point) => `${point.lat},${point.lng}`)
      .join("|");
    const destinationsStr = destinations
      .map((point) => `${point.lat},${point.lng}`)
      .join("|");

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsStr}&destinations=${destinationsStr}&key=${GOOGLE_MAPS_API_KEY}&units=metric`;

    const response = await fetch(url);
    const data = await response.json();

    const matrix: number[][] = [];

    if (data.status === "OK") {
      data.rows.forEach((row: any, i: number) => {
        matrix[i] = [];
        row.elements.forEach((element: any, j: number) => {
          if (element.status === "OK") {
            matrix[i][j] = element.duration.value; // čas v sekundách
          } else {
            matrix[i][j] = Infinity;
          }
        });
      });
    }

    return matrix;
  } catch (error) {
    console.error("Distance Matrix error:", error);
    return [];
  }
};

// Nearest Neighbor algoritmus pre optimalizáciu trasy
const optimizeRouteNearestNeighbor = (
  distanceMatrix: number[][],
  startIndex: number = 0,
): number[] => {
  const numPoints = distanceMatrix.length;
  const visited = new Array(numPoints).fill(false);
  const route = [startIndex];
  visited[startIndex] = true;

  let currentPoint = startIndex;

  for (let i = 1; i < numPoints; i++) {
    let nearestPoint = -1;
    let shortestDistance = Infinity;

    for (let j = 0; j < numPoints; j++) {
      if (!visited[j] && distanceMatrix[currentPoint][j] < shortestDistance) {
        shortestDistance = distanceMatrix[currentPoint][j];
        nearestPoint = j;
      }
    }

    if (nearestPoint !== -1) {
      route.push(nearestPoint);
      visited[nearestPoint] = true;
      currentPoint = nearestPoint;
    }
  }

  return route;
};

// Hlavná funkcia pre optimalizáciu trasy
export const optimizeDeliveryRoute: RequestHandler = async (req, res) => {
  try {
    const { orders, driverLocation } = req.body;

    // Konverzia objednávok na delivery points
    const deliveryPoints: DeliveryPoint[] = orders.map((order: any) => ({
      orderId: order.id,
      address: order.address,
      coordinates: order.coordinates,
      customerName: order.customerName,
      deliveryTime: order.deliveryTime,
      priority: getDeliveryPriority(order.deliveryTime),
    }));

    // Geocoding pre adresy bez súradníc
    for (const point of deliveryPoints) {
      if (!point.coordinates) {
        const coords = await geocodeAddress(point.address);
        if (coords) {
          point.coordinates = coords;
        }
      }
    }

    // Filtrovanie bodov so súradnicami
    const validPoints = deliveryPoints.filter((point) => point.coordinates);

    if (validPoints.length === 0) {
      return res.json({
        success: false,
        error: "No valid coordinates found for addresses",
      });
    }

    // Pridanie východiskového bodu (centrum distribúcie)
    const startPoint: Coordinates = driverLocation || {
      lat: 50.0755, // Praha centrum
      lng: 14.4378,
    };

    const allPoints = [startPoint, ...validPoints.map((p) => p.coordinates!)];

    // Získanie distance matrix
    const distanceMatrix = await getDistanceMatrix(allPoints, allPoints);

    if (distanceMatrix.length === 0) {
      return res.json({
        success: false,
        error: "Failed to calculate distances",
      });
    }

    // Optimalizácia trasy
    const optimizedIndices = optimizeRouteNearestNeighbor(distanceMatrix, 0);

    // Konverzia výsledku
    const optimizedRoute = optimizedIndices.slice(1).map((index) => {
      const pointIndex = index - 1;
      const point = validPoints[pointIndex];
      return {
        orderId: point.orderId,
        address: point.address,
        customerName: point.customerName,
        coordinates: point.coordinates!,
        deliveryTime: point.deliveryTime,
        estimatedArrival: calculateEstimatedArrival(
          optimizedIndices.indexOf(index),
          distanceMatrix,
          optimizedIndices,
        ),
      };
    });

    // Kalkulácia celkového času a vzdialenosti
    const totalDuration = calculateTotalDuration(
      distanceMatrix,
      optimizedIndices,
    );
    const totalDistance = calculateTotalDistance(
      distanceMatrix,
      optimizedIndices,
    );

    res.json({
      success: true,
      optimizedRoute,
      totalDuration: Math.round(totalDuration / 60), // minúty
      totalDistance: Math.round(totalDistance / 1000), // kilometre
      startLocation: startPoint,
    });
  } catch (error) {
    console.error("Route optimization error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to optimize route",
    });
  }
};

// Geocoding endpoint pre jednotlivé adresy
export const geocodeAddresses: RequestHandler = async (req, res) => {
  try {
    const { addresses } = req.body;

    const geocodedAddresses = await Promise.all(
      addresses.map(async (address: string) => {
        const coordinates = await geocodeAddress(address);
        return {
          address,
          coordinates,
        };
      }),
    );

    res.json({
      success: true,
      geocodedAddresses,
    });
  } catch (error) {
    console.error("Geocoding error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to geocode addresses",
    });
  }
};

// Helper funkcie
const getDeliveryPriority = (deliveryTime: string): number => {
  // Skoršie časy majú vyššiu prioritu
  const hour = parseInt(deliveryTime.split(":")[0]);
  return hour < 12 ? 1 : 2;
};

const calculateEstimatedArrival = (
  routeIndex: number,
  distanceMatrix: number[][],
  route: number[],
): string => {
  const startTime = new Date();
  startTime.setHours(8, 0, 0, 0); // Začiatok o 8:00

  let totalTime = 0;
  for (let i = 0; i < routeIndex; i++) {
    totalTime += distanceMatrix[route[i]][route[i + 1]];
    totalTime += 5 * 60; // 5 minút na vykladanie
  }

  const arrivalTime = new Date(startTime.getTime() + totalTime * 1000);
  return arrivalTime.toLocaleTimeString("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const calculateTotalDuration = (
  distanceMatrix: number[][],
  route: number[],
): number => {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += distanceMatrix[route[i]][route[i + 1]];
  }
  return total;
};

const calculateTotalDistance = (
  distanceMatrix: number[][],
  route: number[],
): number => {
  // Toto je aproximácia - pre presné vzdialenosti by sme potrebovali ďalší API call
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += distanceMatrix[route[i]][route[i + 1]] * 0.5; // aproximácia km
  }
  return total;
};
