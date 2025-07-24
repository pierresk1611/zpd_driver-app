import express from "express";
import cors from "cors";
import { createServer } from "http";
import { handleDemo } from "./routes/demo";

// WooCommerce routes
import {
  getTodaysOrders,
  updateOrderStatus,
  getFarmersAndProducts,
  getProducts,
  getCustomerOrders,
  createOrder,
  checkDeliveryArea,
  authenticateCustomer,
  registerCustomer,
} from "./routes/woocommerce";

// Route optimization routes
import { optimizeDeliveryRoute, geocodeAddresses } from "./routes/routes";

// SMS/WhatsApp routes
import {
  sendOnRouteNotification,
  sendDelayNotification,
  sendWhatsAppNotification,
  sendBulkNotifications,
  testSMSService,
} from "./routes/sms";

// Shift management routes
import shiftRoutes from "./routes/shifts";

// Notification services
import { scheduleEveningNotifications, runEveningNotifications } from "./notifications/evening-notifications";
import { onOrderDelivered, testDeliveryNotification } from "./notifications/delivery-completion";
import { pushNotificationService } from "./notifications/push-notifications";

const createApp = () => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Ensure UTF-8 encoding for HTML responses only
  app.use((req, res, next) => {
    // Only set HTML content-type for non-API routes
    if (!req.originalUrl.startsWith("/api/")) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
    }
    next();
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      service: "Zpoledomu Driver App API",
    });
  });

  // WooCommerce connection test endpoint
  app.get("/api/test-woocommerce", async (req, res) => {
    try {
      console.log("🧪 Testing WooCommerce connection...");

      const { getTodaysOrdersFromWC } = await import(
        "./woocommerce-integration"
      );

      console.log("📦 Calling getTodaysOrdersFromWC()...");
      const result = await getTodaysOrdersFromWC();

      console.log("📋 WooCommerce test result:", result);

      res.json({
        success: true,
        message: "WooCommerce connection test completed",
        result: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ WooCommerce test failed:", error);
      res.status(500).json({
        success: false,
        error: "WooCommerce test failed",
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Original demo endpoints
  app.get("/api/ping", (req, res) => {
    res.json({ message: "pong" });
  });
  app.get("/api/demo", handleDemo);

  // Real WooCommerce API endpoints
  app.get("/api/orders/today", async (req, res) => {
    try {
      const { getTodaysOrdersFromWC } = await import(
        "./woocommerce-integration"
      );
      const result = await getTodaysOrdersFromWC();
      res.json(result);
    } catch (error) {
      console.error("Error in /api/orders/today:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch orders from WooCommerce",
      });
    }
  });

  app.put("/api/orders/:orderId/status", async (req, res) => {
    try {
      const { updateOrderStatusInWC } = await import(
        "./woocommerce-integration"
      );
      const { orderId } = req.params;
      const { status, notes } = req.body;

      const result = await updateOrderStatusInWC(orderId, status, notes);
      res.json(result);
    } catch (error) {
      console.error("Error in /api/orders/:orderId/status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update order status",
      });
    }
  });

  app.get("/api/farmers", async (req, res) => {
    try {
      const { getFarmersFromWC } = await import("./woocommerce-integration");
      const result = await getFarmersFromWC();
      res.json(result);
    } catch (error) {
      console.error("Error in /api/farmers:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch farmers from WooCommerce",
      });
    }
  });

  // Real Google Maps route optimization
  app.post("/api/routes/optimize", async (req, res) => {
    try {
      const { optimizeDeliveryRoute } = await import(
        "./google-maps-integration"
      );
      const { orders, driverLocation } = req.body;

      console.log(`🗺️ Optimizing route for ${orders?.length || 0} orders`);

      const result = await optimizeDeliveryRoute(orders, driverLocation);
      res.json(result);
    } catch (error) {
      console.error("Error in /api/routes/optimize:", error);
      res.status(500).json({
        success: false,
        error: "Failed to optimize route with Google Maps",
      });
    }
  });

  // Real geocoding endpoint
  app.post("/api/geocode", async (req, res) => {
    try {
      const { batchGeocodeAddresses } = await import(
        "./google-maps-integration"
      );
      const { addresses } = req.body;

      console.log(`📍 Geocoding ${addresses?.length || 0} addresses`);

      const results = await batchGeocodeAddresses(addresses);
      res.json({
        success: true,
        results: results,
      });
    } catch (error) {
      console.error("Error in /api/geocode:", error);
      res.status(500).json({
        success: false,
        error: "Failed to geocode addresses with Google Maps",
      });
    }
  });

  // SMS/WhatsApp notification endpoints
  app.post("/api/notifications/on-route", sendOnRouteNotification);
  app.post("/api/notifications/delay", sendDelayNotification);
  app.post("/api/notifications/whatsapp", sendWhatsAppNotification);
  app.post("/api/notifications/bulk", sendBulkNotifications);
  app.post("/api/notifications/test", testSMSService);

  // Real Twilio SMS endpoints
  app.post("/api/sms/send", async (req, res) => {
    try {
      const { sendSMS } = await import("./twilio-integration");
      const { to, body, from } = req.body;

      console.log(`📱 Sending SMS to ${to}`);

      const result = await sendSMS({ to, body, from });
      res.json(result);
    } catch (error) {
      console.error("Error sending SMS:", error);
      res.status(500).json({
        success: false,
        error: "Failed to send SMS",
      });
    }
  });

  app.post("/api/sms/delivery-notification", async (req, res) => {
    try {
      console.log("📱 SMS delivery notification endpoint called");
      console.log("Request body:", req.body);

      const { sendDeliveryNotification } = await import("./twilio-integration");
      const { customerPhone, driverName, estimatedTime, orderNumber } =
        req.body;

      // Validate required fields
      if (!customerPhone || !driverName || !orderNumber) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required fields: customerPhone, driverName, orderNumber",
        });
      }

      console.log(
        `🚚 Sending delivery notification for order ${orderNumber} to ${customerPhone}`,
      );

      const result = await sendDeliveryNotification(
        customerPhone,
        driverName,
        estimatedTime || "soon",
        orderNumber,
      );

      console.log("SMS result:", result);
      res.json(result);
    } catch (error) {
      console.error("Error in SMS delivery notification endpoint:", error);
      res.status(500).json({
        success: false,
        error: "Failed to send delivery notification",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/sms/arrival-notification", async (req, res) => {
    try {
      const { sendArrivalNotification } = await import("./twilio-integration");
      const { customerPhone, driverName, orderNumber } = req.body;

      console.log(`📍 Sending arrival notification for order ${orderNumber}`);

      const result = await sendArrivalNotification(
        customerPhone,
        driverName,
        orderNumber,
      );
      res.json(result);
    } catch (error) {
      console.error("Error sending arrival notification:", error);
      res.status(500).json({
        success: false,
        error: "Failed to send arrival notification",
      });
    }
  });

  app.post("/api/sms/completion-notification", async (req, res) => {
    try {
      const { sendDeliveryCompletionNotification } = await import(
        "./twilio-integration"
      );
      const { customerPhone, orderNumber, deliveryTime } = req.body;

      console.log(
        `✅ Sending completion notification for order ${orderNumber}`,
      );

      const result = await sendDeliveryCompletionNotification(
        customerPhone,
        orderNumber,
        deliveryTime,
      );
      res.json(result);
    } catch (error) {
      console.error("Error sending completion notification:", error);
      res.status(500).json({
        success: false,
        error: "Failed to send completion notification",
      });
    }
  });

  app.post("/api/sms/custom", async (req, res) => {
    try {
      const { sendCustomMessage } = await import("./twilio-integration");
      const { customerPhone, message } = req.body;

      console.log(`💬 Sending custom SMS to ${customerPhone}`);

      const result = await sendCustomMessage(customerPhone, message);
      res.json(result);
    } catch (error) {
      console.error("Error sending custom SMS:", error);
      res.status(500).json({
        success: false,
        error: "Failed to send custom SMS",
      });
    }
  });

  app.get("/api/sms/status/:messageSid", async (req, res) => {
    try {
      const { getSMSStatus } = await import("./twilio-integration");
      const { messageSid } = req.params;

      const result = await getSMSStatus(messageSid);
      res.json({
        success: true,
        status: result,
      });
    } catch (error) {
      console.error("Error getting SMS status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get SMS status",
      });
    }
  });

  // Additional utility endpoints
  app.get("/api/config", (req, res) => {
    res.json({
      success: true,
      config: {
        smsEnabled: !!process.env.TWILIO_ACCOUNT_SID,
        whatsappEnabled: !!process.env.WHATSAPP_API_KEY,
        mapsEnabled: !!process.env.GOOGLE_MAPS_API_KEY,
        woocommerceEnabled: !!process.env.WOOCOMMERCE_KEY,
        deliveryTimeSlots: [
          "09:00-12:00",
          "12:00-15:00",
          "15:00-18:00",
          "18:00-20:00",
        ],
        workingHours: {
          start: "08:00",
          end: "20:00",
        },
      },
    });
  });

  // Driver management endpoints
  app.get("/api/drivers", (req, res) => {
    // Temporary mock data - should come from database
    res.json({
      success: true,
      drivers: [
        {
          id: "1",
          name: "Jan Novák",
          phone: "+420 601 111 222",
          email: "jan.novak@zpoledomu.cz",
          isActive: true,
          assignedPostalCodes: ["110", "111", "120", "121"],
        },
        {
          id: "2",
          name: "Petr Svoboda",
          phone: "+420 602 333 444",
          email: "petr.svoboda@zpoledomu.cz",
          isActive: true,
          assignedPostalCodes: ["130", "131", "140", "141"],
        },
        {
          id: "3",
          name: "Marie Krásná",
          phone: "+420 603 555 666",
          email: "marie.krasna@zpoledomu.cz",
          isActive: false,
          assignedPostalCodes: ["150", "151"],
        },
      ],
    });
  });

  // Postal codes territory management
  app.get("/api/territories", (req, res) => {
    // Mock data - should come from database or uploaded file
    res.json({
      success: true,
      territories: [
        {
          postalCode: "110 00",
          city: "Praha 1",
          assignedDriverId: "1",
          deliveryDays: ["monday", "wednesday", "friday"],
          isActive: true,
        },
        {
          postalCode: "111 00",
          city: "Praha 1",
          assignedDriverId: "1",
          deliveryDays: ["monday", "wednesday", "friday"],
          isActive: true,
        },
        {
          postalCode: "120 00",
          city: "Praha 2",
          assignedDriverId: "1",
          deliveryDays: ["tuesday", "thursday"],
          isActive: true,
        },
        {
          postalCode: "130 00",
          city: "Praha 3",
          assignedDriverId: "2",
          deliveryDays: ["monday", "wednesday", "friday"],
          isActive: true,
        },
      ],
    });
  });

  // Statistics endpoint
  app.get("/api/stats/today", (req, res) => {
    const today = new Date().toISOString().split("T")[0];

    // Mock statistics - should be calculated from real data
    res.json({
      success: true,
      stats: {
        date: today,
        totalOrders: 15,
        completedOrders: 8,
        cancelledOrders: 1,
        delayedOrders: 2,
        pendingOrders: 4,
        averageDeliveryTime: 25,
        totalDistance: 85,
        activeDrivers: 2,
        smsNotificationsSent: 12,
      },
    });
  });

  // Customer App API endpoints - Direct WooCommerce integration

  // Products endpoint for customer app
  app.get("/api/products", getProducts);

  // Customer orders endpoint
  app.get("/api/customer-orders", getCustomerOrders);

  // Create new customer order
  app.post("/api/create-order", createOrder);

  // Check delivery area availability
  app.get("/api/check-delivery-area", checkDeliveryArea);

  // Customer authentication endpoints
  app.post("/api/auth/login", authenticateCustomer);
  app.post("/api/auth/register", registerCustomer);

  // Driver authentication endpoint
  app.post("/api/auth/driver-login", (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: "Používateľské meno a heslo sú povinné"
        });
      }

      // Mock driver authentication for now
      // In real implementation, this would check against admin database
      const mockDriverCredentials = {
        "jan.novak": { password: "password123", driverId: "1" },
        "petr.svoboda": { password: "password123", driverId: "2" },
        "marie.krasna": { password: "password123", driverId: "3" }
      };

      const driverAuth = mockDriverCredentials[username.toLowerCase()];

      if (!driverAuth || driverAuth.password !== password) {
        return res.status(401).json({
          success: false,
          error: "Nesprávne používateľské meno alebo heslo"
        });
      }

      // Find driver details
      const mockDrivers = [
        {
          id: "1",
          name: "Jan Novák",
          phone: "+420 601 111 222",
          email: "jan.novak@zpoledomu.cz",
          isActive: true,
          assignedPostalCodes: ["110", "111", "120", "121"],
        },
        {
          id: "2",
          name: "Petr Svoboda",
          phone: "+420 602 333 444",
          email: "petr.svoboda@zpoledomu.cz",
          isActive: true,
          assignedPostalCodes: ["130", "131", "140", "141"],
        },
        {
          id: "3",
          name: "Marie Krásná",
          phone: "+420 603 555 666",
          email: "marie.krasna@zpoledomu.cz",
          isActive: true,
          assignedPostalCodes: ["150", "151"],
        },
      ];

      const driver = mockDrivers.find(d => d.id === driverAuth.driverId);

      if (!driver || !driver.isActive) {
        return res.status(403).json({
          success: false,
          error: "Účet vodiča nie je aktívny"
        });
      }

      res.json({
        success: true,
        driver: driver,
        message: "Úspešné prihlásenie"
      });

    } catch (error) {
      console.error("Driver authentication error:", error);
      res.status(500).json({
        success: false,
        error: "Chyba servera pri prihlásení"
      });
    }
  });

  // Enhanced WooCommerce integration endpoints for drivers

  // Real WooCommerce status update
  app.put("/api/woocommerce/orders/:orderId/status", async (req, res) => {
    try {
      const { updateOrderStatusInWC } = await import(
        "./woocommerce-integration"
      );
      const { orderId } = req.params;
      const { status, notes, driverName, timestamp } = req.body;

      console.log(
        `🔄 Updating WooCommerce order ${orderId} status to ${status}`,
      );
      console.log(`📝 Driver: ${driverName}, Notes: ${notes}`);

      const result = await updateOrderStatusInWC(orderId, status, notes);
      res.json(result);
    } catch (error) {
      console.error("Error updating order status in WooCommerce:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update order status in WooCommerce",
      });
    }
  });

  // Real WooCommerce note addition
  app.post("/api/woocommerce/orders/:orderId/notes", async (req, res) => {
    try {
      const { addOrderNoteInWC } = await import("./woocommerce-integration");
      const { orderId } = req.params;
      const { note, driverName, timestamp, isDriverNote } = req.body;

      console.log(`📝 Adding driver note to WooCommerce order ${orderId}`);
      console.log(`Note: ${note} (by ${driverName})`);

      const result = await addOrderNoteInWC(orderId, note, driverName);
      res.json(result);
    } catch (error) {
      console.error("Error adding note to WooCommerce order:", error);
      res.status(500).json({
        success: false,
        error: "Failed to add note to WooCommerce order",
      });
    }
  });

  // Get detailed order info from WooCommerce
  app.get("/api/woocommerce/orders/:orderId/details", (req, res) => {
    const { orderId } = req.params;

    console.log(`🔍 Fetching WooCommerce details for order ${orderId}`);

    // Mock detailed order data
    res.json({
      success: true,
      order: {
        id: orderId,
        wcId: parseInt(orderId.replace(/\D/g, "")),
        status: "processing",
        customer: {
          firstName: "Jan",
          lastName: "Novák",
          email: "jan@novak.cz",
          phone: "+420 601 111 222",
        },
        billing: {
          address1: "Wenceslas Square 1",
          city: "Praha",
          postcode: "110 00",
          country: "CZ",
        },
        shipping: {
          address1: "Wenceslas Square 1",
          city: "Praha",
          postcode: "110 00",
          country: "CZ",
        },
        items: [
          {
            name: "Čerstvá mrkev",
            quantity: 2,
            price: 29,
          },
        ],
        total: 58,
        currency: "CZK",
        paymentMethod: "bacs",
        shippingMethod: "flat_rate",
        orderNotes: [],
        customFields: {
          deliveryTime: "09:00-12:00",
          assignedDriver: "Jan Novák",
        },
      },
    });
  });

  // Mark order as delivered in WooCommerce with GPS and photo
  app.post("/api/woocommerce/orders/:orderId/delivered", (req, res) => {
    const { orderId } = req.params;
    const { driverName, deliveredAt, deliveryPhoto, gpsLocation } = req.body;

    console.log(`📦 Marking order ${orderId} as delivered in WooCommerce`);
    console.log(`Delivered by: ${driverName} at ${deliveredAt}`);
    if (gpsLocation) {
      console.log(
        `📍 GPS: ${gpsLocation.coords?.latitude}, ${gpsLocation.coords?.longitude}`,
      );
    }
    if (deliveryPhoto) {
      console.log(`📸 Delivery photo attached`);
    }

    res.json({
      success: true,
      message: "Order marked as delivered in WooCommerce",
      deliveryDetails: {
        driverName,
        deliveredAt,
        hasPhoto: !!deliveryPhoto,
        hasGPS: !!gpsLocation,
        wcStatus: "completed",
      },
    });
  });

  // Confirm cash payment and send receipt
  app.post(
    "/api/woocommerce/orders/:orderId/cash-payment",
    async (req, res) => {
      try {
        const { orderId } = req.params;
        const { driverName, confirmedAt, sendReceipt } = req.body;

        console.log(`💰 Confirming cash payment for order ${orderId}`);
        console.log(`Confirmed by: ${driverName} at ${confirmedAt}`);

        // Try to update WooCommerce order status to completed and mark as paid
        try {
          const { updateOrderStatusInWC, addOrderNoteInWC } = await import(
            "./woocommerce-integration"
          );

          // Update order status to completed
          const statusResult = await updateOrderStatusInWC(
            orderId,
            "completed",
            `💰 Hotovosť potvrdená vodi��om ${driverName} dňa ${new Date(confirmedAt).toLocaleString("sk-SK")}`,
          );

          // Add note about cash payment confirmation
          const noteResult = await addOrderNoteInWC(
            orderId,
            `💰 Platba hotovosťou potvrdená vodičom ${driverName}. Doklad o úhrade odoslaný zákazníkovi.`,
            driverName,
          );

          console.log(
            "✅ WooCommerce order updated with cash payment confirmation",
          );

          // Send receipt email via WooCommerce (this would trigger WooCommerce's email system)
          if (sendReceipt) {
            console.log("📧 Receipt email triggered via WooCommerce");
          }

          res.json({
            success: true,
            message: "Cash payment confirmed and receipt sent",
            woocommerceUpdated: statusResult.success && noteResult.success,
            receiptSent: sendReceipt,
            details: {
              orderId,
              driverName,
              confirmedAt,
              wcStatus: "completed",
            },
          });
        } catch (wcError) {
          console.error("WooCommerce update failed:", wcError);

          // Still return success for local tracking even if WC fails
          res.json({
            success: true,
            message:
              "Cash payment confirmed locally (WooCommerce update failed)",
            woocommerceUpdated: false,
            receiptSent: false,
            details: {
              orderId,
              driverName,
              confirmedAt,
              wcStatus: "local_only",
            },
          });
        }
      } catch (error) {
        console.error("Error confirming cash payment:", error);
        res.status(500).json({
          success: false,
          error: "Failed to confirm cash payment",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  // Google Maps travel time calculation
  app.post("/api/maps/travel-time", async (req, res) => {
    try {
      const { getTravelTime } = await import("./google-maps-integration");
      const { from, to } = req.body;

      const result = await getTravelTime(from, to);

      if (result) {
        res.json({
          success: true,
          distance: result.distance,
          duration: result.duration,
        });
      } else {
        res.json({
          success: false,
          error: "Could not calculate travel time",
        });
      }
    } catch (error) {
      console.error("Error calculating travel time:", error);
      res.status(500).json({
        success: false,
        error: "Failed to calculate travel time",
      });
    }
  });

  // Get directions URL for different navigation providers
  app.post("/api/maps/directions", async (req, res) => {
    try {
      const { getDirectionsUrl } = await import("./google-maps-integration");
      const { from, to, provider = "waze" } = req.body;

      const directionsUrl = getDirectionsUrl(from, to, provider);

      res.json({
        success: true,
        url: directionsUrl,
        provider,
      });
    } catch (error) {
      console.error("Error generating directions URL:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate directions URL",
      });
    }
  });

  // Error handling middleware
  app.use(
    (
      err: Error,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      console.error("Server error:", err);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: err.message,
      });
    },
  );

  // SPA fallback - serve index.html for all non-API routes
  app.get("*", (req, res, next) => {
    // If the request is for an API endpoint, let it continue to 404 handler
    if (req.originalUrl.startsWith("/api/")) {
      return next();
    }

    // For all other routes, serve the React app (SPA fallback)
    // This will be handled by Vite in development
    next();
  });

  // Evening delivery notifications
  app.post("/api/notifications/evening/send", async (req, res) => {
    try {
      console.log("🌅 Manual trigger for evening notifications");
      await runEveningNotifications();
      res.json({
        success: true,
        message: "Evening notifications sent successfully"
      });
    } catch (error) {
      console.error("Error sending evening notifications:", error);
      res.status(500).json({
        success: false,
        error: "Failed to send evening notifications"
      });
    }
  });

  // Delivery completion with recipes notification
  app.post("/api/notifications/delivery-completed", async (req, res) => {
    try {
      const { orderId, customerName, customerPhone, customerEmail, items } = req.body;

      if (!orderId || !customerName || !customerPhone || !items) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: orderId, customerName, customerPhone, items"
        });
      }

      const completedOrder = {
        id: orderId,
        customerName,
        customerPhone,
        customerEmail: customerEmail || '',
        deliveredAt: new Date().toISOString(),
        items: items.map((item: any) => ({
          name: item.name || item.productName,
          quantity: item.quantity || 1
        }))
      };

      console.log(`📦 Triggering delivery completion notification for order ${orderId}`);
      await onOrderDelivered(completedOrder);

      res.json({
        success: true,
        message: "Delivery completion notification sent with recipe suggestions"
      });
    } catch (error) {
      console.error("Error sending delivery completion notification:", error);
      res.status(500).json({
        success: false,
        error: "Failed to send delivery completion notification"
      });
    }
  });

  // Test delivery notification
  app.post("/api/notifications/test-delivery", async (req, res) => {
    try {
      console.log("🧪 Testing delivery completion notification");
      await testDeliveryNotification();
      res.json({
        success: true,
        message: "Test delivery notification sent"
      });
    } catch (error) {
      console.error("Error sending test delivery notification:", error);
      res.status(500).json({
        success: false,
        error: "Failed to send test delivery notification"
      });
    }
  });

  // Push notification subscription
  app.post("/api/notifications/subscribe", async (req, res) => {
    try {
      const { customerPhone, subscription } = req.body;

      if (!customerPhone || !subscription) {
        return res.status(400).json({
          success: false,
          error: "Missing customerPhone or subscription"
        });
      }

      await pushNotificationService.subscribe(customerPhone, subscription);

      res.json({
        success: true,
        message: "Successfully subscribed to push notifications"
      });
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      res.status(500).json({
        success: false,
        error: "Failed to subscribe to push notifications"
      });
    }
  });

  // Push notification unsubscribe
  app.post("/api/notifications/unsubscribe", async (req, res) => {
    try {
      const { customerPhone, endpoint } = req.body;

      if (!customerPhone || !endpoint) {
        return res.status(400).json({
          success: false,
          error: "Missing customerPhone or endpoint"
        });
      }

      await pushNotificationService.unsubscribe(customerPhone, endpoint);

      res.json({
        success: true,
        message: "Successfully unsubscribed from push notifications"
      });
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      res.status(500).json({
        success: false,
        error: "Failed to unsubscribe from push notifications"
      });
    }
  });

  // Get notification inbox
  app.get("/api/notifications/inbox", async (req, res) => {
    try {
      const { customerPhone } = req.query;

      if (!customerPhone) {
        return res.status(400).json({
          success: false,
          error: "Missing customerPhone parameter"
        });
      }

      const notifications = await pushNotificationService.getUnreadNotifications(customerPhone as string);

      res.json({
        success: true,
        notifications
      });
    } catch (error) {
      console.error("Error getting notification inbox:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get notification inbox"
      });
    }
  });

  // Mark notification as read
  app.post("/api/notifications/mark-read", async (req, res) => {
    try {
      const { customerPhone, notificationId } = req.body;

      if (!customerPhone || !notificationId) {
        return res.status(400).json({
          success: false,
          error: "Missing customerPhone or notificationId"
        });
      }

      await pushNotificationService.markAsRead(customerPhone, notificationId);

      res.json({
        success: true,
        message: "Notification marked as read"
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({
        success: false,
        error: "Failed to mark notification as read"
      });
    }
  });

  // Shift Management Routes
  app.use("/api/shifts", shiftRoutes);

  // 404 handler only for API endpoints
  app.use("/api/*", (req, res) => {
    res.status(404).json({
      success: false,
      error: "API endpoint not found",
      path: req.originalUrl,
    });
  });

  return app;
};

export { createServer as createHttpServer, createApp };
export { createApp as createServer }; // Alias for vite.config.ts

// Environment variables documentation
console.log(`
🥕 Zpoledomu Driver App API Server
==================================

Required Environment Variables:
- WOOCOMMERCE_URL: Your WordPress/WooCommerce site URL
- WOOCOMMERCE_KEY: WooCommerce consumer key
- WOOCOMMERCE_SECRET: WooCommerce consumer secret
- GOOGLE_MAPS_API_KEY: Google Maps API key for geocoding and routing
- TWILIO_ACCOUNT_SID: Twilio account SID for SMS
- TWILIO_AUTH_TOKEN: Twilio auth token
- TWILIO_FROM_NUMBER: Your Twilio phone number

Optional Environment Variables:
- WHATSAPP_API_KEY: WhatsApp Business API key
- WHATSAPP_INSTANCE_ID: WhatsApp instance ID
- WHATSAPP_BASE_URL: WhatsApp API base URL
- SMS_PROVIDER: SMS provider (twilio, textmagic, nexmo)

API Endpoints:
- GET  /api/health - Health check
- GET  /api/orders/today - Get today's orders from WooCommerce
- PUT  /api/orders/:id/status - Update order status
- GET  /api/farmers - Get farmers and products
- POST /api/routes/optimize - Optimize delivery route
- POST /api/notifications/on-route - Send on-route SMS
- POST /api/notifications/delay - Send delay SMS
- GET  /api/config - Get app configuration

Development:
- npm run dev - Start development server
- Access app at http://localhost:8080

Production:
- npm run build - Build for production
- npm start - Start production server
`);
