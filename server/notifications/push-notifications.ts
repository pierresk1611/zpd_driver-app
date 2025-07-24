interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

interface NotificationSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  customerId?: string;
  customerPhone?: string;
}

/**
 * Push notification service for in-app notifications
 * Replaces SMS notifications with web push notifications
 */
export class PushNotificationService {
  private vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY || 'BN4GvZtEZiZuqjNF8bQYOq8-bxM5F1Z5cF5vW1qA...',
    privateKey: process.env.VAPID_PRIVATE_KEY || 'your-private-vapid-key'
  };

  private subscriptions: Map<string, NotificationSubscription[]> = new Map();

  /**
   * Subscribe customer to push notifications
   */
  async subscribe(customerPhone: string, subscription: NotificationSubscription): Promise<void> {
    try {
      console.log(`📱 Subscribing ${customerPhone} to push notifications`);
      
      if (!this.subscriptions.has(customerPhone)) {
        this.subscriptions.set(customerPhone, []);
      }
      
      const existingSubscriptions = this.subscriptions.get(customerPhone)!;
      
      // Remove old subscription if exists
      const existingIndex = existingSubscriptions.findIndex(
        s => s.endpoint === subscription.endpoint
      );
      
      if (existingIndex >= 0) {
        existingSubscriptions[existingIndex] = subscription;
      } else {
        existingSubscriptions.push(subscription);
      }
      
      // In real implementation, save to database
      console.log(`✅ Customer ${customerPhone} subscribed to push notifications`);
      
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe customer from push notifications
   */
  async unsubscribe(customerPhone: string, endpoint: string): Promise<void> {
    try {
      const subscriptions = this.subscriptions.get(customerPhone);
      if (subscriptions) {
        const filtered = subscriptions.filter(s => s.endpoint !== endpoint);
        this.subscriptions.set(customerPhone, filtered);
      }
      
      console.log(`🔕 Customer ${customerPhone} unsubscribed from push notifications`);
      
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
    }
  }

  /**
   * Send push notification to customer
   */
  async sendNotification(
    customerPhone: string, 
    notification: PushNotification
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const subscriptions = this.subscriptions.get(customerPhone);
      
      if (!subscriptions || subscriptions.length === 0) {
        console.log(`📱 No push subscriptions found for ${customerPhone}`);
        return { success: false, error: 'No subscriptions found' };
      }

      console.log(`📤 Sending push notification to ${customerPhone}: ${notification.title}`);

      // Send to all subscriptions for this customer
      const results = await Promise.allSettled(
        subscriptions.map(subscription => this.sendToSubscription(subscription, notification))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`📊 Push notification results: ${successful} sent, ${failed} failed`);

      // Save notification to in-app inbox
      await this.saveToInAppInbox(customerPhone, notification);

      return { success: successful > 0 };

    } catch (error) {
      console.error('Error sending push notification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send notification to specific subscription
   */
  private async sendToSubscription(
    subscription: NotificationSubscription, 
    notification: PushNotification
  ): Promise<void> {
    try {
      // In real implementation, use web-push library
      // import webpush from 'web-push';
      // 
      // webpush.setVapidDetails(
      //   'mailto:your-email@example.com',
      //   this.vapidKeys.publicKey,
      //   this.vapidKeys.privateKey
      // );
      // 
      // await webpush.sendNotification(subscription, JSON.stringify(notification));

      // For now, simulate push notification
      console.log(`🔔 Push notification sent to endpoint: ${subscription.endpoint.substring(0, 50)}...`);
      console.log(`   Title: ${notification.title}`);
      console.log(`   Body: ${notification.body}`);

    } catch (error) {
      console.error('Error sending to subscription:', error);
      throw error;
    }
  }

  /**
   * Save notification to in-app inbox for offline access
   */
  private async saveToInAppInbox(
    customerPhone: string, 
    notification: PushNotification
  ): Promise<void> {
    try {
      const inboxItem = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customerPhone,
        title: notification.title,
        body: notification.body,
        icon: notification.icon,
        data: notification.data,
        read: false,
        createdAt: new Date().toISOString()
      };

      // In real implementation, save to database
      console.log(`📥 Saved notification to inbox for ${customerPhone}:`, inboxItem);

    } catch (error) {
      console.error('Error saving notification to inbox:', error);
    }
  }

  /**
   * Get unread notifications for customer
   */
  async getUnreadNotifications(customerPhone: string): Promise<any[]> {
    try {
      // In real implementation, fetch from database
      // For now, return mock data
      return [
        {
          id: 'notif_1',
          title: 'Doručení zítra',
          body: 'Vaše objednávka bude doručena zítra od 9:00 do 12:00',
          read: false,
          createdAt: new Date().toISOString()
        }
      ];

    } catch (error) {
      console.error('Error getting unread notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(customerPhone: string, notificationId: string): Promise<void> {
    try {
      // In real implementation, update database
      console.log(`✅ Marked notification ${notificationId} as read for ${customerPhone}`);
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Send evening delivery notification (replaces SMS)
   */
  async sendEveningDeliveryNotification(
    customerPhone: string,
    customerName: string,
    startTime: string,
    endTime: string,
    orderCount: number
  ): Promise<{ success: boolean; error?: string }> {
    const firstName = customerName.split(' ')[0];
    
    const notification: PushNotification = {
      title: '🚚 Doručení zítra',
      body: orderCount === 1 
        ? `Dobrý den ${firstName}, Vaše objednávka bude doručena zítra v čase od ${startTime} do ${endTime} hodin.`
        : `Dobrý den ${firstName}, Vaše objednávky (${orderCount}x) budou doručeny zítra v čase od ${startTime} do ${endTime} hodin.`,
      icon: '/icons/delivery-truck.png',
      badge: '/icons/badge.png',
      tag: 'evening-delivery',
      data: {
        type: 'evening_delivery',
        deliveryTime: `${startTime}-${endTime}`,
        orderCount
      },
      actions: [
        {
          action: 'view_orders',
          title: 'Zobrazit objednávky',
          icon: '/icons/orders.png'
        },
        {
          action: 'contact_driver',
          title: 'Kontaktovat řidiče',
          icon: '/icons/phone.png'
        }
      ]
    };

    return await this.sendNotification(customerPhone, notification);
  }

  /**
   * Send delivery completion notification with recipes (replaces SMS)
   */
  async sendDeliveryCompletionNotification(
    customerPhone: string,
    customerName: string,
    orderId: string,
    suggestedRecipes: Array<{ title: string; prepTime: number; difficulty: string }>
  ): Promise<{ success: boolean; error?: string }> {
    const firstName = customerName.split(' ')[0];
    
    let body = `Dobrý den ${firstName}, Vaše objednávka byla úspěšně doručena!`;
    
    if (suggestedRecipes.length > 0) {
      body += ` 👨‍🍳 Nevíte co vařit? Máme pro vás ${suggestedRecipes.length} receptů!`;
    }

    const notification: PushNotification = {
      title: '📦 Objednávka doručena',
      body,
      icon: '/icons/package-delivered.png',
      badge: '/icons/badge.png',
      tag: 'delivery-completed',
      data: {
        type: 'delivery_completed',
        orderId,
        recipes: suggestedRecipes
      },
      actions: [
        {
          action: 'view_recipes',
          title: 'Zobrazit recepty',
          icon: '/icons/chef.png'
        },
        {
          action: 'rate_delivery',
          title: 'Ohodnotit doručení',
          icon: '/icons/star.png'
        }
      ]
    };

    return await this.sendNotification(customerPhone, notification);
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

// Export types for use in other modules
export type { PushNotification, NotificationSubscription };
