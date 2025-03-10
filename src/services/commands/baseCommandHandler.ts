
// Import the telegramService for API calls
import { sendMessage as telegramSendMessage, InlineKeyboardMarkup } from '../telegramService';

// Export sendMessage so it can be imported by other command handlers
export const sendMessage = async (
  botToken: string,
  chatId: number,
  text: string,
  options?: any
): Promise<any> => {
  // Use the telegram service to send the message
  return telegramSendMessage(botToken, chatId, text, options);
};

// Add sendGroupMessage which is used in participationCommands.ts
export const sendGroupMessage = async (
  botToken: string,
  chatId: number,
  text: string,
  options?: any
): Promise<any> => {
  // Implementation goes here - same as sendMessage for now
  return sendMessage(botToken, chatId, text, options);
};

// Handle start command by showing main menu buttons
export const handleStartCommand = async (
  token: string,
  chatId: number,
  userId: number
): Promise<any> => {
  const welcomeMessage = `
👋 Добро пожаловать в Подарочный Бот!

Я помогу вам организовать сбор средств на подарок или другое совместное мероприятие.
Выберите действие из меню ниже:
  `;

  const mainMenu: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "🔹 Создать новый сбор", callback_data: "new_collection" }
      ],
      [
        { text: "🔹 Посмотреть мои сборы", callback_data: "my_collections" }
      ],
      [
        { text: "🔹 Как это работает?", callback_data: "how_it_works" }
      ],
      [
        { text: "🔹 Помощь", callback_data: "help" }
      ]
    ]
  };

  return sendMessage(token, chatId, welcomeMessage, { replyMarkup: mainMenu });
};

// Handle help command
export const handleHelpCommand = async (
  token: string,
  chatId: number
): Promise<any> => {
  const helpMessage = `
📚 Помощь по использованию бота:

Основные команды:
/start - Запустить бота и показать главное меню
/help - Показать это сообщение

Для создания нового сбора нажмите кнопку "Создать новый сбор" в главном меню.
Для просмотра ваших активных сборов нажмите "Посмотреть мои сборы".

Если у вас возникли проблемы, напишите /start чтобы вернуться в главное меню.
  `;

  const backButton: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "⬅️ Вернуться в главное меню", callback_data: "back_to_main" }
      ]
    ]
  };

  return sendMessage(token, chatId, helpMessage, { replyMarkup: backButton });
};

// Handle how_it_works command
export const handleHowItWorksCommand = async (
  token: string,
  chatId: number
): Promise<any> => {
  const howItWorksMessage = `
🔍 Как работает Подарочный Бот:

1️⃣ Создайте новый сбор, указав название, описание и целевую сумму
2️⃣ Пригласите участников, отправив им ссылку или добавив бота в групповой чат
3️⃣ Участники вносят свои взносы через бота
4️⃣ Когда целевая сумма собрана, организатор может завершить сбор
5️⃣ Все участники получают уведомление о завершении сбора

Бот помогает отслеживать статус сбора и упрощает координацию между участниками.
  `;

  const backButton: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "⬅️ Вернуться в главное меню", callback_data: "back_to_main" }
      ]
    ]
  };

  return sendMessage(token, chatId, howItWorksMessage, { replyMarkup: backButton });
};

// Handle my_collections command
export const handleMyCollectionsCommand = async (
  token: string,
  chatId: number,
  userId: number
): Promise<any> => {
  // This will be implemented to fetch and display the user's collections
  const collectionsMessage = `
📋 Ваши активные сборы:

У вас пока нет активных сборов. 
Создайте новый сбор, нажав на кнопку "Создать новый сбор" в главном меню.
  `;

  const backButton: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "⬅️ Вернуться в главное меню", callback_data: "back_to_main" }
      ]
    ]
  };

  return sendMessage(token, chatId, collectionsMessage, { replyMarkup: backButton });
};

// Handle back to main menu command
export const handleBackToMainCommand = async (
  token: string,
  chatId: number,
  userId: number
): Promise<any> => {
  return handleStartCommand(token, chatId, userId);
};

// Handle payment options command
export const handlePaymentOptionsCommand = async (
  token: string,
  chatId: number,
  collectionId: string
): Promise<any> => {
  const paymentMessage = `
💳 Выберите способ оплаты:

Сейчас оплата через бота временно недоступна. Вы можете перевести деньги организатору напрямую и затем нажать кнопку "Я оплатил".
  `;

  const paymentOptions: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "✅ Я оплатил", callback_data: `i_paid:${collectionId}` }
      ],
      [
        { text: "⬅️ Назад", callback_data: `pay:${collectionId}` }
      ]
    ]
  };

  return sendMessage(token, chatId, paymentMessage, { replyMarkup: paymentOptions });
};

// Handle "I paid" confirmation
export const handleIPaidCommand = async (
  token: string,
  chatId: number,
  userId: number,
  firstName: string,
  collectionId: string,
  amount: number
): Promise<any> => {
  // This will send confirmation to the user
  const confirmationMessage = `
✅ Спасибо за ваш взнос!

Ваше сообщение о передаче ${amount} руб. отправлено организатору для подтверждения.
После подтверждения организатором, ваш взнос будет учтен в сборе.
  `;

  const backButton: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "⬅️ Вернуться в главное меню", callback_data: "back_to_main" }
      ]
    ]
  };

  await sendMessage(token, chatId, confirmationMessage, { replyMarkup: backButton });

  // TODO: Send notification to the organizer with confirmation button
  // This part will be implemented in the payment handling
  
  return { ok: true };
};

export const processCommand = (
  command: string,
  chatId: number,
  userId: number,
  botToken: string
): Promise<any> => {
  if (command === '/start') {
    return handleStartCommand(botToken, chatId, userId);
  } else if (command === '/help') {
    return handleHelpCommand(botToken, chatId);
  } else if (command === '/how_it_works') {
    return handleHowItWorksCommand(botToken, chatId);
  } else if (command === '/my_collections') {
    return handleMyCollectionsCommand(botToken, chatId, userId);
  } else {
    // For other commands, use existing handlers
    // Default response if no handler matches
    return sendMessage(botToken, chatId, "Неизвестная команда. Отправьте /help для получения списка доступных команд.");
  }
};

export const processCallbackQuery = (
  callbackQuery: any,
  botToken: string
): Promise<any> => {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const callbackData = callbackQuery.data;
  const firstName = callbackQuery.from.first_name;
  
  // Parse the callback data
  const parts = callbackData.split(':');
  const action = parts[0];
  
  // Handle different callback actions
  switch (action) {
    case 'new_collection':
      return handleNewCollectionCallback(callbackQuery, botToken);
    case 'group_new_collection':
      return handleGroupNewCollectionCallback(callbackQuery, botToken);
    case 'my_collections':
      return handleMyCollectionsCommand(botToken, chatId, userId);
    case 'how_it_works':
      return handleHowItWorksCommand(botToken, chatId);
    case 'help':
      return handleHelpCommand(botToken, chatId);
    case 'back_to_main':
      return handleBackToMainCommand(botToken, chatId, userId);
    case 'join':
      return handleJoinCollectionCallback(botToken, userId, chatId, firstName, parts);
    case 'pay':
      return handlePayCallback(botToken, userId, chatId, firstName, parts);
    case 'pay_amount':
      // Handle payment with predefined amount
      if (parts.length >= 3) {
        const collectionId = parts[1];
        const amount = parseFloat(parts[2]);
        return handleIPaidCommand(botToken, chatId, userId, firstName, collectionId, amount);
      }
      break;
    case 'payment_options':
      if (parts.length >= 2) {
        const collectionId = parts[1];
        return handlePaymentOptionsCommand(botToken, chatId, collectionId);
      }
      break;
    case 'i_paid':
      if (parts.length >= 2) {
        const collectionId = parts[1];
        // For now, assuming a default amount
        return handleIPaidCommand(botToken, chatId, userId, firstName, collectionId, 1000);
      }
      break;
    case 'status':
      return handleStatusCallback(callbackQuery, botToken);
    case 'collection_status':
      return handleCollectionStatusCallback(callbackQuery, botToken);
    case 'send_reminders':
      return handleSendRemindersCallback(callbackQuery, botToken);
    default:
      return sendMessage(botToken, chatId, "Неизвестное действие. Попробуйте еще раз.");
  }
  
  // Default response if no handler matches
  return sendMessage(botToken, chatId, "Неизвестное действие. Попробуйте еще раз.");
};

// Import the command handlers without creating a circular dependency
import * as collectionCreationCommands from './collectionCreationCommands';
import * as participation from './participation'; // Update the import to use the new directory structure
import * as organizerCommands from './organizerCommands';
import * as statusCommands from './statusCommands';
import * as giftOptionCommands from './giftOptionCommands';

// These functions need to be added to handle callback data
export const handleNewCollectionCallback = collectionCreationCommands.handleNewCollectionCallback;
export const handleGroupNewCollectionCallback = collectionCreationCommands.handleGroupNewCollectionCallback;
export const handleSendRemindersCallback = organizerCommands.handleSendRemindersCallback;
export const handleStatusCallback = statusCommands.handleStatusCallback;
export const handleCollectionStatusCallback = statusCommands.handleCollectionStatusCallback;
export const { handleJoinCollectionCallback } = participation;
export const { handlePayCallback } = participation;
