import { v4 as uuidv4 } from 'uuid';
import { Collection, CollectionParticipant, CollectionStatus, User, GiftOption } from '@/types/collectionTypes';
import { getCollectionById, saveCollection, getUserById, saveUser, saveTransaction } from './storageService';
import { sendMessage } from './telegramService';

// Создание новой коллекции
export const createCollection = async (
  token: string,
  organizerId: number,
  title: string,
  description: string,
  targetAmount: number,
  participantIds: number[],
  giftRecipientId?: number,
  groupChatId?: number
): Promise<Collection> => {
  // Создаем участников с нулевыми взносами
  const participants: CollectionParticipant[] = participantIds.map(userId => ({
    userId,
    collectionId: '',  // ID заполнится после создания коллекции
    contribution: 0,
    hasPaid: false
  }));
  
  // Создаем новую коллекцию
  const collection: Collection = {
    id: uuidv4(),
    title,
    description,
    targetAmount,
    currentAmount: 0,
    status: 'pending',
    organizerId,
    giftRecipientId,
    participants,
    groupChatId,
    giftOptions: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  // Обновляем ID коллекции у участников
  collection.participants.forEach(p => {
    p.collectionId = collection.id;
  });
  
  // Сохраняем коллекцию
  saveCollection(collection);
  
  // Отправляем уведомления участникам
  await notifyParticipants(token, collection);
  
  return collection;
};

// Обновление статуса коллекции
export const updateCollectionStatus = async (
  token: string,
  collectionId: string,
  newStatus: CollectionStatus
): Promise<Collection | null> => {
  const collection = getCollectionById(collectionId);
  
  if (!collection) {
    return null;
  }
  
  collection.status = newStatus;
  collection.updatedAt = Date.now();
  
  // Сохраняем обновленную коллекцию
  saveCollection(collection);
  
  // Отправляем уведомления в зависимости от нового статуса
  if (newStatus === 'active') {
    await notifyCollectionActivated(token, collection);
  } else if (newStatus === 'completed') {
    await notifyCollectionCompleted(token, collection);
  } else if (newStatus === 'cancelled') {
    await notifyCollectionCancelled(token, collection);
  }
  
  return collection;
};

// Добавление оплаты
export const addPayment = async (
  token: string,
  collectionId: string,
  userId: number,
  amount: number
): Promise<boolean> => {
  const collection = getCollectionById(collectionId);
  
  if (!collection || collection.status !== 'active') {
    return false;
  }
  
  // Находим участника
  const participantIndex = collection.participants.findIndex(p => p.userId === userId);
  
  if (participantIndex === -1) {
    return false;
  }
  
  // Обновляем информацию об оплате
  collection.participants[participantIndex].contribution += amount;
  collection.participants[participantIndex].hasPaid = true;
  collection.currentAmount += amount;
  collection.updatedAt = Date.now();
  
  // Сохраняем информацию о транзакции
  saveTransaction({
    id: uuidv4(),
    collectionId,
    userId,
    amount,
    type: 'contribution',
    timestamp: Date.now()
  });
  
  // Сохраняем обновленную коллекцию
  saveCollection(collection);
  
  // Если вся сумма собрана, уведомляем организатора
  if (collection.currentAmount >= collection.targetAmount) {
    await notifyTargetReached(token, collection);
  }
  
  // Если есть групп��вой чат, отправляем уведомление
  if (collection.groupChatId) {
    const user = getUserById(userId);
    const userName = user ? `${user.firstName} ${user.lastName || ''}`.trim() : `Участник ${userId}`;
    
    const message = `
${userName} внес(ла) ${amount} руб. в сбор "${collection.title}"!

Уже собрано: ${collection.currentAmount} из ${collection.targetAmount} руб. (${Math.round(collection.currentAmount / collection.targetAmount * 100)}%)
    `;
    
    try {
      await sendMessage(token, collection.groupChatId, message);
    } catch (error) {
      console.error('Ошибка при отправке уведомления в групповой чат:', error);
    }
  }
  
  return true;
};

// Обновление срока сбора
export const updateCollectionDeadline = (
  collectionId: string,
  deadline: number
): boolean => {
  const collection = getCollectionById(collectionId);
  
  if (!collection) {
    return false;
  }
  
  collection.deadline = deadline;
  collection.updatedAt = Date.now();
  
  // Сохраняем обновленную коллекцию
  saveCollection(collection);
  
  return true;
};

// Обновление целевой суммы сбора
export const updateCollectionTargetAmount = (
  collectionId: string,
  targetAmount: number
): boolean => {
  const collection = getCollectionById(collectionId);
  
  if (!collection) {
    return false;
  }
  
  collection.targetAmount = targetAmount;
  collection.updatedAt = Date.now();
  
  // Сохраняем обновленную коллекцию
  saveCollection(collection);
  
  return true;
};

// Добавление варианта подарка
export const addGiftOption = (
  collectionId: string,
  title: string,
  description?: string
): GiftOption => {
  const collection = getCollectionById(collectionId);
  
  if (!collection) {
    throw new Error('Коллекция не найдена');
  }
  
  if (!collection.giftOptions) {
    collection.giftOptions = [];
  }
  
  const giftOption: GiftOption = {
    id: uuidv4(),
    collectionId,
    title,
    description,
    votes: 0
  };
  
  collection.giftOptions.push(giftOption);
  collection.updatedAt = Date.now();
  
  // Сохраняем обновленную коллекцию
  saveCollection(collection);
  
  return giftOption;
};

// Голосование за вариант подарка
export const voteForGiftOption = (
  collectionId: string,
  userId: number,
  optionId: string
): boolean => {
  const collection = getCollectionById(collectionId);
  
  if (!collection || !collection.giftOptions) {
    return false;
  }
  
  // Находим вариант подарка
  const optionIndex = collection.giftOptions.findIndex(opt => opt.id === optionId);
  
  if (optionIndex === -1) {
    return false;
  }
  
  // Находим участника
  const participantIndex = collection.participants.findIndex(p => p.userId === userId);
  
  if (participantIndex === -1) {
    return false;
  }
  
  // Если участник уже голосовал, снимаем предыдущий голос
  if (collection.participants[participantIndex].vote) {
    const prevOptionIndex = collection.giftOptions.findIndex(opt => opt.id === collection.participants[participantIndex].vote);
    
    if (prevOptionIndex !== -1 && collection.giftOptions[prevOptionIndex].votes > 0) {
      collection.giftOptions[prevOptionIndex].votes--;
    }
  }
  
  // Обновляем голос участника
  collection.participants[participantIndex].vote = optionId;
  
  // Увеличиваем количество голосов за вариант
  collection.giftOptions[optionIndex].votes++;
  
  collection.updatedAt = Date.now();
  
  // Сохраняем обновленную коллекцию
  saveCollection(collection);
  
  return true;
};

// Уведомление об успешной оплате
export const notifyPaymentSuccess = async (
  token: string,
  collectionId: string,
  userId: number
): Promise<boolean> => {
  const collection = getCollectionById(collectionId);
  const user = getUserById(userId);
  
  if (!collection || !user) {
    return false;
  }
  
  // Текст для уведомления
  const message = `
Спасибо за ваш взнос в сбор "${collection.title}"!
Внесено: ${collection.participants.find(p => p.userId === userId)?.contribution || 0} руб.
Всего собрано: ${collection.currentAmount} из ${collection.targetAmount} руб.
  `;
  
  try {
    await sendMessage(token, user.chatId, message);
    return true;
  } catch (error) {
    console.error('Ошибка при отправке уведомления об оплате:', error);
    return false;
  }
};

// Уведомление участников о создании коллекции
const notifyParticipants = async (token: string, collection: Collection): Promise<void> => {
  for (const participant of collection.participants) {
    const user = getUserById(participant.userId);
    
    if (user) {
      const message = `
Вас пригласили поучаствовать в сборе на подарок!

Название: ${collection.title}
${collection.description ? `Описание: ${collection.description}` : ''}
Цель: ${collection.targetAmount} руб.

Для внесения средств отправьте команду:
/pay ${collection.id} [сумма]
      `;
      
      try {
        await sendMessage(token, user.chatId, message);
      } catch (error) {
        console.error(`Ошибка при отправке уведомления пользователю ${user.id}:`, error);
      }
    }
  }
};

// Уведомление о активации коллекции
const notifyCollectionActivated = async (token: string, collection: Collection): Promise<void> => {
  for (const participant of collection.participants) {
    const user = getUserById(participant.userId);
    
    if (user) {
      const message = `
Сбор "${collection.title}" активирован!

Цель: ${collection.targetAmount} руб.
Уже собрано: ${collection.currentAmount} руб.

Для внесения средств отправьте команду:
/pay ${collection.id} [сумма]
      `;
      
      try {
        await sendMessage(token, user.chatId, message);
      } catch (error) {
        console.error(`Ошибка при отправке уведомления пользователю ${user.id}:`, error);
      }
    }
  }
};

// Уведомление о достижении цели
const notifyTargetReached = async (token: string, collection: Collection): Promise<void> => {
  const organizer = getUserById(collection.organizerId);
  
  if (organizer) {
    const message = `
Отличные новости! Цель сбора "${collection.title}" достигнута!

Собрано: ${collection.currentAmount} из ${collection.targetAmount} руб.

Для подтверждения вручения подарка используйте команду:
/confirm_gift ${collection.id}
    `;
    
    try {
      await sendMessage(token, organizer.chatId, message);
    } catch (error) {
      console.error(`Ошибка при отправке уведомления организатору ${organizer.id}:`, error);
    }
  }
};

// Уведомление о завершении коллекции
const notifyCollectionCompleted = async (token: string, collection: Collection): Promise<void> => {
  // Уведомляем всех участников
  for (const participant of collection.participants) {
    const user = getUserById(participant.userId);
    
    if (user) {
      const message = `
Поздравляем! Сбор "${collection.title}" успешно завершен!

Собрано: ${collection.currentAmount} руб.
Ваш вклад: ${participant.contribution} руб.

Спасибо за участие!
      `;
      
      try {
        await sendMessage(token, user.chatId, message);
      } catch (error) {
        console.error(`Ошибка при отправке уведомления пользователю ${user.id}:`, error);
      }
    }
  }
  
  // Уведомляем получателя подарка, если он указан
  if (collection.giftRecipientId) {
    const recipient = getUserById(collection.giftRecipientId);
    
    if (recipient) {
      const message = `
Сюрприз! Ваши друзья организовали для вас подарок!

"${collection.title}"

Желаем вам приятных впечатлений!
      `;
      
      try {
        await sendMessage(token, recipient.chatId, message);
      } catch (error) {
        console.error(`Ошибка при отправке уведомления получателю ${recipient.id}:`, error);
      }
    }
  }
};

// Уведомление об отмене коллекции
const notifyCollectionCancelled = async (token: string, collection: Collection): Promise<void> => {
  for (const participant of collection.participants) {
    const user = getUserById(participant.userId);
    
    if (user && participant.hasPaid) {
      const message = `
Сбор "${collection.title}" был отменен.

Ваш взнос ${participant.contribution} руб. будет возвращен.
Для получения инструкций по возврату, свяжитесь с организатором.
      `;
      
      try {
        await sendMessage(token, user.chatId, message);
      } catch (error) {
        console.error(`Ошибка при отправке уведомления пользователю ${user.id}:`, error);
      }
    }
  }
};

// Создание пользователя (при необходимости)
export const ensureUserExists = (
  userId: number,
  firstName: string,
  chatId: number,
  username?: string,
  lastName?: string
): User => {
  let user = getUserById(userId);
  
  if (!user) {
    user = {
      id: userId,
      firstName,
      lastName,
      username,
      chatId,
      createdAt: Date.now()
    };
    saveUser(user);
  }
  
  return user;
};
