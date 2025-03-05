
import { addPayment, notifyPaymentSuccess, ensureUserExists } from '../collectionService';
import { getCollectionById, getUserById } from '../storageService';
import { sendMessage } from '../telegramService';

// Обработка команды присоединения к сбору
export const handleJoinCollection = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  text: string,
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: /join_collection collection_id
    const collectionId = text.replace('/join_collection', '').trim();
    
    if (!collectionId) {
      return 'Ошибка: необходимо указать ID сбора.';
    }
    
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return 'Ошибка: сбор с указанным ID не найден.';
    }
    
    if (collection.status !== 'active' && collection.status !== 'pending') {
      return `Ошибка: сбор "${collection.title}" не активен или уже завершен.`;
    }
    
    // Проверяем, не является ли пользователь уже участником
    const isParticipant = collection.participants.some(p => p.userId === userId);
    
    if (isParticipant) {
      return `Вы уже являетесь участником сбора "${collection.title}".`;
    }
    
    // Создаем пользователя, если он еще не существует
    ensureUserExists(userId, firstName, chatId, username, lastName);
    
    // Добавляем пользователя как участника
    collection.participants.push({
      userId,
      collectionId,
      contribution: 0,
      hasPaid: false
    });
    
    // Обновляем информацию о коллекции
    collection.updatedAt = Date.now();
    await updateCollectionStatus(token, collectionId, collection.status);
    
    return `Вы успешно присоединились к сбору "${collection.title}"!\n\nДля внесения средств используйте команду:\n/pay ${collectionId} [сумма]`;
  } catch (error) {
    console.error('Ошибка при присоединении к сбору:', error);
    return 'Произошла ошибка при присоединении к сбору. Пожалуйста, попробуйте еще раз.';
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

// Import updateCollectionStatus for handleJoinCollection
import { updateCollectionStatus } from '../collectionService';
