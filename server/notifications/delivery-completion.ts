import { pushNotificationService } from './push-notifications';

interface CompletedOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveredAt: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
}

interface RecipeSuggestion {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prepTime: number;
  matchingIngredients: string[];
}

/**
 * Service for sending delivery completion notifications with recipe suggestions
 */
export class DeliveryCompletionService {

  /**
   * Send delivery completion notification with recipe suggestions
   */
  async sendDeliveryCompletionWithRecipes(order: CompletedOrder): Promise<void> {
    try {
      console.log(`��� Sending delivery completion notification for order ${order.id}`);

      // Get recipe suggestions based on delivered items
      const recipeSuggestions = await this.getRecipeSuggestions(order.items);

      // Send push notification with recipe suggestions
      const recipesToSend = recipeSuggestions.slice(0, 3); // Top 3 recipes
      await this.sendRecipeSuggestionPush(order, recipesToSend);

      // Log the notification
      await this.logDeliveryNotification(order, recipeSuggestions);

      console.log(`✅ Delivery completion notification sent for order ${order.id}`);

    } catch (error) {
      console.error(`❌ Error sending delivery completion notification for order ${order.id}:`, error);
      throw error;
    }
  }

  /**
   * Get recipe suggestions based on delivered items
   */
  private async getRecipeSuggestions(deliveredItems: Array<{name: string; quantity: number}>): Promise<RecipeSuggestion[]> {
    try {
      // In real implementation, this would call a recipe matching service
      // For now, we'll use a simplified matching algorithm
      
      const itemNames = deliveredItems.map(item => item.name.toLowerCase());
      
      // Predefined recipe database with Czech names
      const recipeDatabase: RecipeSuggestion[] = [
        {
          id: 'recipe-1',
          title: 'Bramborový guláš s mrkví',
          difficulty: 'easy',
          prepTime: 45,
          matchingIngredients: ['brambory', 'mrkev', 'cibule']
        },
        {
          id: 'recipe-2',
          title: 'Salát s rajčaty a okurkou',
          difficulty: 'easy',
          prepTime: 15,
          matchingIngredients: ['rajčata', 'okurka', 'salát']
        },
        {
          id: 'recipe-3',
          title: 'Pečená paprika s česnekem',
          difficulty: 'medium',
          prepTime: 35,
          matchingIngredients: ['paprika', 'česnek']
        },
        {
          id: 'recipe-4',
          title: 'Krémová polévka z mrkve',
          difficulty: 'easy',
          prepTime: 40,
          matchingIngredients: ['mrkev', 'brambory', 'cibule']
        },
        {
          id: 'recipe-5',
          title: 'Cuketa na grilu s bylinkami',
          difficulty: 'easy',
          prepTime: 20,
          matchingIngredients: ['cuketa']
        },
        {
          id: 'recipe-6',
          title: 'Pórková polévka s bramborem',
          difficulty: 'medium',
          prepTime: 50,
          matchingIngredients: ['pórek', 'brambory']
        }
      ];

      // Find recipes that match delivered ingredients
      const matchingRecipes = recipeDatabase.filter(recipe => {
        return recipe.matchingIngredients.some(ingredient => 
          itemNames.some(deliveredItem => 
            deliveredItem.includes(ingredient.toLowerCase()) || 
            ingredient.toLowerCase().includes(deliveredItem)
          )
        );
      });

      // Sort by number of matching ingredients and difficulty (easy first)
      return matchingRecipes.sort((a, b) => {
        const aMatches = a.matchingIngredients.filter(ingredient =>
          itemNames.some(deliveredItem =>
            deliveredItem.includes(ingredient.toLowerCase()) ||
            ingredient.toLowerCase().includes(deliveredItem)
          )
        ).length;

        const bMatches = b.matchingIngredients.filter(ingredient =>
          itemNames.some(deliveredItem =>
            deliveredItem.includes(ingredient.toLowerCase()) ||
            ingredient.toLowerCase().includes(deliveredItem)
          )
        ).length;

        if (aMatches !== bMatches) {
          return bMatches - aMatches; // More matches first
        }

        // If same number of matches, prefer easier recipes
        const difficultyOrder = { 'easy': 0, 'medium': 1, 'hard': 2 };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      });

    } catch (error) {
      console.error('Error getting recipe suggestions:', error);
      return [];
    }
  }

  /**
   * Send push notification with recipe suggestions
   */
  private async sendRecipeSuggestionPush(
    order: CompletedOrder,
    recipes: RecipeSuggestion[]
  ): Promise<void> {
    try {
      console.log(`📱 Sending recipe suggestion push notification to ${order.customerPhone}`);

      const pushResult = await pushNotificationService.sendDeliveryCompletionNotification(
        order.customerPhone,
        order.customerName,
        order.id,
        recipes.map(r => ({
          title: r.title,
          prepTime: r.prepTime,
          difficulty: r.difficulty
        }))
      );

      if (pushResult.success) {
        console.log(`✅ Recipe suggestion push notification sent to ${order.customerName}`);
      } else {
        console.error(`❌ Failed to send recipe suggestion push notification:`, pushResult.error);
      }

    } catch (error) {
      console.error('Error sending recipe suggestion push notification:', error);
    }
  }



  /**
   * Log delivery notification for tracking
   */
  private async logDeliveryNotification(
    order: CompletedOrder, 
    recipes: RecipeSuggestion[]
  ): Promise<void> {
    try {
      const logData = {
        orderId: order.id,
        customerName: order.customerName,
        deliveredAt: order.deliveredAt,
        suggestedRecipes: recipes.map(r => r.title),
        notificationType: 'delivery_completion_with_recipes',
        timestamp: new Date().toISOString()
      };

      console.log(`📝 Logging delivery notification:`, logData);
      
      // In real implementation, save to database
      // await this.saveNotificationLog(logData);

    } catch (error) {
      console.error('Error logging delivery notification:', error);
    }
  }

  /**
   * Schedule delivery completion notification (called when order is marked as delivered)
   */
  async scheduleDeliveryCompletionNotification(order: CompletedOrder): Promise<void> {
    try {
      // Send notification immediately after delivery
      await this.sendDeliveryCompletionWithRecipes(order);

    } catch (error) {
      console.error('Error scheduling delivery completion notification:', error);
      throw error;
    }
  }
}

/**
 * Function to be called when an order is marked as delivered
 */
export async function onOrderDelivered(order: CompletedOrder): Promise<void> {
  const deliveryService = new DeliveryCompletionService();
  await deliveryService.scheduleDeliveryCompletionNotification(order);
}

/**
 * Mock function for testing delivery notifications
 */
export async function testDeliveryNotification(): Promise<void> {
  const mockOrder: CompletedOrder = {
    id: 'test-123',
    customerName: 'Jana Nováková',
    customerPhone: '+420602123456',
    customerEmail: 'jana@example.com',
    deliveredAt: new Date().toISOString(),
    items: [
      { name: 'Brambory', quantity: 5 },
      { name: 'Mrkev', quantity: 3 },
      { name: 'Cibule', quantity: 2 }
    ]
  };

  console.log('🧪 Testing delivery completion notification...');
  await onOrderDelivered(mockOrder);
}
