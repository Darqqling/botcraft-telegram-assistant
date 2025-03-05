import { v4 as uuidv4 } from 'uuid';
import { createCollection, updateCollectionStatus, addPayment, notifyPaymentSuccess, ensureUserExists } from './collectionService';
import { getCollectionById, getUserById } from './storageService';

// Обработка команды создания новой коллекции
export const handleNewCollection = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  text: string,
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: /new_collection Title|Description|TargetAmount|RecipientId|Participant1,Participant2,...
    const parts = text.replace('/new_collection', '').trim().split('|');
    
    if (parts.length < 4) {
      return 'Ошибка: неверный формат команды. Используйте:\n/new_collection Название|Описание|Сумма|ID получателя|ID участника1,ID участника2,...';
    }
    
    const title = parts[0].trim();
    const description = parts[1].trim();
    const targetAmount = parseFloat(parts[2].trim());
    const recipientId = parts[3].trim() ? parseInt(parts[3].trim()) : undefined;
    const participantIds = parts[4]?.trim().split(',').map(id => parseInt(id.trim())) || [];
    
    // Проверка валидности данных
    if (!title) {
      return 'Ошибка: название сбора обязательно.';
    }
    
    if (isNaN(targetAmount) || targetAmount <= 0) {
      return 'Ошибка: сумма должна быть положительным числом.';
    }
    
    // Создаем пользователя-организатора, если он еще не существует
    ensureUserExists(userId, firstName, chatId, username, lastName);
    
    // Создаем коллекцию
    const collection = await createCollection(
      token,
      userId,
      title,
      description,
      targetAmount,
      participantIds,
      recipientId
    );
    
    // Активируем коллекцию сразу
    await updateCollectionStatus(token, collection.id, 'active');
    
    return `Сбор "${title}" успешно создан и активирован!\nID сбора: ${collection.id}`;
  } catch (error) {
    console.error('Ошибка при создании коллекции:', error);
    return 'Произошла ошибка при создании сбора. Пожалуйста, попробуйте еще раз.';
  }
};

// Обработка команды внесения оплаты
export const handlePay = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  text: string,
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: /pay collection_id amount
    const parts = text.replace('/pay', '').trim().split(' ');
    
    if (parts.length < 2) {
      return 'Ошибка: неверный формат команды. Используйте:\n/pay ID_сбора сумма';
    }
    
    const collectionId = parts[0].trim();
    const amount = parseFloat(parts[1].trim());
    
    // Проверка валидности данных
    if (!collectionId) {
      return 'Ошибка: ID сбора обязателен.';
    }
    
    if (isNaN(amount) || amount <= 0) {
      return 'Ошибка: сумма должна быть положительным числом.';
    }
    
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return 'Ошибка: сбор с указанным ID не найден.';
    }
    
    if (collection.status !== 'active') {
      return `Ошибка: сбор "${collection.title}" не активен.`;
    }
    
    // Проверяем, есть ли пользователь среди участников
    const isParticipant = collection.participants.some(p => p.userId === userId);
    
    if (!isParticipant) {
      return `Ошибка: вы не являетесь участником сбора "${collection.title}".`;
    }
    
    // Создаем пользователя, если он еще не существует
    ensureUserExists(userId, firstName, chatId, username, lastName);
    
    // Добавляем платеж
    const success = await addPayment(token, collectionId, userId, amount);
    
    if (!success) {
      return 'Произошла ошибка при обработке платежа. Пожалуйста, попробуйте еще раз.';
    }
    
    // Отправляем уведомление об успешной оплате
    await notifyPaymentSuccess(token, collectionId, userId);
    
    return `Платеж на сумму ${amount} руб. успешно зарегистрирован.\nСпасибо за участие в сборе "${collection.title}"!`;
  } catch (error) {
    console.error('Ошибка при обработке платежа:', error);
    return 'Произошла ошибка при обработке платежа. Пожалуйста, попробуйте еще раз.';
  }
};

// Обработка команды подтверждения вручения подарка
export const handleConfirmGift = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  text: string,
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: /confirm_gift collection_id
    const collectionId = text.replace('/confirm_gift', '').trim();
    
    if (!collectionId) {
      return 'Ошибка: необходимо указать ID сбора.';
    }
    
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return 'Ошибка: сбор с указанным ID не найден.';
    }
    
    if (collection.organizerId !== userId) {
      return 'Ошибка: только организатор сбора может подтвердить вручение подарка.';
    }
    
    if (collection.status !== 'active') {
      return `Ошибка: сбор "${collection.title}" не находится в активном состоянии.`;
    }
    
    // Создаем пользователя, если он еще не существует
    ensureUserExists(userId, firstName, chatId, username, lastName);
    
    // Завершаем коллекцию
    await updateCollectionStatus(token, collectionId, 'completed');
    
    return `Сбор "${collection.title}" успешно завершен. Уведомления отправлены всем участникам.`;
  } catch (error) {
    console.error('Ошибка при подтверждении вручения подарка:', error);
    return 'Произошла ошибка при подтверждении вручения подарка. Пожалуйста, попробуйте еще раз.';
  }
};

// Обработка команды отмены сбора
export const handleCancel = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  text: string,
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: /cancel collection_id
    const collectionId = text.replace('/cancel', '').trim();
    
    if (!collectionId) {
      return 'Ошибка: необходимо указать ID сбора.';
    }
    
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return 'Ошибка: сбор с указанным ID не найден.';
    }
    
    if (collection.organizerId !== userId) {
      return 'Ошибка: только организатор сбора может отменить сбор.';
    }
    
    if (collection.status !== 'active' && collection.status !== 'pending') {
      return `Ошибка: сбор "${collection.title}" не может быть отменен (уже завершен или отменен).`;
    }
    
    // Создаем пользователя, если он еще не существует
    ensureUserExists(userId, firstName, chatId, username, lastName);
    
    // Отменяем коллекцию
    await updateCollectionStatus(token, collectionId, 'cancelled');
    
    return `Сбор "${collection.title}" отменен. Уведомления о возврате средств отправлены участникам.`;
  } catch (error) {
    console.error('Ошибка при отмене сбора:', error);
    return 'Произошла ошибка при отмене сбора. Пожалуйста, попробуйте еще раз.';
  }
};

// Обработка команды просмотра статуса сбора
export const handleStatus = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  text: string,
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: /status collection_id
    const collectionId = text.replace('/status', '').trim();
    
    if (!collectionId) {
      return 'Ошибка: необходимо указать ID сбора.';
    }
    
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return 'Ошибка: сбор с указанным ID не найден.';
    }
    
    // Проверяем, является ли пользователь участником или организатором
    const isParticipant = collection.participants.some(p => p.userId === userId);
    const isOrganizer = collection.organizerId === userId;
    
    if (!isParticipant && !isOrganizer) {
      return `Ошибка: у вас нет доступа к сбору "${collection.title}".`;
    }
    
    // Формируем детали о сборе
    const statusText = {
      'pending': 'Ожидает',
      'active': 'Активен',
      'completed': 'Завершен',
      'cancelled': 'Отменен'
    }[collection.status];
    
    let message = `
Информация о сборе "${collection.title}"

Статус: ${statusText}
Собрано: ${collection.currentAmount} из ${collection.targetAmount} руб. (${Math.round(collection.currentAmount / collection.targetAmount * 100)}%)
`;

    // Для организатора показываем больше информации
    if (isOrganizer) {
      message += '\nУчастники:\n';
      
      collection.participants.forEach((participant, index) => {
        const user = getUserById(participant.userId);
        const name = user ? `${user.firstName} ${user.lastName || ''}`.trim() : `Участник ${participant.userId}`;
        
        message += `${index + 1}. ${name} - ${participant.contribution} руб. (${participant.hasPaid ? 'оплачено' : 'не оплачено'})\n`;
      });
    }
    
    return message;
  } catch (error) {
    console.error('Ошибка при запросе статуса сбора:', error);
    return 'Произошла ошибка при запросе статуса сбора. Пожалуйста, попробуйте еще раз.';
  }
};

// Обработка любой команды
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
  
  if (text.startsWith('/new_collection')) {
    return handleNewCollection(token, userId, chatId, firstName, text, lastName, username);
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
  
  if (text.startsWith('/help')) {
    return `
Доступные команды:

/new_collection Название|Описание|Сумма|ID получателя|ID участника1,ID участника2,...
- Создает новый сбор средств

/pay ID_сбора сумма
- Регистрирует ваш взнос в сбор

/confirm_gift ID_сбора
- Подтверждает вручение подарка (только для организатора)

/cancel ID_сбора
- Отменяет сбор (только для организатора)

/status ID_сбора
- Показывает текущий статус сбора
`;
  }
  
  return null;
};
