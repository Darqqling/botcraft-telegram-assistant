
import { sendMessage } from './baseCommandHandler';
import { InlineKeyboardMarkup } from '@/services/telegramService';
import { createCollection, ensureUserExists } from '../collectionService';

// Handle the callback for creating a new collection
export const handleNewCollectionCallback = (
  callbackQuery: any, 
  botToken: string
): Promise<any> => {
  // Get the chat ID and user ID from the callback query
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const firstName = callbackQuery.from.first_name;
  
  // Ensure user exists in our system
  ensureUserExists(userId, firstName, chatId);
  
  // Initial step for collection creation - ask for the collection title
  const message = `
🌟 Создание нового сбора 🌟

Для начала, введите название сбора (например, "День рождения Ивана" или "Подарок коллеге").

Чтобы отменить создание, нажмите кнопку "Отмена".
  `;
  
  const cancelButton: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "❌ Отмена", callback_data: "back_to_main" }
      ]
    ]
  };
  
  return sendMessage(
    botToken,
    chatId,
    message,
    { replyMarkup: cancelButton }
  );
};

// Handle group collection creation
export const handleGroupNewCollectionCallback = (
  callbackQuery: any, 
  botToken: string
): Promise<any> => {
  // Get the chat ID and user ID from the callback query
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const firstName = callbackQuery.from.first_name;
  
  // Ensure user exists in our system
  ensureUserExists(userId, firstName, chatId);
  
  // Initial step for group collection creation
  const message = `
👥 Создание группового сбора 👥

Этот сбор будет привязан к текущему чату, и все участники чата смогут присоединиться.

Для начала, введите название сбора (например, "День рождения Ивана" или "Корпоративный праздник").

Чтобы отменить создание, нажмите кнопку "Отмена".
  `;
  
  const cancelButton: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "❌ Отмена", callback_data: "back_to_main" }
      ]
    ]
  };
  
  return sendMessage(
    botToken,
    chatId,
    message,
    { replyMarkup: cancelButton }
  );
};

// Create collection with provided details
export const createNewCollection = async (
  token: string,
  organizerId: number,
  title: string,
  description: string,
  targetAmount: number,
  chatId: number,
  isGroupCollection: boolean = false
): Promise<any> => {
  try {
    // For now, we'll create an empty participants array
    // In a real implementation, this would be populated based on user selection
    const participantIds: number[] = [];
    
    // Create the collection
    const collection = await createCollection(
      token,
      organizerId,
      title,
      description,
      targetAmount,
      participantIds,
      undefined, // giftRecipientId
      isGroupCollection ? chatId : undefined // groupChatId for group collections
    );
    
    // Send confirmation message with collection details
    const message = `
✅ Сбор "${title}" успешно создан!

ID сбора: ${collection.id}
Цель: ${targetAmount} руб.
${description ? `Описание: ${description}` : ''}

${isGroupCollection 
  ? 'Участники чата могут присоединиться к сбору, нажав на кнопку ниже.' 
  : 'Чтобы пригласить участников, поделитесь ID сбора с ними.'}
    `;
    
    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: "👀 Статус сбора", callback_data: `status:${collection.id}` }
        ]
      ]
    };
    
    if (isGroupCollection) {
      keyboard.inline_keyboard.push([
        { text: "👋 Присоединиться", callback_data: `join:${collection.id}` }
      ]);
    }
    
    keyboard.inline_keyboard.push([
      { text: "⬅️ Главное меню", callback_data: "back_to_main" }
    ]);
    
    return sendMessage(token, chatId, message, { replyMarkup: keyboard });
  } catch (error) {
    console.error('Ошибка при создании сбора:', error);
    return sendMessage(token, chatId, 'Произошла ошибка при создании сбора. Пожалуйста, попробуйте еще раз.');
  }
};
