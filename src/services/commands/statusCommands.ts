
import { sendMessage } from './core/messageUtils';
import { InlineKeyboardMarkup } from '@/services/telegramService';
import { getCollectionById } from '../storageService';

// Using any for simplicity since we're just creating stubs to fix type errors
export const handleStatusCallback = (
  callbackQuery: any, 
  botToken: string
): Promise<any> => {
  // Get the chat ID and user ID from the callback query
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  
  // Parse the collection ID from the callback data
  // Assuming the callback data format is: "status:collectionId"
  const callbackData = callbackQuery.data;
  const parts = callbackData.split(':');
  const collectionId = parts[1];
  
  console.log(`[StatusCommands] Handling status callback for collection ${collectionId} in chat ${chatId}`);
  
  // Get collection details
  const collection = getCollectionById(collectionId);
  
  if (!collection) {
    return sendMessage(
      botToken,
      chatId,
      `Ошибка: сбор с ID ${collectionId} не найден.`
    );
  }
  
  // Create keyboard with action buttons
  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "💰 Внести средства", callback_data: `pay:${collectionId}` }
      ],
      [
        { text: "📊 Детальный статус", callback_data: `collection_status:${collectionId}` }
      ],
      [
        { text: "⬅️ Назад", callback_data: "back_to_main" }
      ]
    ]
  };
  
  // Send a status message
  return sendMessage(
    botToken,
    chatId,
    `Статус сбора "${collection.title}":
    
📊 Собрано: ${collection.currentAmount} из ${collection.targetAmount} руб. (${Math.round(collection.currentAmount / collection.targetAmount * 100)}%)
👥 Участников: ${collection.participants.length}
⏱️ Статус: ${getStatusText(collection.status)}`,
    { replyMarkup: keyboard }
  );
};

export const handleCollectionStatusCallback = (
  callbackQuery: any, 
  botToken: string
): Promise<any> => {
  // Get the chat ID and user ID from the callback query
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  
  // Parse the collection ID from the callback data
  // Assuming the callback data format is: "collection_status:collectionId"
  const callbackData = callbackQuery.data;
  const parts = callbackData.split(':');
  const collectionId = parts[1];
  
  console.log(`[StatusCommands] Handling collection_status callback for collection ${collectionId} in chat ${chatId}`);
  
  // Get collection details
  const collection = getCollectionById(collectionId);
  
  if (!collection) {
    return sendMessage(
      botToken,
      chatId,
      `Ошибка: сбор с ID ${collectionId} не найден.`
    );
  }
  
  // Create keyboard with action buttons
  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "💰 Внести средства", callback_data: `pay:${collectionId}` }
      ]
    ]
  };
  
  // Add organizer actions if the user is the organizer
  if (collection.organizerId === userId) {
    keyboard.inline_keyboard.push([
      { text: "📩 Напомнить участникам", callback_data: `send_reminders:${collectionId}` }
    ]);
    
    if (collection.status === 'active' && collection.currentAmount >= collection.targetAmount) {
      keyboard.inline_keyboard.push([
        { text: "✅ Завершить сбор", callback_data: `complete_collection:${collectionId}` }
      ]);
    }
  }
  
  keyboard.inline_keyboard.push([
    { text: "⬅️ Назад", callback_data: `status:${collectionId}` }
  ]);
  
  // Get participants information
  const paidParticipants = collection.participants.filter(p => p.hasPaid).length;
  const pendingParticipants = collection.participants.length - paidParticipants;
  
  // Send a detailed collection status message
  return sendMessage(
    botToken,
    chatId,
    `Детальный статус сбора "${collection.title}":
    
💰 Собрано: ${collection.currentAmount} из ${collection.targetAmount} руб. (${Math.round(collection.currentAmount / collection.targetAmount * 100)}%)
👥 Участников всего: ${collection.participants.length}
✅ Оплатили: ${paidParticipants}
⏳ Ожидают оплаты: ${pendingParticipants}
⏱️ Статус: ${getStatusText(collection.status)}
📅 Создан: ${new Date(collection.createdAt).toLocaleDateString()}`,
    { replyMarkup: keyboard }
  );
};

// Helper function to convert status codes to human-readable text
const getStatusText = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Ожидает активации';
    case 'active':
      return 'Активен';
    case 'completed':
      return 'Завершен';
    case 'cancelled':
      return 'Отменен';
    case 'frozen':
      return 'Приостановлен';
    default:
      return 'Неизвестно';
  }
};
