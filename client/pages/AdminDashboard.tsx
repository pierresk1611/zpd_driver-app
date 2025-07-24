import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Users,
  Plus,
  Edit,
  Trash2,
  Truck,
  Phone,
  MapPin,
  Clock,
  LogOut,
  Save,
  X,
  ArrowRightLeft,
  Calendar,
  Settings,
  BarChart3,
  Carrot,
  User,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
} from "lucide-react";

interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  isActive: boolean;
  assignedPostalCodes?: string[];
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
  assignedDriverId?: string;
  notes?: string;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"drivers" | "orders" | "stats">(
    "drivers",
  );

  // Driver management state
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [newDriver, setNewDriver] = useState({
    name: "",
    phone: "",
    email: "",
  });

  // Order transfer state
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [targetDriverId, setTargetDriverId] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadDrivers();
    loadOrders();
  }, []);

  const loadDrivers = async () => {
    try {
      const response = await fetch("/api/drivers");
      const data = await response.json();
      if (data.success) {
        setDrivers(data.drivers);
      } else {
        // Fallback to mock data
        setDrivers([
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
        ]);
      }
    } catch (error) {
      console.error("Error loading drivers:", error);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch("/api/orders/today");
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      } else {
        // Fallback to mock data
        setOrders([
          {
            id: "1",
            customerName: "Marie Svobodová",
            address: "Wenceslas Square 1, Praha",
            postalCode: "110 00",
            phone: "+420 602 123 456",
            deliveryTime: "09:00-12:00",
            status: "pending",
            items: [
              { name: "Mrkev", quantity: 2, farmer: "Farma Zelený háj" },
              { name: "Brambory", quantity: 5, farmer: "Bio farma Novák" },
            ],
            assignedDriverId: "1",
          },
          {
            id: "2",
            customerName: "Petr Krejčí",
            address: "Na Příkopě 22, Praha",
            postalCode: "110 00",
            phone: "+420 603 987 654",
            deliveryTime: "12:00-15:00",
            status: "on-route",
            items: [
              { name: "Salát", quantity: 3, farmer: "Farma Zelený háj" },
              { name: "Rajčata", quantity: 2, farmer: "Bio farma Novák" },
            ],
            assignedDriverId: "1",
          },
          {
            id: "3",
            customerName: "Anna Horáková",
            address: "Vinohrady 45, Praha",
            postalCode: "120 00",
            phone: "+420 604 567 890",
            deliveryTime: "15:00-18:00",
            status: "pending",
            items: [
              { name: "Cuketa", quantity: 1, farmer: "Farma Zelený háj" },
              { name: "Paprika", quantity: 4, farmer: "Eco farma Dvořák" },
            ],
            assignedDriverId: "2",
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  };

  const addDriver = async () => {
    if (!newDriver.name || !newDriver.phone) return;

    const driver: Driver = {
      id: Date.now().toString(),
      name: newDriver.name,
      phone: newDriver.phone,
      email: newDriver.email,
      isActive: true,
      assignedPostalCodes: [],
    };

    setDrivers((prev) => [...prev, driver]);
    setNewDriver({ name: "", phone: "", email: "" });
    setIsAddingDriver(false);

    // Here would be API call to save driver
    console.log("Adding driver:", driver);
  };

  const updateDriver = async (driver: Driver) => {
    setDrivers((prev) => prev.map((d) => (d.id === driver.id ? driver : d)));
    setEditingDriver(null);

    // Here would be API call to update driver
    console.log("Updating driver:", driver);
  };

  const toggleDriverStatus = async (driverId: string) => {
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === driverId ? { ...d, isActive: !d.isActive } : d,
      ),
    );

    // Here would be API call to update driver status
    console.log("Toggling driver status:", driverId);
  };

  const transferOrder = async () => {
    if (!selectedOrderId || !targetDriverId) return;

    setOrders((prev) =>
      prev.map((order) =>
        order.id === selectedOrderId
          ? { ...order, assignedDriverId: targetDriverId }
          : order,
      ),
    );

    setTransferDialogOpen(false);
    setSelectedOrderId(null);
    setTargetDriverId("");

    // Here would be API call to transfer order
    console.log(
      "Transferring order:",
      selectedOrderId,
      "to driver:",
      targetDriverId,
    );
  };

  const getDriverName = (driverId?: string) => {
    const driver = drivers.find((d) => d.id === driverId);
    return driver ? driver.name : "Nepriradený";
  };

  const getOrdersByDriver = (driverId: string) => {
    return orders.filter((order) => order.assignedDriverId === driverId);
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-muted text-muted-foreground";
      case "on-route":
        return "bg-blue-500 text-white";
      case "delivered":
        return "bg-green-500 text-white";
      case "delayed":
        return "bg-yellow-500 text-white";
      case "cancelled":
        return "bg-red-500 text-white";
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
        return "Doručeno";
      case "delayed":
        return "Zdržení";
      case "cancelled":
        return "Zrušené";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary-foreground/20 p-2 rounded-lg">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Zpoledomu Admin</h1>
                <p className="text-primary-foreground/80 text-sm">
                  Správa vodičov a objednávok
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4" />
                  <span>Administrator</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(new Date())}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="hover:bg-primary-foreground/20"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-background border-b">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-1 p-1">
            <Button
              variant={activeTab === "drivers" ? "default" : "ghost"}
              onClick={() => setActiveTab("drivers")}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Vodiči ({drivers.length})
            </Button>
            <Button
              variant={activeTab === "orders" ? "default" : "ghost"}
              onClick={() => setActiveTab("orders")}
              className="flex items-center gap-2"
            >
              <Truck className="h-4 w-4" />
              Objednávky ({orders.length})
            </Button>
            <Button
              variant={activeTab === "stats" ? "default" : "ghost"}
              onClick={() => setActiveTab("stats")}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Štatistiky
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Drivers Tab */}
        {activeTab === "drivers" && (
          <div className="space-y-6">
            {/* Add Driver Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Správa vodičov
                  </CardTitle>
                  <Button
                    onClick={() => setIsAddingDriver(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Pridať vodiča
                  </Button>
                </div>
              </CardHeader>

              {isAddingDriver && (
                <CardContent>
                  <div className="border rounded-lg p-4 bg-accent/50">
                    <h4 className="font-semibold mb-3">Nový vodič</h4>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Input
                        placeholder="Meno vodiča"
                        value={newDriver.name}
                        onChange={(e) =>
                          setNewDriver((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                      <Input
                        placeholder="Telefón"
                        value={newDriver.phone}
                        onChange={(e) =>
                          setNewDriver((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                      />
                      <Input
                        placeholder="Email (voliteľné)"
                        value={newDriver.email}
                        onChange={(e) =>
                          setNewDriver((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button onClick={addDriver} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Uložiť
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsAddingDriver(false);
                          setNewDriver({ name: "", phone: "", email: "" });
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Zrušiť
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Drivers List */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {drivers.map((driver) => (
                <Card
                  key={driver.id}
                  className={!driver.isActive ? "opacity-60" : ""}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-semibold">{driver.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {driver.phone}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={driver.isActive ? "default" : "secondary"}
                      >
                        {driver.isActive ? "Aktívny" : "Neaktívny"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {driver.email && (
                        <p className="text-sm text-muted-foreground">
                          {driver.email}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span>Objednávky dnes:</span>
                        <Badge variant="outline">
                          {getOrdersByDriver(driver.id).length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>PSČ:</span>
                        <span className="text-muted-foreground">
                          {driver.assignedPostalCodes?.join(", ") || "Žiadne"}
                        </span>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingDriver(driver)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleDriverStatus(driver.id)}
                        className={
                          driver.isActive ? "text-red-600" : "text-green-600"
                        }
                      >
                        {driver.isActive ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Všetky objednávky ({orders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border rounded-lg p-4 bg-card"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {order.customerName}
                          </h3>
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <MapPin className="h-4 w-4" />
                            <span>{order.address}</span>
                            <Badge variant="outline">{order.postalCode}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                            <Clock className="h-4 w-4" />
                            <span>{order.deliveryTime}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusText(order.status)}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-muted/30 p-2 rounded text-sm">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          <span>
                            Vodič: {getDriverName(order.assignedDriverId)}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrderId(order.id);
                            setTransferDialogOpen(true);
                          }}
                        >
                          <ArrowRightLeft className="h-4 w-4 mr-1" />
                          Presunúť
                        </Button>
                      </div>

                      <div className="mt-3">
                        <h4 className="text-sm font-medium mb-2">Položky:</h4>
                        <div className="grid gap-1">
                          {order.items.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between text-sm bg-muted/30 p-2 rounded"
                            >
                              <span>
                                {item.name} ({item.farmer})
                              </span>
                              <span>{item.quantity}x</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {drivers.filter((d) => d.isActive).length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Aktívni vodiči
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {orders.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Objednávky dnes
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {orders.filter((o) => o.status === "delivered").length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Doručené
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {
                        orders.filter(
                          (o) =>
                            o.status === "pending" || o.status === "on-route",
                        ).length
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">
                      V procese
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Driver Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Výkonnosť vodičov</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {drivers
                    .filter((d) => d.isActive)
                    .map((driver) => {
                      const driverOrders = getOrdersByDriver(driver.id);
                      const completed = driverOrders.filter(
                        (o) => o.status === "delivered",
                      ).length;
                      const pending = driverOrders.filter(
                        (o) =>
                          o.status === "pending" || o.status === "on-route",
                      ).length;

                      return (
                        <div
                          key={driver.id}
                          className="flex items-center justify-between p-3 border rounded"
                        >
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">{driver.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {driver.phone}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-4 text-sm">
                            <div className="text-center">
                              <div className="font-bold text-green-600">
                                {completed}
                              </div>
                              <div className="text-muted-foreground">
                                Doručené
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-blue-600">
                                {pending}
                              </div>
                              <div className="text-muted-foreground">
                                V procese
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold">
                                {driverOrders.length}
                              </div>
                              <div className="text-muted-foreground">
                                Celkom
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Transfer Order Dialog */}
      {transferDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-lg border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Presunúť objednávku</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTransferDialogOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Vyberte vodiča, ktorému chcete priradiť objednávku
            </p>

            <div className="space-y-3 mb-4">
              {drivers
                .filter((d) => d.isActive)
                .map((driver) => (
                  <Button
                    key={driver.id}
                    variant={
                      targetDriverId === driver.id ? "default" : "outline"
                    }
                    className="w-full justify-start h-auto p-3"
                    onClick={() => setTargetDriverId(driver.id)}
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">{driver.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {getOrdersByDriver(driver.id).length} objednávok
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setTransferDialogOpen(false)}
              >
                Zrušiť
              </Button>
              <Button onClick={transferOrder} disabled={!targetDriverId}>
                Presunúť objednávku
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Driver Dialog */}
      {editingDriver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-lg border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Upraviť vodiča</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingDriver(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-sm font-medium">Meno</label>
                <Input
                  value={editingDriver.name}
                  onChange={(e) =>
                    setEditingDriver((prev) =>
                      prev ? { ...prev, name: e.target.value } : null,
                    )
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Telefón</label>
                <Input
                  value={editingDriver.phone}
                  onChange={(e) =>
                    setEditingDriver((prev) =>
                      prev ? { ...prev, phone: e.target.value } : null,
                    )
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={editingDriver.email || ""}
                  onChange={(e) =>
                    setEditingDriver((prev) =>
                      prev ? { ...prev, email: e.target.value } : null,
                    )
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingDriver(null)}>
                Zrušiť
              </Button>
              <Button
                onClick={() => editingDriver && updateDriver(editingDriver)}
              >
                Uložiť zmeny
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
