
import { ensureUserExists } from '../collectionService';
import { getCollectionById, getUserById, addChatHistoryMessage } from '../storageService';
import { sendMessage } from '../telegramService';
import { v4 as uuidv4 } from 'uuid';

// Helper function to send messages to group chats
export const sendGroupMessage = async (token: string, chatId: number, text: string) => {
  return sendMessage(token, chatId, text);
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

// Base function for processing commands
export const processCommand = async (
  token: string,
  message: any
): Promise<string | null> => {
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
      response = `
Привет! Я бот для организации групповых сборов на подарки. 💝

В групповом чате я могу помочь организовать сбор средств на подарок:
- Создать новый сбор: /group_new_collection Название|Описание|Сумма|ID получателя|Срок(дни)
- Присоединиться к сбору: /join_collection ID_сбора
- Проверить статус: /collection_status ID_сбора

Для начала, создайте новый сбор с помощью команды /group_new_collection!
`;
    } else {
      response = `
Привет, ${firstName}! 👋

Я бот для организации групповых сборов на подарки. Вот что я умею:

- Создавать сборы на подарки
- Отслеживать взносы участников
- Голосовать за варианты подарков
- Помогать организаторам с напоминаниями

Основные команды:
/new_collection - Создать новый сбор
/join_collection - Присоединиться к сбору
/pay - Внести деньги в сбор
/status - Проверить статус сбора
/help - Показать все доступные команды

Попробуйте создать свой первый сбор с помощью команды /new_collection!
`;
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

/confirm_payment ID_сбора ID_пользователя
- Подтверждает платеж пользователя (только для организатора)

/add_gift_option ID_сбора|Название|Описание
- Добавить вариант подарка для голосования

/vote ID_сбора ID_варианта
- Проголосовать за вариант подарка

/collection_status ID_сбора
- Показывает подробный статус сбора

/confirm_gift ID_сбора
- Подтверждает вручение подарка (только для организатора)

/cancel ID_сбора
- Отменяет сбор (только для организатора)

/update_amount ID_сбора новая_сумма
- Изменяет целевую сумму сбора (только для организатора)

/send_reminders ID_сбора
- Отправляет напоминания участникам (только для организатора)

/status ID_сбора
- Показывает статус сбора
`;
  }
  
  // Log bot response to chat history
  if (response) {
    logChatMessage(chatId, undefined, response, false);
    console.log(`[Bot Response to ${firstName} (${userId}) in chat ${chatId}]: ${response.substring(0, 100)}...`);
  }
  
  return response;
};
