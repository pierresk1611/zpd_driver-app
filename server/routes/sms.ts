import { RequestHandler } from "express";

// SMS API konfigurácia (používame Twilio ako príklad)
const SMS_CONFIG = {
  accountSid: process.env.TWILIO_ACCOUNT_SID || "",
  authToken: process.env.TWILIO_AUTH_TOKEN || "",
  fromNumber: process.env.TWILIO_FROM_NUMBER || "+420123456789",
  provider: process.env.SMS_PROVIDER || "twilio", // twilio, textmagic, nexmo
};

// WhatsApp konfigurácia
const WHATSAPP_CONFIG = {
  apiKey: process.env.WHATSAPP_API_KEY || "",
  instanceId: process.env.WHATSAPP_INSTANCE_ID || "",
  baseUrl: process.env.WHATSAPP_BASE_URL || "",
};

interface SMSMessage {
  to: string;
  message: string;
  type: "sms" | "whatsapp";
}

// Hlavná funkcia pre posielanie správ
const sendMessage = async (
  to: string,
  message: string,
  type: "sms" | "whatsapp" = "sms",
): Promise<boolean> => {
  try {
    if (type === "whatsapp") {
      return await sendWhatsAppMessage(to, message);
    } else {
      return await sendSMSMessage(to, message);
    }
  } catch (error) {
    console.error("Message sending error:", error);
    return false;
  }
};

// SMS cez Twilio
const sendSMSMessage = async (
  to: string,
  message: string,
): Promise<boolean> => {
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${SMS_CONFIG.accountSid}/Messages.json`;

    const auth = Buffer.from(
      `${SMS_CONFIG.accountSid}:${SMS_CONFIG.authToken}`,
    ).toString("base64");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: SMS_CONFIG.fromNumber,
        To: to,
        Body: message,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("SMS sending error:", error);
    return false;
  }
};

// WhatsApp správy
const sendWhatsAppMessage = async (
  to: string,
  message: string,
): Promise<boolean> => {
  try {
    const url = `${WHATSAPP_CONFIG.baseUrl}/sendMessage`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        chatId: `${to}@c.us`,
        message: message,
        session: WHATSAPP_CONFIG.instanceId,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("WhatsApp sending error:", error);
    return false;
  }
};

// Endpoint pre posielanie SMS o vyrazení na cestu
export const sendOnRouteNotification: RequestHandler = async (req, res) => {
  try {
    const { customerName, phone, deliveryTime, estimatedArrival } = req.body;

    const message = `Dobrý den ${customerName}, vaše objednávka od zpoledomu.cz je na cestě. Doručení je plánováno na ${deliveryTime}${estimatedArrival ? ` (očekávaný příchod ${estimatedArrival})` : ""}. Děkujeme!`;

    const success = await sendMessage(phone, message, "sms");

    res.json({
      success,
      message: success
        ? "Notification sent successfully"
        : "Failed to send notification",
    });
  } catch (error) {
    console.error("On-route notification error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send on-route notification",
    });
  }
};

// Endpoint pre posielanie SMS o zdržaní
export const sendDelayNotification: RequestHandler = async (req, res) => {
  try {
    const { customerName, phone, delayMinutes, newEstimatedTime } = req.body;

    const message = `Dobrý den ${customerName}, vaše objednávka zeleniny z Zpoledomu bude zdržena o ${delayMinutes} minut${newEstimatedTime ? `. Nový očekávaný čas doručení: ${newEstimatedTime}` : ""}. Děkujeme za pochopení!`;

    const success = await sendMessage(phone, message, "sms");

    res.json({
      success,
      message: success
        ? "Delay notification sent successfully"
        : "Failed to send delay notification",
    });
  } catch (error) {
    console.error("Delay notification error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send delay notification",
    });
  }
};

// Endpoint pre posielanie WhatsApp správ
export const sendWhatsAppNotification: RequestHandler = async (req, res) => {
  try {
    const { phone, message } = req.body;

    const success = await sendMessage(phone, message, "whatsapp");

    res.json({
      success,
      message: success
        ? "WhatsApp message sent successfully"
        : "Failed to send WhatsApp message",
    });
  } catch (error) {
    console.error("WhatsApp notification error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send WhatsApp message",
    });
  }
};

// Bulk posielanie správ
export const sendBulkNotifications: RequestHandler = async (req, res) => {
  try {
    const { messages } = req.body; // Array of SMSMessage objects

    const results = await Promise.all(
      messages.map(async (msg: SMSMessage) => {
        const success = await sendMessage(msg.to, msg.message, msg.type);
        return {
          to: msg.to,
          success,
        };
      }),
    );

    const successCount = results.filter((result) => result.success).length;

    res.json({
      success: true,
      sent: successCount,
      total: messages.length,
      results,
    });
  } catch (error) {
    console.error("Bulk notifications error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send bulk notifications",
    });
  }
};

// Endpoint pre testovanie SMS služby
export const testSMSService: RequestHandler = async (req, res) => {
  try {
    const { phone } = req.body;

    const testMessage =
      "Test správa z Zpoledomu aplikace pro řidiče. SMS služba funguje správně!";

    const success = await sendMessage(phone, testMessage, "sms");

    res.json({
      success,
      message: success
        ? "Test SMS sent successfully"
        : "Failed to send test SMS",
    });
  } catch (error) {
    console.error("SMS test error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to test SMS service",
    });
  }
};

// Helper funkcie pre formátovanie správ
export const formatDeliveryMessage = (
  customerName: string,
  deliveryTime: string,
  estimatedArrival?: string,
): string => {
  return `Dobrý den ${customerName}, vaše objednávka od zpoledomu.cz je na cestě. Doručení je plánováno na ${deliveryTime}${estimatedArrival ? ` (očekávaný příchod ${estimatedArrival})` : ""}. Děkujeme!`;
};

export const formatDelayMessage = (
  customerName: string,
  delayMinutes: number,
  newEstimatedTime?: string,
): string => {
  return `Dobrý den ${customerName}, vaše objednávka zeleniny z Zpoledomu bude zdržena o ${delayMinutes} minut${newEstimatedTime ? `. Nový očekávaný čas doručení: ${newEstimatedTime}` : ""}. Děkujeme za pochopení!`;
};

export const formatCancellationMessage = (
  customerName: string,
  reason: string,
  newDeliveryDate: string,
): string => {
  return `Dobrý den ${customerName}, bohužel musíme zrušit dnešní doručení vaší objednávky z důvodu: ${reason}. Nové doručení je naplánováno na ${newDeliveryDate}. Omlouváme se za komplikace!`;
};
