
import { addGiftOption, voteForGiftOption, ensureUserExists } from '../collectionService';
import { getCollectionById, getUserById } from '../storageService';
import { sendGroupMessage } from './baseCommandHandler';

// Обработка команды добавления варианта подарка
export const handleAddGiftOption = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  text: string,
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: /add_gift_option collection_id|Title|Description
    const parts = text.replace('/add_gift_option', '').trim().split('|');
    
    if (parts.length < 2) {
      return 'Ошибка: неверный формат команды. Используйте:\n/add_gift_option ID_сбора|Название|Описание';
    }
    
    const collectionId = parts[0].trim();
    const title = parts[1].trim();
    const description = parts.length > 2 ? parts[2].trim() : '';
    
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return 'Ошибка: сбор с указанным ID не найден.';
    }
    
    // Проверяем, является ли пользователь участником или организатором
    const isParticipant = collection.participants.some(p => p.userId === userId);
    const isOrganizer = collection.organizerId === userId;
    
    if (!isParticipant && !isOrganizer) {
      return `Ошибка: вы не являетесь участником сбора "${collection.title}".`;
    }
    
    // Создаем пользователя, если он еще не существует
    ensureUserExists(userId, firstName, chatId, username, lastName);
    
    // Добавляем вариант подарка
    const giftOption = addGiftOption(collectionId, title, description);
    
    // Отправляем уведомление в групповой чат, если он есть
    if (collection.groupChatId) {
      const message = `
Добавлен новый вариант подарка для сбора "${collection.title}":

"${title}"
${description ? `${description}\n` : ''}
Для голосования используйте команду:
/vote ${collectionId} ${giftOption.id}
      `;
      
      try {
        await sendGroupMessage(token, collection.groupChatId, message);
      } catch (error) {
        console.error('Ошибка при отправке уведомления в групповой чат:', error);
      }
    }
    
    return `Вариант подарка "${title}" успешно добавлен к сбору "${collection.title}".`;
  } catch (error) {
    console.error('Ошибка при добавлении варианта подарка:', error);
    return 'Произошла ошибка при добавлении варианта подарка. Пожалуйста, попробуйте еще раз.';
  }
};

// Обработка команды голосования за вариант подарка
export const handleVote = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  text: string,
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: /vote collection_id option_id
    const parts = text.replace('/vote', '').trim().split(' ');
    
    if (parts.length < 2) {
      return 'Ошибка: неверный формат команды. Используйте:\n/vote ID_сбора ID_варианта';
    }
    
    const collectionId = parts[0].trim();
    const optionId = parts[1].trim();
    
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return 'Ошибка: сбор с указанным ID не найден.';
    }
    
    // Проверяем, является ли пользователь участником
    const isParticipant = collection.participants.some(p => p.userId === userId);
    
    if (!isParticipant) {
      return `Ошибка: вы не являетесь участником сбора "${collection.title}".`;
    }
    
    // Проверяем, существует ли такой вариант
    if (!collection.giftOptions || !collection.giftOptions.find(opt => opt.id === optionId)) {
      return 'Ошибка: указанный вариант подарка не найден.';
    }
    
    // Создаем пользователя, если он еще не существует
    ensureUserExists(userId, firstName, chatId, username, lastName);
    
    // Голосуем за вариант
    voteForGiftOption(collectionId, userId, optionId);
    
    // Находим вариант для вывода его названия
    const option = collection.giftOptions.find(opt => opt.id === optionId);
    
    // Отправляем уведомление в групповой чат, если он есть
    if (collection.groupChatId) {
      const message = `${firstName} ${lastName || ''} проголосовал(а) за вариант "${option?.title}".`;
      
      try {
        await sendGroupMessage(token, collection.groupChatId, message);
      } catch (error) {
        console.error('Ошибка при отправке уведомления в групповой чат:', error);
      }
    }
    
    return `Ваш голос за вариант "${option?.title}" в сборе "${collection.title}" учтен.`;
  } catch (error) {
    console.error('Ошибка при голосовании:', error);
    return 'Произошла ошибка при голосовании. Пожалуйста, попробуйте еще раз.';
  }
};
