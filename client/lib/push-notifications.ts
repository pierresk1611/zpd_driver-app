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

interface NotificationData {
  id: string;
  title: string;
  body: string;
  icon?: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

/**
 * Client-side push notification service
 */
export class ClientPushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private customerPhone: string = '';

  /**
   * Initialize push notifications
   */
  async initialize(customerPhone: string): Promise<void> {
    try {
      this.customerPhone = customerPhone;
      
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('🚫 Push notifications not supported');
        return;
      }

      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service worker registered');

      // Request notification permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.log('🚫 Notification permission denied');
        return;
      }

      // Subscribe to push notifications
      await this.subscribeToPush();
      
      console.log('✅ Push notifications initialized');

    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  /**
   * Request notification permission
   */
  private async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  /**
   * Subscribe to push notifications
   */
  private async subscribeToPush(): Promise<void> {
    try {
      if (!this.registration) {
        throw new Error('Service worker not registered');
      }

      // Check if already subscribed
      this.subscription = await this.registration.pushManager.getSubscription();
      
      if (!this.subscription) {
        // Create new subscription
        const vapidPublicKey = 'BN4GvZtEZiZuqjNF8bQYOq8-bxM5F1Z5cF5vW1qA...'; // Your VAPID public key
        
        this.subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
        });
      }

      // Send subscription to server
      await this.sendSubscriptionToServer();

    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    }
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(): Promise<void> {
    try {
      if (!this.subscription) {
        return;
      }

      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerPhone: this.customerPhone,
          subscription: this.subscription.toJSON()
        })
      });

      if (response.ok) {
        console.log('✅ Subscription sent to server');
      } else {
        console.error('❌ Failed to send subscription to server');
      }

    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<void> {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe();
        
        // Notify server
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            customerPhone: this.customerPhone,
            endpoint: this.subscription.endpoint
          })
        });

        this.subscription = null;
        console.log('✅ Unsubscribed from push notifications');
      }

    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
    }
  }

  /**
   * Show local notification (fallback)
   */
  showLocalNotification(notification: PushNotification): void {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const notif = new Notification(notification.title, {
          body: notification.body,
          icon: notification.icon || '/icons/notification-icon.png',
          badge: notification.badge || '/icons/badge.png',
          tag: notification.tag,
          data: notification.data,
          requireInteraction: true
        });

        // Handle notification click
        notif.onclick = () => {
          window.focus();
          notif.close();
          
          // Handle notification data
          if (notification.data?.type === 'delivery_completed' && notification.data?.recipes) {
            // Navigate to recipes tab
            this.handleRecipeNotificationClick();
          }
        };

        // Auto close after 10 seconds
        setTimeout(() => notif.close(), 10000);
      }

    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }

  /**
   * Handle recipe notification click
   */
  private handleRecipeNotificationClick(): void {
    // Dispatch custom event to switch to recipes tab
    const event = new CustomEvent('showRecipes', {
      detail: { source: 'notification' }
    });
    window.dispatchEvent(event);
  }

  /**
   * Get notification inbox
   */
  async getNotificationInbox(): Promise<NotificationData[]> {
    try {
      const response = await fetch(`/api/notifications/inbox?customerPhone=${encodeURIComponent(this.customerPhone)}`);

      if (response.ok) {
        const data = await response.json();
        // Extract notifications array from the response object
        return data.notifications || [];
      }

      return [];

    } catch (error) {
      console.error('Error getting notification inbox:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerPhone: this.customerPhone,
          notificationId
        })
      });

    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Check if notifications are supported and enabled
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }
}

// Export singleton instance
export const pushNotificationClient = new ClientPushNotificationService();
