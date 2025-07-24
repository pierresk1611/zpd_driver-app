import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Database,
  MessageSquare,
  MapPin,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
  TestTube,
  Eye,
  EyeOff,
  AlertTriangle,
  Info,
  Carrot,
} from "lucide-react";

interface ConfigStatus {
  woocommerce: boolean;
  sms: boolean;
  whatsapp: boolean;
  maps: boolean;
}

interface AppConfig {
  woocommerce: {
    url: string;
    consumerKey: string;
    consumerSecret: string;
  };
  sms: {
    provider: string;
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
  maps: {
    apiKey: string;
  };
  whatsapp: {
    apiKey: string;
    instanceId: string;
    baseUrl: string;
  };
}

export default function Setup() {
  const [config, setConfig] = useState<AppConfig>({
    woocommerce: {
      url: "",
      consumerKey: "",
      consumerSecret: "",
    },
    sms: {
      provider: "twilio",
      accountSid: "",
      authToken: "",
      fromNumber: "",
    },
    maps: {
      apiKey: "",
    },
    whatsapp: {
      apiKey: "",
      instanceId: "",
      baseUrl: "",
    },
  });

  const [configStatus, setConfigStatus] = useState<ConfigStatus>({
    woocommerce: false,
    sms: false,
    whatsapp: false,
    maps: false,
  });

  const [showSecrets, setShowSecrets] = useState({
    consumerSecret: false,
    authToken: false,
    apiKey: false,
    whatsappKey: false,
  });

  const [testResults, setTestResults] = useState<{ [key: string]: any }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);

  // Load configuration on mount
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/config");
      const data = await response.json();

      if (data.success) {
        setConfigStatus({
          woocommerce: data.config.woocommerceEnabled,
          sms: data.config.smsEnabled,
          whatsapp: data.config.whatsappEnabled,
          maps: data.config.mapsEnabled,
        });
      }
    } catch (error) {
      console.error("Error loading configuration:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const testWooCommerceConnection = async () => {
    setIsTesting("woocommerce");
    try {
      const response = await fetch("/api/orders/today");
      const data = await response.json();

      setTestResults((prev) => ({
        ...prev,
        woocommerce: {
          success: data.success,
          message: data.success
            ? `Úspěšně načteno ${data.orders?.length || 0} objednávek`
            : data.error || "Chyba pripojenia",
        },
      }));
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        woocommerce: {
          success: false,
          message: "Chyba pripojenia k WooCommerce API",
        },
      }));
    } finally {
      setIsTesting(null);
    }
  };

  const testSMSService = async () => {
    setIsTesting("sms");
    try {
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: config.sms.fromNumber, // Test with from number
        }),
      });

      const data = await response.json();

      setTestResults((prev) => ({
        ...prev,
        sms: {
          success: data.success,
          message:
            data.message ||
            (data.success ? "SMS test úspešný" : "SMS test neúspešný"),
        },
      }));
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        sms: {
          success: false,
          message: "Chyba testovania SMS služby",
        },
      }));
    } finally {
      setIsTesting(null);
    }
  };

  const testRouteOptimization = async () => {
    setIsTesting("maps");
    try {
      const mockOrders = [
        {
          id: "test1",
          address: "Wenceslas Square 1, Praha",
          customerName: "Test User 1",
          deliveryTime: "09:00-12:00",
        },
        {
          id: "test2",
          address: "Charles Square, Praha",
          customerName: "Test User 2",
          deliveryTime: "12:00-15:00",
        },
      ];

      const response = await fetch("/api/routes/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orders: mockOrders,
          driverLocation: { lat: 50.0755, lng: 14.4378 },
        }),
      });

      const data = await response.json();

      setTestResults((prev) => ({
        ...prev,
        maps: {
          success: data.success,
          message: data.success
            ? `Optimalizácia úspešná: ${data.totalDistance}km, ${data.totalDuration}min`
            : data.error || "Chyba optimalizácie trasy",
        },
      }));
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        maps: {
          success: false,
          message: "Chyba testovania Maps API",
        },
      }));
    } finally {
      setIsTesting(null);
    }
  };

  const getStatusIcon = (isEnabled: boolean, testResult?: any) => {
    if (testResult) {
      return testResult.success ? (
        <CheckCircle className="h-5 w-5 text-success" />
      ) : (
        <XCircle className="h-5 w-5 text-destructive" />
      );
    }

    return isEnabled ? (
      <CheckCircle className="h-5 w-5 text-success" />
    ) : (
      <XCircle className="h-5 w-5 text-muted-foreground" />
    );
  };

  const getStatusText = (isEnabled: boolean, testResult?: any) => {
    if (testResult) {
      return testResult.success ? "Funkčné" : "Chyba";
    }

    return isEnabled ? "Nakonfigurované" : "Nie je nakonfigurované";
  };

  const toggleSecretVisibility = (field: keyof typeof showSecrets) => {
    setShowSecrets((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="bg-primary-foreground/20 p-2 rounded-lg">
              <Carrot className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Zpoledomu - Konfigurácia</h1>
              <p className="text-primary-foreground/80 text-sm">
                Nastavenie aplikace pro vodiče
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Prehľad konfigurácie
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* WooCommerce Status */}
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Database className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(
                      configStatus.woocommerce,
                      testResults.woocommerce,
                    )}
                    <span className="font-medium">WooCommerce</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getStatusText(
                      configStatus.woocommerce,
                      testResults.woocommerce,
                    )}
                  </p>
                  {testResults.woocommerce && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {testResults.woocommerce.message}
                    </p>
                  )}
                </div>
              </div>

              {/* SMS Status */}
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <MessageSquare className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(configStatus.sms, testResults.sms)}
                    <span className="font-medium">SMS</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getStatusText(configStatus.sms, testResults.sms)}
                  </p>
                  {testResults.sms && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {testResults.sms.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Maps Status */}
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <MapPin className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(configStatus.maps, testResults.maps)}
                    <span className="font-medium">Maps API</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getStatusText(configStatus.maps, testResults.maps)}
                  </p>
                  {testResults.maps && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {testResults.maps.message}
                    </p>
                  )}
                </div>
              </div>

              {/* WhatsApp Status */}
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <MessageSquare className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(configStatus.whatsapp, testResults.whatsapp)}
                    <span className="font-medium">WhatsApp</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getStatusText(configStatus.whatsapp, testResults.whatsapp)}
                  </p>
                </div>
              </div>
            </div>

            {/* Test Buttons */}
            <Separator className="my-4" />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={testWooCommerceConnection}
                disabled={isTesting === "woocommerce"}
              >
                {isTesting === "woocommerce" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Test WooCommerce
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={testSMSService}
                disabled={isTesting === "sms"}
              >
                {isTesting === "sms" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Test SMS
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={testRouteOptimization}
                disabled={isTesting === "maps"}
              >
                {isTesting === "maps" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Test Maps
              </Button>

              <Button variant="outline" size="sm" onClick={loadConfiguration}>
                <Settings className="h-4 w-4 mr-2" />
                Obnoviť status
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Inštrukcie pre konfiguráciu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-l-4 border-info pl-4">
              <h4 className="font-semibold mb-2">Environment Variables</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Pre fungovanie aplikácie je potrebné nastaviť nasledujúce
                environment variables na serveri:
              </p>
              <div className="bg-muted p-3 rounded text-sm font-mono">
                # WooCommerce
                <br />
                WOOCOMMERCE_URL=https://zpoledomu.cz
                <br />
                WOOCOMMERCE_KEY=ck_your_consumer_key_here
                <br />
                WOOCOMMERCE_SECRET=cs_your_consumer_secret_here
                <br />
                <br />
                # Google Maps API
                <br />
                GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
                <br />
                <br />
                # SMS - Twilio
                <br />
                TWILIO_ACCOUNT_SID=your_twilio_account_sid
                <br />
                TWILIO_AUTH_TOKEN=your_twilio_auth_token
                <br />
                TWILIO_FROM_NUMBER=+420123456789
                <br />
              </div>
            </div>

            <div className="border-l-4 border-warning pl-4">
              <h4 className="font-semibold mb-2">WooCommerce nastavenie</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Přihlaste se do WordPress admin</li>
                <li>Idite na WooCommerce → Settings → Advanced → REST API</li>
                <li>Kliknite "Add key"</li>
                <li>Nastavte Description: "Driver App"</li>
                <li>User: Admin user</li>
                <li>Permissions: Read/Write</li>
                <li>Kliknite "Generate API key"</li>
                <li>Skopírujte Consumer key a Consumer secret</li>
              </ol>
            </div>

            <div className="border-l-4 border-success pl-4">
              <h4 className="font-semibold mb-2">Google Maps API</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Idite na Google Cloud Console</li>
                <li>Vytvorte nový projekt alebo vyberte existujúci</li>
                <li>Aktivujte APIs: Geocoding API, Distance Matrix API</li>
                <li>Vytvorte API key v Credentials</li>
                <li>Nastavte obmedzenia API key (optional)</li>
              </ol>
            </div>

            <div className="border-l-4 border-primary pl-4">
              <h4 className="font-semibold mb-2">SMS - Twilio</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Zaregistrujte sa na twilio.com</li>
                <li>Idite na Console Dashboard</li>
                <li>Skopírujte Account SID a Auth Token</li>
                <li>Kúpte telefónne číslo v Phone Numbers</li>
                <li>Overte že číslo podporuje SMS</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Live Configuration Status */}
        <Card>
          <CardHeader>
            <CardTitle>Aktuálny stav konfigurácie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded">
                <span>WooCommerce pripojenie</span>
                <Badge
                  variant={configStatus.woocommerce ? "default" : "secondary"}
                >
                  {configStatus.woocommerce ? "Aktívne" : "Neaktívne"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span>SMS notifikácie</span>
                <Badge variant={configStatus.sms ? "default" : "secondary"}>
                  {configStatus.sms ? "Aktívne" : "Neaktívne"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span>Optimalizácia trás</span>
                <Badge variant={configStatus.maps ? "default" : "secondary"}>
                  {configStatus.maps ? "Aktívne" : "Neaktívne"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span>WhatsApp notifikácie</span>
                <Badge
                  variant={configStatus.whatsapp ? "default" : "secondary"}
                >
                  {configStatus.whatsapp ? "Aktívne" : "Neaktívne"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Ďalšie kroky
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!configStatus.woocommerce && (
                <div className="p-3 border border-warning rounded bg-warning/10">
                  <p className="text-sm">
                    <strong>1. Nastavte WooCommerce API</strong> - bez tohto
                    nebude aplikácia môcť načítať objednávky
                  </p>
                </div>
              )}

              {!configStatus.maps && (
                <div className="p-3 border border-warning rounded bg-warning/10">
                  <p className="text-sm">
                    <strong>2. Aktivujte Google Maps API</strong> - pre
                    optimalizáciu trás a geocoding
                  </p>
                </div>
              )}

              {!configStatus.sms && (
                <div className="p-3 border border-info rounded bg-info/10">
                  <p className="text-sm">
                    <strong>3. Nastavte SMS službu</strong> - pre automatické
                    notifikácie zákazníkom (voliteľné)
                  </p>
                </div>
              )}

              {configStatus.woocommerce && configStatus.maps && (
                <div className="p-3 border border-success rounded bg-success/10">
                  <p className="text-sm">
                    <strong>✓ Aplikácia je pripravená na používanie!</strong>{" "}
                    Vodiči sa môžu prihlásiť a začať používať aplikáciu.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
