
import { ensureUserExists } from '../collectionService';
import { getCollectionById, getUserById } from '../storageService';
import { sendMessage } from '../telegramService';

// Helper function to send messages to group chats
export const sendGroupMessage = async (token: string, chatId: number, text: string) => {
  return sendMessage(token, chatId, text);
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
  
  if (!userId || !chatId) {
    return null;
  }
  
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
    handleSendReminders 
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
  if (text.startsWith('/new_collection')) {
    return handleNewCollection(token, userId, chatId, firstName, text, lastName, username);
  }
  
  if (text.startsWith('/group_new_collection')) {
    return handleGroupNewCollection(token, userId, chatId, firstName, text, lastName, username);
  }
  
  if (text.startsWith('/join_collection')) {
    return handleJoinCollection(token, userId, chatId, firstName, text, lastName, username);
  }
  
  if (text.startsWith('/pay')) {
    return handlePay(token, userId, chatId, firstName, text, lastName, username);
  }
  
  if (text.startsWith('/confirm_gift')) {
    return handleConfirmGift(token, userId, chatId, firstName, text, lastName, username);
  }
  
  if (text.startsWith('/cancel')) {
    return handleCancel(token, userId, chatId, firstName, text, lastName, username);
  }
  
  if (text.startsWith('/status')) {
    return handleStatus(token, userId, chatId, firstName, text, lastName, username);
  }
  
  if (text.startsWith('/collection_status')) {
    return handleCollectionStatus(token, userId, chatId, firstName, text, lastName, username);
  }
  
  if (text.startsWith('/add_gift_option')) {
    return handleAddGiftOption(token, userId, chatId, firstName, text, lastName, username);
  }
  
  if (text.startsWith('/vote')) {
    return handleVote(token, userId, chatId, firstName, text, lastName, username);
  }
  
  if (text.startsWith('/update_amount')) {
    return handleUpdateAmount(token, userId, chatId, firstName, text, lastName, username);
  }
  
  if (text.startsWith('/send_reminders')) {
    return handleSendReminders(token, userId, chatId, firstName, text, lastName, username);
  }
  
  if (text.startsWith('/help')) {
    return `
Доступные команды:

/new_collection Название|Описание|Сумма|ID получателя|ID участника1,ID участника2,...
- Создает новый сбор средств

/group_new_collection Название|Описание|Сумма|ID получателя|Срок(дни)
- Создает новый сбор в групповом чате

/join_collection ID_сбора
- Присоединиться к сбору

/pay ID_сбора сумма
- Регистрирует ваш взнос в сбор

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
  
  return null;
};
