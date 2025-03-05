
import { v4 as uuidv4 } from 'uuid';
import { createCollection, updateCollectionStatus, ensureUserExists, updateCollectionDeadline } from '../collectionService';
import { sendGroupMessage } from './baseCommandHandler';

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

// Обработка команды создания сбора в групповом чате
export const handleGroupNewCollection = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  text: string,
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: /group_new_collection Title|Description|TargetAmount|RecipientId|Deadline(days)
    const parts = text.replace('/group_new_collection', '').trim().split('|');
    
    if (parts.length < 3) {
      return 'Ошибка: неверный формат команды. Используйте:\n/group_new_collection Название|Описание|Сумма|ID получателя|Срок(дни)';
    }
    
    const title = parts[0].trim();
    const description = parts[1].trim();
    const targetAmount = parseFloat(parts[2].trim());
    const recipientId = parts[3].trim() ? parseInt(parts[3].trim()) : undefined;
    const deadlineDays = parts[4]?.trim() ? parseInt(parts[4].trim()) : 7; // По умолчанию 7 дней
    
    // Проверка валидности данных
    if (!title) {
      return 'Ошибка: название сбора обязательно.';
    }
    
    if (isNaN(targetAmount) || targetAmount <= 0) {
      return 'Ошибка: сумма должна быть положительным числом.';
    }
    
    // Создаем пользователя-организатора, если он еще не существует
    ensureUserExists(userId, firstName, chatId, username, lastName);
    
    // Рассчитываем срок (дни в миллисекундах)
    const deadline = Date.now() + (deadlineDays * 24 * 60 * 60 * 1000);
    
    // Создаем коллекцию с привязкой к групповому чату
    const collection = await createCollection(
      token,
      userId,
      title,
      description,
      targetAmount,
      [], // Участники будут добавляться через /join_collection
      recipientId,
      chatId // groupChatId
    );
    
    // Устанавливаем срок
    updateCollectionDeadline(collection.id, deadline);
    
    // Активируем коллекцию сразу
    await updateCollectionStatus(token, collection.id, 'active');
    
    return `Сбор "${title}" успешно создан в этом чате!\n\nЦель: ${targetAmount} руб.\nСрок: ${new Date(deadline).toLocaleDateString()}\n\nДля участия отправьте команду:\n/join_collection ${collection.id}`;
  } catch (error) {
    console.error('Ошибка при создании коллекции в групповом чате:', error);
    return 'Произошла ошибка при создании сбора. Пожалуйста, попробуйте еще раз.';
  }
};
