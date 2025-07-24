// client/pages/Index.tsx - Zpoledomu Driver App
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, User, Package, MapPin, Phone, Clock } from "lucide-react";

interface Driver {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
}

interface Order {
  id: string;
  customerName: string;
  address: string;
  phone: string;
  deliveryTime: string;
  status: "pending" | "on-route" | "delivered";
  items: { name: string; quantity: number; farmer: string }[];
}

export default function Index() {
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  // Load mock data
  useEffect(() => {
    const mockOrders: Order[] = [
      {
        id: "1",
        customerName: "Marie Svobodová",
        address: "Wenceslas Square 1, Praha",
        phone: "+420 602 123 456",
        deliveryTime: "09:00-12:00",
        status: "pending",
        items: [
          { name: "Mrkev", quantity: 2, farmer: "Farma Zelený háj" },
          { name: "Brambory", quantity: 5, farmer: "Bio farma Novák" },
        ],
      },
      {
        id: "2",
        customerName: "Petr Krejčí",
        address: "Na Příkopě 22, Praha",
        phone: "+420 603 987 654",
        deliveryTime: "12:00-15:00",
        status: "on-route",
        items: [{ name: "Salát", quantity: 3, farmer: "Farma Zelený háj" }],
      },
    ];
    setOrders(mockOrders);
  }, []);

  const updateOrderStatus = (orderId: string, status: Order["status"]) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status } : order,
      ),
    );
  };

  // Login screen
  if (!currentDriver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-green-800">
              🥕 Zpoledomu
            </CardTitle>
            <p className="text-muted-foreground">Driver Application</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full"
              onClick={() =>
                setCurrentDriver({
                  id: "1",
                  name: "Jan Novák",
                  phone: "+420 601 111 222",
                  isActive: true,
                })
              }
            >
              <User className="w-4 h-4 mr-2" />
              Login as Jan Novák
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main app interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <header className="bg-white shadow-sm border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-green-800">
                  🥕 Zpoledomu
                </h1>
                <p className="text-sm text-muted-foreground">
                  Driver: {currentDriver.name}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setCurrentDriver(null)}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Today's Deliveries
          </h2>
          <p className="text-muted-foreground">
            {orders.length} orders •{" "}
            {orders.filter((o) => o.status === "delivered").length} completed
          </p>
        </div>

        <div className="grid gap-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {order.customerName}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {order.address}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {order.phone}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {order.deliveryTime}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      order.status === "delivered" ? "default" : "secondary"
                    }
                  >
                    {order.status === "pending" && "Čekající"}
                    {order.status === "on-route" && "Na cestě"}
                    {order.status === "delivered" && "Doručeno"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="mb-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Items:
                  </h4>
                  <div className="space-y-1">
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="text-sm bg-gray-50 rounded p-2"
                      >
                        <span className="font-medium">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          • {item.farmer}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  {order.status === "pending" && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, "on-route")}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Start Route
                    </Button>
                  )}
                  {order.status === "on-route" && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, "delivered")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Mark Delivered
                    </Button>
                  )}
                  <Button variant="outline">Navigate</Button>
                  <Button variant="outline">Call Customer</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
