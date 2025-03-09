
import { ensureUserExists } from '../collectionService';
import { getCollectionById, getUserById, addChatHistoryMessage } from '../storageService';
import { sendMessage, InlineKeyboardMarkup } from '../telegramService';
import { v4 as uuidv4 } from 'uuid';

// Helper function to send messages to group chats
export const sendGroupMessage = async (token: string, chatId: number, text: string, replyMarkup?: InlineKeyboardMarkup) => {
  return sendMessage(token, chatId, text, { replyMarkup });
};

// Helper to log messages in chat history
const logChatMessage = (chatId: number, userId: number | undefined, messageText: string, isFromUser: boolean) => {
  const message = {
    id: uuidv4(),
    chatId,
    userId,
    messageText,
    isFromUser,
    timestamp: Date.now()
  };
  
  addChatHistoryMessage(message);
};

// Process callback queries from inline keyboard buttons
export const processCallbackQuery = async (
  token: string,
  callbackQuery: any
): Promise<string | null> => {
  const data = callbackQuery?.data;
  const userId = callbackQuery?.from?.id;
  const chatId = callbackQuery?.message?.chat?.id;
  const firstName = callbackQuery?.from?.first_name || 'User';
  const lastName = callbackQuery?.from?.last_name;
  const username = callbackQuery?.from?.username;
  
  if (!data || !userId || !chatId) {
    return null;
  }
  
  // Log incoming callback to chat history
  logChatMessage(chatId, userId, `Callback: ${data}`, true);
  
  // Import handlers from specific command modules
  const { 
    handleNewCollectionCallback,
    handleGroupNewCollectionCallback 
  } = await import('./collectionCreationCommands');
  
  const { 
    handleJoinCollectionCallback,
    handlePayCallback 
  } = await import('./participationCommands');
  
  const { 
    handleConfirmGiftCallback,
    handleCancelCallback,
    handleUpdateAmountCallback,
    handleSendRemindersCallback,
    handleConfirmPaymentCallback,
    handleRemindLaterCallback
  } = await import('./organizerCommands');
  
  const { 
    handleStatusCallback,
    handleCollectionStatusCallback 
  } = await import('./statusCommands');
  
  const { 
    handleAddGiftOptionCallback,
    handleVoteCallback 
  } = await import('./giftOptionCommands');
  
  // Process callback based on data
  let response: string | null = null;
  
  // Format: action:param1:param2:...
  const parts = data.split(':');
  const action = parts[0];
  
  switch (action) {
    case 'new_collection':
      response = await handleNewCollectionCallback(token, userId, chatId, firstName, parts, lastName, username);
      break;
    case 'group_new':
      response = await handleGroupNewCollectionCallback(token, userId, chatId, firstName, parts, lastName, username);
      break;
    case 'join':
      response = await handleJoinCollectionCallback(token, userId, chatId, firstName, parts, lastName, username);
      break;
    case 'pay':
      response = await handlePayCallback(token, userId, chatId, firstName, parts, lastName, username);
      break;
    case 'confirm_pay':
      response = await handleConfirmPaymentCallback(token, userId, chatId, firstName, parts, lastName, username);
      break;
    case 'status':
      response = await handleCollectionStatusCallback(token, userId, chatId, firstName, parts, lastName, username);
      break;
    case 'vote':
      response = await handleVoteCallback(token, userId, chatId, firstName, parts, lastName, username);
      break;
    case 'add_gift':
      response = await handleAddGiftOptionCallback(token, userId, chatId, firstName, parts, lastName, username);
      break;
    case 'confirm_gift':
      response = await handleConfirmGiftCallback(token, userId, chatId, firstName, parts, lastName, username);
      break;
    case 'cancel':
      response = await handleCancelCallback(token, userId, chatId, firstName, parts, lastName, username);
      break;
    case 'remind_later':
      response = await handleRemindLaterCallback(token, userId, chatId, firstName, parts, lastName, username);
      break;
    default:
      response = "Неизвестное действие. Пожалуйста, используйте доступные команды.";
      break;
  }
  
  // Log bot response to chat history
  if (response) {
    logChatMessage(chatId, undefined, response, false);
    console.log(`[Bot Response to ${firstName} (${userId}) in chat ${chatId}]: ${response.substring(0, 100)}...`);
  }
  
  return response;
};

// Base function for processing commands
export const processCommand = async (
  token: string,
  message: any
): Promise<string | null> => {
  // Process callback queries
  if (message?.callback_query) {
    return processCallbackQuery(token, message.callback_query);
  }
  
  const text = message?.text;
  
  if (!text || typeof text !== 'string') {
    return null;
  }
  
  const userId = message?.from?.id;
  const chatId = message?.chat?.id;
  const firstName = message?.from?.first_name || 'User';
  const lastName = message?.from?.last_name;
  const username = message?.from?.username;
  const isGroupChat = message?.chat?.type === 'group' || message?.chat?.type === 'supergroup';
  
  if (!userId || !chatId) {
    return null;
  }
  
  // Log incoming command to chat history
  logChatMessage(chatId, userId, text, true);
  
  // Import handlers from specific command modules
  const { 
    handleNewCollection,
    handleGroupNewCollection 
  } = await import('./collectionCreationCommands');
  
  const { 
    handleJoinCollection,
    handlePay 
  } = await import('./participationCommands');
  
  const { 
    handleConfirmGift,
    handleCancel,
    handleUpdateAmount,
    handleSendReminders,
    handleConfirmPayment 
  } = await import('./organizerCommands');
  
  const { 
    handleStatus,
    handleCollectionStatus 
  } = await import('./statusCommands');
  
  const { 
    handleAddGiftOption,
    handleVote 
  } = await import('./giftOptionCommands');
  
  // Process command based on text
  let response: string | null = null;
  
  if (text.startsWith('/start')) {
    if (isGroupChat) {
      const inlineKeyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
          [
            { text: "Создать сбор", callback_data: "group_new:start" }
          ]
        ]
      };
      
      response = `
Привет! Я бот для организации групповых сборов на подарки. 💝

В групповом чате я могу помочь организовать сбор средств на подарок:
- Создать новый сбор: /group_new_collection Название|Описание|Сумма|ID получателя|Срок(дни)
- Присоединиться к сбору: /join_collection ID_сбора
- Проверить статус: /collection_status ID_сбора

Для начала, создайте новый сбор с помощью кнопки ниже!
`;
      
      await sendMessage(token, chatId, response, { replyMarkup: inlineKeyboard });
      return null;
    } else {
      const inlineKeyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
          [
            { text: "Создать новый сбор", callback_data: "new_collection:start" }
          ],
          [
            { text: "Мои сборы", callback_data: "status:all" }
          ],
          [
            { text: "Помощь", callback_data: "help" }
          ]
        ]
      };
      
      response = `
Привет, ${firstName}! 👋

Я бот для организации групповых сборов на подарки. Вот что я умею:

- Создавать сборы на подарки
- Отслеживать взносы участников
- Голосовать за варианты подарков
- Помогать организаторам с напоминаниями

Выберите действие с помощью кнопок ниже:
`;
      
      await sendMessage(token, chatId, response, { replyMarkup: inlineKeyboard });
      return null;
    }
  } else if (text.startsWith('/new_collection')) {
    response = await handleNewCollection(token, userId, chatId, firstName, text, lastName, username);
  } else if (text.startsWith('/group_new_collection')) {
    response = await handleGroupNewCollection(token, userId, chatId, firstName, text, lastName, username);
  } else if (text.startsWith('/join_collection')) {
    response = await handleJoinCollection(token, userId, chatId, firstName, text, lastName, username);
  } else if (text.startsWith('/pay')) {
    response = await handlePay(token, userId, chatId, firstName, text, lastName, username);
  } else if (text.startsWith('/confirm_payment')) {
    response = await handleConfirmPayment(token, userId, chatId, firstName, text, lastName, username);
  } else if (text.startsWith('/confirm_gift')) {
    response = await handleConfirmGift(token, userId, chatId, firstName, text, lastName, username);
  } else if (text.startsWith('/cancel')) {
    response = await handleCancel(token, userId, chatId, firstName, text, lastName, username);
  } else if (text.startsWith('/status')) {
    response = await handleStatus(token, userId, chatId, firstName, text, lastName, username);
  } else if (text.startsWith('/collection_status')) {
    response = await handleCollectionStatus(token, userId, chatId, firstName, text, lastName, username);
  } else if (text.startsWith('/add_gift_option')) {
    response = await handleAddGiftOption(token, userId, chatId, firstName, text, lastName, username);
  } else if (text.startsWith('/vote')) {
    response = await handleVote(token, userId, chatId, firstName, text, lastName, username);
  } else if (text.startsWith('/update_amount')) {
    response = await handleUpdateAmount(token, userId, chatId, firstName, text, lastName, username);
  } else if (text.startsWith('/send_reminders')) {
    response = await handleSendReminders(token, userId, chatId, firstName, text, lastName, username);
  } else if (text.startsWith('/help')) {
    const inlineKeyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: "Создать сбор", callback_data: "new_collection:start" }
        ],
        [
          { text: "Мои сборы", callback_data: "status:all" }
        ]
      ]
    };
    
    response = `
Доступные команды:

/new_collection Название|Описание|Сумма|ID получателя|ID участника1,ID участника2,...
- Создает новый сбор средств

/group_new_collection Название|Описание|Сумма|ID получателя|Срок(дни)
- Создает новый сбор в групповом чате

/join_collection ID_сбора
- Присоединиться к сбору

/pay ID_сбора сумма
- Регистрирует ваш взнос в сбор

/collection_status ID_сбора
- Показывает подробный статус сбора

/vote ID_сбора ID_варианта
- Проголосовать за вариант подарка

Выберите действие:
`;
    
    await sendMessage(token, chatId, response, { replyMarkup: inlineKeyboard });
    return null;
  }
  
  // Log bot response to chat history
  if (response) {
    logChatMessage(chatId, undefined, response, false);
    console.log(`[Bot Response to ${firstName} (${userId}) in chat ${chatId}]: ${response.substring(0, 100)}...`);
  }
  
  return response;
};
