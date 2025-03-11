
import { sendMessage } from './baseCommandHandler';
import { InlineKeyboardMarkup } from '@/services/telegramService';
import { createCollection, ensureUserExists } from '../collectionService';
import { isGroupChat } from './core/menuCommands';

// Track ongoing collection creation sessions by chat ID
const ongoingCreationSessions = new Map();

// Handle the callback for creating a new collection in personal chat
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
Как назовём сбор?
  `;
  
  const cancelButton: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "❌ Отмена", callback_data: "back_to_main" }
      ]
    ]
  };
  
  // Start tracking this collection creation session
  ongoingCreationSessions.set(chatId, {
    stage: 'waiting_for_title',
    createdBy: userId,
    isGroupCollection: false
  });
  
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
  
  // Check if this is a group chat
  if (!isGroupChat(chatId)) {
    return sendMessage(
      botToken,
      chatId,
      `🚫 Создание сборов доступно только в групповых чатах. Пожалуйста, добавьте бота в групповой чат и используйте команду /new_collection там.`
    );
  }
  
  // Ensure user exists in our system
  ensureUserExists(userId, firstName, chatId);
  
  // Initial step for group collection creation
  const message = `
Как назовём сбор?
  `;
  
  const cancelButton: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "❌ Отмена", callback_data: "back_to_main" }
      ]
    ]
  };
  
  // Start tracking this collection creation session
  ongoingCreationSessions.set(chatId, {
    stage: 'waiting_for_title',
    createdBy: userId,
    isGroupCollection: true
  });
  
  return sendMessage(
    botToken,
    chatId,
    message,
    { replyMarkup: cancelButton }
  );
};

// Handle text messages in the context of collection creation
export const handleCollectionCreationMessage = async (
  message: any,
  botToken: string
): Promise<any> => {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const text = message.text;
  
  // Check if there's an ongoing creation session for this chat
  const session = ongoingCreationSessions.get(chatId);
  if (!session) {
    // No ongoing session, ignore this message
    return null;
  }
  
  // Ensure only the creator can continue the creation process
  if (session.createdBy !== userId) {
    // This is not the creator, ignore
    return null;
  }
  
  // Process based on the current stage
  switch (session.stage) {
    case 'waiting_for_title':
      // Save the title and ask for description
      session.title = text;
      session.stage = 'waiting_for_description';
      
      return sendMessage(
        botToken,
        chatId,
        "Опишите, что хотите купить.",
        { replyMarkup: { inline_keyboard: [[{ text: "❌ Отмена", callback_data: "back_to_main" }]] } }
      );
      
    case 'waiting_for_description':
      // Save the description and ask for amount
      session.description = text;
      session.stage = 'waiting_for_amount';
      
      return sendMessage(
        botToken,
        chatId,
        "Какую сумму хотите накопить?",
        { replyMarkup: { inline_keyboard: [[{ text: "❌ Отмена", callback_data: "back_to_main" }]] } }
      );
      
    case 'waiting_for_amount':
      // Try to parse the amount
      const amount = parseFloat(text.replace(/[^\d.,]/g, '').replace(',', '.'));
      
      if (isNaN(amount) || amount <= 0) {
        return sendMessage(
          botToken,
          chatId,
          "Пожалуйста, введите корректную сумму (только цифры).",
          { replyMarkup: { inline_keyboard: [[{ text: "❌ Отмена", callback_data: "back_to_main" }]] } }
        );
      }
      
      // Save the amount and ask for deadline
      session.amount = amount;
      session.stage = 'waiting_for_deadline';
      
      return sendMessage(
        botToken,
        chatId,
        "До какого числа хотите накопить? Введите дату в формате DD.MM.YYYY",
        { replyMarkup: { inline_keyboard: [[{ text: "❌ Отмена", callback_data: "back_to_main" }]] } }
      );
      
    case 'waiting_for_deadline':
      // Try to parse the date (DD.MM.YYYY)
      let deadline;
      try {
        const [day, month, year] = text.split('.').map(Number);
        deadline = new Date(year, month - 1, day);
        
        if (isNaN(deadline.getTime())) {
          throw new Error("Invalid date");
        }
      } catch (e) {
        return sendMessage(
          botToken,
          chatId,
          "Пожалуйста, введите корректную дату в формате DD.MM.YYYY (например, 31.12.2023).",
          { replyMarkup: { inline_keyboard: [[{ text: "❌ Отмена", callback_data: "back_to_main" }]] } }
        );
      }
      
      // Save the deadline and finalize the collection
      session.deadline = deadline.getTime();
      
      // Create the collection
      try {
        const collection = await createCollection(
          botToken,
          userId,
          session.title,
          session.description,
          session.amount,
          [], // participantIds - empty initially
          undefined, // giftRecipientId
          session.isGroupCollection ? chatId : undefined // groupChatId for group collections
        );
        
        // Clear the session
        ongoingCreationSessions.delete(chatId);
        
        // Format the date for display
        const deadlineDate = new Date(session.deadline);
        const formattedDeadline = `${deadlineDate.getDate().toString().padStart(2, '0')}.${(deadlineDate.getMonth() + 1).toString().padStart(2, '0')}.${deadlineDate.getFullYear()}`;
        
        // Send confirmation message
        const confirmMessage = `
Сбор создан! 🎁 ${session.title}, цель – ${session.amount}₽, дедлайн – ${formattedDeadline}.
        `;
        
        const keyboard: InlineKeyboardMarkup = {
          inline_keyboard: [
            [
              session.isGroupCollection 
                ? { text: "Начать сбор", callback_data: `start_collection:${collection.id}` }
                : { text: "Подтвердить оплату", callback_data: `confirm_payment:${collection.id}` }
            ],
            [
              { text: "⬅️ Главное меню", callback_data: "back_to_main" }
            ]
          ]
        };
        
        return sendMessage(botToken, chatId, confirmMessage, { replyMarkup: keyboard });
      } catch (error) {
        console.error('Ошибка при создании сбора:', error);
        ongoingCreationSessions.delete(chatId);
        return sendMessage(botToken, chatId, 'Произошла ошибка при создании сбора. Пожалуйста, попробуйте еще раз.');
      }
      
    default:
      // Unknown stage, reset the session
      ongoingCreationSessions.delete(chatId);
      return sendMessage(
        botToken,
        chatId,
        "Что-то пошло не так. Пожалуйста, начните создание сбора заново.",
        { replyMarkup: { inline_keyboard: [[{ text: "⬅️ Главное меню", callback_data: "back_to_main" }]] } }
      );
  }
};

// Handle the start collection button
export const handleStartCollectionCallback = async (
  callbackQuery: any,
  botToken: string
): Promise<any> => {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const firstName = callbackQuery.from.first_name;
  
  // Parse the collection ID from the callback data
  const parts = callbackQuery.data.split(':');
  const collectionId = parts[1];
  
  // Get the collection details
  try {
    const collection = require('../storageService').getCollectionById(collectionId);
    
    if (!collection) {
      return sendMessage(botToken, chatId, "Ошибка: сбор не найден.");
    }
    
    // Update collection status to active
    await require('../collectionService').updateCollectionStatus(botToken, collectionId, 'active');
    
    // Send announcement to the group chat
    const message = `
🆕 Новый сбор! 
🎁 ${collection.title} – ${collection.description}
🎯 Цель: ${collection.targetAmount}₽ 
📅 Дедлайн: ${new Date(collection.deadline).toLocaleDateString('ru-RU')} 
💳 Нажмите «Участвовать» или откажитесь от участия.
    `;
    
    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: "✅ Участвовать", callback_data: `join:${collectionId}` },
          { text: "🚫 Отказаться", callback_data: `decline:${collectionId}` }
        ]
      ]
    };
    
    return sendMessage(botToken, chatId, message, { replyMarkup: keyboard });
  } catch (error) {
    console.error('Ошибка при запуске сбора:', error);
    return sendMessage(botToken, chatId, "Произошла ошибка при запуске сбора. Пожалуйста, попробуйте еще раз.");
  }
};

// Add more collection-related handlers here
export const checkCollectionCreationState = (chatId: number) => {
  return ongoingCreationSessions.get(chatId);
};

// Create collection with provided details (legacy method, kept for compatibility)
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
