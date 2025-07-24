import { pushNotificationService } from './push-notifications';

interface TomorrowOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryTimeSlot: string;
  deliveryDate: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
}

interface LogisticPlan {
  date: string;
  orders: TomorrowOrder[];
  timeSlots: Array<{
    start: string;
    end: string;
    capacity: number;
    orders: string[];
  }>;
}

/**
 * Evening notification system for tomorrow's deliveries
 * Runs every day at 20:00 to notify customers about next day delivery
 */
export class EveningNotificationService {
  
  /**
   * Send evening notifications to all customers with tomorrow orders
   */
  async sendTomorrowDeliveryNotifications(): Promise<void> {
    try {
      console.log('🌅 Starting evening notification process...');
      
      const tomorrow = this.getTomorrowDate();
      const logisticPlan = await this.getLogisticPlanForDate(tomorrow);
      
      if (!logisticPlan || logisticPlan.orders.length === 0) {
        console.log('📭 No orders for tomorrow, skipping notifications');
        return;
      }

      console.log(`📦 Found ${logisticPlan.orders.length} orders for tomorrow (${tomorrow})`);

      // Group orders by customer and send notifications
      const customerNotifications = this.groupOrdersByCustomer(logisticPlan.orders);
      
      for (const [customerPhone, orders] of customerNotifications) {
        await this.sendCustomerNotification(customerPhone, orders, tomorrow);
        // Small delay between notifications to avoid rate limiting
        await this.delay(1000);
      }

      console.log('✅ Evening notifications completed successfully');
      
    } catch (error) {
      console.error('❌ Error sending evening notifications:', error);
      throw error;
    }
  }

  /**
   * Get tomorrow's date in YYYY-MM-DD format
   */
  private getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  /**
   * Fetch logistic plan for specific date from WooCommerce/database
   */
  private async getLogisticPlanForDate(date: string): Promise<LogisticPlan | null> {
    try {
      // In real implementation, this would fetch from WooCommerce API
      const response = await fetch(`${process.env.WOOCOMMERCE_URL}/wp-json/wc/v3/orders`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.WOOCOMMERCE_KEY}:${process.env.WOOCOMMERCE_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`WooCommerce API error: ${response.status}`);
      }

      const orders = await response.json();
      
      // Filter orders for tomorrow and transform to our format
      const tomorrowOrders = orders
        .filter((order: any) => {
          const orderDate = order.meta_data?.find((meta: any) => meta.key === '_delivery_date')?.value;
          return orderDate === date && order.status === 'processing';
        })
        .map((order: any) => this.transformWooCommerceOrder(order));

      return {
        date,
        orders: tomorrowOrders,
        timeSlots: this.generateTimeSlots(tomorrowOrders)
      };

    } catch (error) {
      console.error('Error fetching logistic plan:', error);
      // Fallback to mock data for development
      return this.getMockLogisticPlan(date);
    }
  }

  /**
   * Transform WooCommerce order to our format
   */
  private transformWooCommerceOrder(order: any): TomorrowOrder {
    const deliveryTime = order.meta_data?.find((meta: any) => meta.key === '_delivery_time_slot')?.value || '9:00-12:00';
    
    return {
      id: order.id.toString(),
      customerName: `${order.billing.first_name} ${order.billing.last_name}`,
      customerPhone: order.billing.phone,
      customerEmail: order.billing.email,
      deliveryTimeSlot: deliveryTime,
      deliveryDate: order.meta_data?.find((meta: any) => meta.key === '_delivery_date')?.value,
      items: order.line_items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity
      }))
    };
  }

  /**
   * Group orders by customer phone for batch notifications
   */
  private groupOrdersByCustomer(orders: TomorrowOrder[]): Map<string, TomorrowOrder[]> {
    const grouped = new Map<string, TomorrowOrder[]>();
    
    orders.forEach(order => {
      const phone = order.customerPhone;
      if (!grouped.has(phone)) {
        grouped.set(phone, []);
      }
      grouped.get(phone)!.push(order);
    });
    
    return grouped;
  }

  /**
   * Send notification to individual customer
   */
  private async sendCustomerNotification(
    customerPhone: string, 
    orders: TomorrowOrder[], 
    date: string
  ): Promise<void> {
    try {
      const primaryOrder = orders[0];
      const timeSlot = primaryOrder.deliveryTimeSlot;
      const [startTime, endTime] = timeSlot.split('-');
      


      console.log(`📱 Sending evening push notification to ${customerPhone}`);

      const pushResult = await pushNotificationService.sendEveningDeliveryNotification(
        customerPhone,
        primaryOrder.customerName,
        startTime,
        endTime,
        orders.length
      );

      if (pushResult.success) {
        console.log(`✅ Evening push notification sent to ${primaryOrder.customerName}`);
        await this.logNotification(primaryOrder, 'evening_delivery_notification', 'sent');
      } else {
        console.error(`❌ Failed to send evening push notification to ${customerPhone}:`, pushResult.error);
        await this.logNotification(primaryOrder, 'evening_delivery_notification', 'failed');
      }

    } catch (error) {
      console.error(`❌ Error sending notification to ${customerPhone}:`, error);
    }
  }



  /**
   * Generate time slots for optimization
   */
  private generateTimeSlots(orders: TomorrowOrder[]): Array<{start: string; end: string; capacity: number; orders: string[]}> {
    const slots = new Map<string, string[]>();
    
    orders.forEach(order => {
      const timeSlot = order.deliveryTimeSlot;
      if (!slots.has(timeSlot)) {
        slots.set(timeSlot, []);
      }
      slots.get(timeSlot)!.push(order.id);
    });

    return Array.from(slots.entries()).map(([timeSlot, orderIds]) => {
      const [start, end] = timeSlot.split('-');
      return {
        start,
        end,
        capacity: 10, // Max orders per time slot
        orders: orderIds
      };
    });
  }

  /**
   * Log notification for tracking
   */
  private async logNotification(
    order: TomorrowOrder,
    type: string,
    status: 'sent' | 'failed'
  ): Promise<void> {
    try {
      // In real implementation, save to database
      console.log(`📝 Logging notification: ${type} - ${status} for order ${order.id}`);
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  /**
   * Mock data for development
   */
  private getMockLogisticPlan(date: string): LogisticPlan {
    return {
      date,
      orders: [
        {
          id: 'mock-1',
          customerName: 'Jana Nováková',
          customerPhone: '+420602123456',
          customerEmail: 'jana@example.com',
          deliveryTimeSlot: '9:00-12:00',
          deliveryDate: date,
          items: [
            { name: 'Mrkev', quantity: 2 },
            { name: 'Brambory', quantity: 5 }
          ]
        },
        {
          id: 'mock-2',
          customerName: 'Petr Svoboda',
          customerPhone: '+420603987654',
          customerEmail: 'petr@example.com',
          deliveryTimeSlot: '14:00-17:00',
          deliveryDate: date,
          items: [
            { name: 'Salát', quantity: 3 },
            { name: 'Rajčata', quantity: 4 }
          ]
        }
      ],
      timeSlots: [
        { start: '9:00', end: '12:00', capacity: 10, orders: ['mock-1'] },
        { start: '14:00', end: '17:00', capacity: 10, orders: ['mock-2'] }
      ]
    };
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Scheduled function to run every evening at 20:00
 */
export async function runEveningNotifications(): Promise<void> {
  const notificationService = new EveningNotificationService();
  await notificationService.sendTomorrowDeliveryNotifications();
}

/**
 * Setup cron job for evening notifications
 */
export function scheduleEveningNotifications(): void {
  // This would typically use node-cron or similar
  console.log('🕒 Evening notifications scheduled for 20:00 daily');
  
  // Example with setInterval for demo (in production use proper cron)
  const now = new Date();
  const targetTime = new Date();
  targetTime.setHours(20, 0, 0, 0);
  
  if (targetTime <= now) {
    targetTime.setDate(targetTime.getDate() + 1);
  }
  
  const msUntilTarget = targetTime.getTime() - now.getTime();
  
  setTimeout(() => {
    runEveningNotifications();
    // Then run daily
    setInterval(runEveningNotifications, 24 * 60 * 60 * 1000);
  }, msUntilTarget);
}
