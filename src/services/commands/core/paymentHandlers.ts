
import { sendMessage } from './messageUtils';
import { InlineKeyboardMarkup } from '@/services/telegram/types';
import { getCollectionById } from '../../storageService';

// Handle payment options command
export const handlePaymentOptionsCommand = async (
  token: string,
  chatId: number,
  collectionId: string,
  amount?: number
): Promise<any> => {
  console.log(`[PaymentHandlers] Handling payment options for collection ${collectionId} in chat ${chatId}`);
  
  // Get collection details
  const collection = getCollectionById(collectionId);
  
  if (!collection) {
    return sendMessage(
      token,
      chatId,
      `Ошибка: сбор с ID ${collectionId} не найден.`
    );
  }
  
  const amountText = amount ? `${amount} руб.` : "взноса";
  
  // Create keyboard with payment options
  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { 
          text: "💵 Я оплатил(а) лично", 
          callback_data: amount ? `i_paid:${collectionId}:${amount}` : `i_paid:${collectionId}` 
        }
      ],
      [
        { 
          text: "💳 Оплатить онлайн (скоро)", 
          callback_data: `pay_online:${collectionId}:${amount || ''}` 
        }
      ],
      [
        { text: "⬅️ Назад", callback_data: `pay:${collectionId}` }
      ]
    ]
  };
  
  return sendMessage(
    token,
    chatId,
    `Выберите способ оплаты ${amountText} для сбора "${collection.title}":

🔹 Я оплатил(а) лично - нажмите, если передали деньги организатору лично
🔹 Оплатить онлайн - в разработке, скоро будет доступно`,
    { replyMarkup: keyboard }
  );
};

// Handle I paid command
export const handleIPaidCommand = async (
  token: string,
  chatId: number,
  userId: number,
  firstName: string,
  collectionId: string,
  amount: number = 0
): Promise<any> => {
  console.log(`[PaymentHandlers] Handling I paid for collection ${collectionId} in chat ${chatId}, amount: ${amount}`);
  
  // Get collection details
  const collection = getCollectionById(collectionId);
  
  if (!collection) {
    return sendMessage(
      token,
      chatId,
      `Ошибка: сбор с ID ${collectionId} не найден.`
    );
  }
  
  // Check if the user is a participant
  const participantIndex = collection.participants.findIndex(p => p.userId === userId);
  
  if (participantIndex === -1) {
    // User is not a participant, offer them to join
    const joinKeyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: "✅ Присоединиться к сбору", callback_data: `join:${collectionId}` }
        ],
        [
          { text: "⬅️ Назад", callback_data: "back_to_main" }
        ]
      ]
    };
    
    return sendMessage(
      token,
      chatId,
      `Вы не являетесь участником сбора "${collection.title}". Чтобы внести оплату, сначала присоединитесь:`,
      { replyMarkup: joinKeyboard }
    );
  }
  
  // Proceed with marking payment as pending
  // In a real app, we would update the database here
  
  // Create message to send to organizer
  const organizerMessage = `
Участник ${firstName} сообщил о внесении ${amount} руб. в сбор "${collection.title}".

Чтобы подтвердить оплату, нажмите кнопку ниже.
  `;
  
  const organizerKeyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { 
          text: "✅ Подтвердить оплату", 
          callback_data: `confirm_payment:${collectionId}:${userId}:${amount}` 
        }
      ],
      [
        { 
          text: "❌ Отклонить", 
          callback_data: `reject_payment:${collectionId}:${userId}:${amount}` 
        }
      ]
    ]
  };
  
  // Send message to organizer (if not in test mode)
  if (collection.organizerId && collection.organizerId !== userId) {
    try {
      // In a real app, we would get the organizer's chat ID from the database
      // For now, we'll send it to the same chat for testing
      await sendMessage(
        token,
        chatId, // In real app: organizerChatId
        organizerMessage,
        { replyMarkup: organizerKeyboard }
      );
    } catch (error) {
      console.error(`[PaymentHandlers] Error sending message to organizer:`, error);
    }
  }
  
  // Confirmation to the user
  const userKeyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "📊 Статус сбора", callback_data: `status:${collectionId}` }
      ],
      [
        { text: "⬅️ Главное меню", callback_data: "back_to_main" }
      ]
    ]
  };
  
  return sendMessage(
    token,
    chatId,
    `Спасибо! Ваша оплата ${amount} руб. для сбора "${collection.title}" ожидает подтверждения организатором.

Статус оплаты обновится после подтверждения.`,
    { replyMarkup: userKeyboard }
  );
};

