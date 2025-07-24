// Test WooCommerce API connection
const WC_CONFIG = {
  url: "https://zpoledomu.cz",
  consumerKey: "ck_c04c9c7347b4b078549e6548be52bfa74c41b14b",
  consumerSecret: "cs_484c4c50900196991189d6f57b0b9874aacfa61d",
  version: "wc/v3",
};

// Base64 encode credentials for API authentication
const auth = Buffer.from(
  `${WC_CONFIG.consumerKey}:${WC_CONFIG.consumerSecret}`,
).toString("base64");

async function testWooCommerceConnection() {
  try {
    console.log("🔗 Testing WooCommerce connection...");
    console.log("URL:", WC_CONFIG.url);

    const url = `${WC_CONFIG.url}/wp-json/${WC_CONFIG.version}/orders?per_page=1`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error response:", errorText);
      return false;
    }

    const data = await response.json();
    console.log("✅ Connection successful!");
    console.log("Sample order count:", data.length);

    if (data.length > 0) {
      console.log("First order ID:", data[0].id);
      console.log("First order status:", data[0].status);
      console.log(
        "Customer:",
        data[0].billing.first_name,
        data[0].billing.last_name,
      );
    }

    return true;
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    return false;
  }
}

// Test the connection
testWooCommerceConnection();
