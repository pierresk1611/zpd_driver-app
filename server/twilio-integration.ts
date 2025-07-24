import fetch from "node-fetch";

// Twilio API credentials from environment variables
const TWILIO_ACCOUNT_SID =
  process.env.TWILIO_ACCOUNT_SID || "AC755d4796b61d253eebeee07ca5a20807";
const TWILIO_AUTH_TOKEN =
  process.env.TWILIO_AUTH_TOKEN || "e489cbfba8058e6f199e13ae08871d7e";
const TWILIO_PHONE_NUMBER = process.env.TWILIO_FROM_NUMBER || "+420123456789";

interface SMSMessage {
  to: string;
  body: string;
  from?: string;
}

interface SMSResponse {
  success: boolean;
  messageSid?: string;
  error?: string;
  status?: string;
}

/**
 * Send SMS using Twilio API
 */
export async function sendSMS(message: SMSMessage): Promise<SMSResponse> {
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const params = new URLSearchParams();
    params.append("To", message.to);
    params.append("From", message.from || TWILIO_PHONE_NUMBER);
    params.append("Body", message.body);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || `HTTP error! status: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageSid: data.sid,
      status: data.status,
    };
  } catch (error) {
    console.error("Twilio SMS Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Send delivery notification SMS to customer
 */
export async function sendDeliveryNotification(
  customerPhone: string,
  driverName: string,
  estimatedTime: string,
  orderNumber: string,
): Promise<SMSResponse> {
  const message = `Dobrý den! Váš řidič ${driverName} je na cestě s objednávkou #${orderNumber}. Předpokládané doručení: ${estimatedTime}. Děkujeme za nákup u Zpoledomu! 🥕`;

  return sendSMS({
    to: customerPhone,
    body: message,
  });
}

/**
 * Send arrival notification SMS to customer
 */
export async function sendArrivalNotification(
  customerPhone: string,
  driverName: string,
  orderNumber: string,
): Promise<SMSResponse> {
  const message = `Váš řidič ${driverName} právě dorazil s objednávkou #${orderNumber}. Prosím, připravte se na převzetí zásilky. Zpoledomu 🚚`;

  return sendSMS({
    to: customerPhone,
    body: message,
  });
}

/**
 * Send delivery completion SMS to customer
 */
export async function sendDeliveryCompletionNotification(
  customerPhone: string,
  orderNumber: string,
  deliveryTime: string,
): Promise<SMSResponse> {
  const message = `Vaše objednávka #${orderNumber} byla úspěšně doručena v ${deliveryTime}. Děkujeme za důvěru a těšíme se na další nákup! Zpoledomu 🌱`;

  return sendSMS({
    to: customerPhone,
    body: message,
  });
}

/**
 * Send custom SMS message
 */
export async function sendCustomMessage(
  customerPhone: string,
  message: string,
): Promise<SMSResponse> {
  return sendSMS({
    to: customerPhone,
    body: `${message} - Zpoledomu`,
  });
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  // Czech phone number validation (both mobile and landline)
  const czechPhoneRegex = /^(\+420)?[0-9]{9}$/;
  return czechPhoneRegex.test(phone.replace(/\s/g, ""));
}

/**
 * Format phone number to international format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters except +
  const cleaned = phone.replace(/[^\d+]/g, "");

  // If starts with +420, return as is
  if (cleaned.startsWith("+420")) {
    return cleaned;
  }

  // If starts with 420, add +
  if (cleaned.startsWith("420")) {
    return `+${cleaned}`;
  }

  // If 9 digits, assume Czech number
  if (cleaned.length === 9) {
    return `+420${cleaned}`;
  }

  return cleaned;
}

/**
 * Get SMS delivery status
 */
export async function getSMSStatus(messageSid: string): Promise<any> {
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages/${messageSid}.json`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting SMS status:", error);
    throw error;
  }
}
