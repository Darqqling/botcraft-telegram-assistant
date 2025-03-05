
import { ensureUserExists } from '../collectionService';
import { getCollectionById, getUserById } from '../storageService';

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

// Обработка команды проверки статуса сбора (расширенная версия)
export const handleCollectionStatus = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  text: string,
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: /collection_status collection_id
    const collectionId = text.replace('/collection_status', '').trim();
    
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

    if (collection.deadline) {
      const daysLeft = Math.ceil((collection.deadline - Date.now()) / (24 * 60 * 60 * 1000));
      message += `Осталось дней: ${daysLeft > 0 ? daysLeft : 'Срок истек'}\n`;
    }
    
    // Информация о вариантах подарка
    if (collection.giftOptions && collection.giftOptions.length > 0) {
      message += '\nВарианты подарка:\n';
      
      // Сортируем по количеству голосов (от большего к меньшему)
      const sortedOptions = [...collection.giftOptions].sort((a, b) => b.votes - a.votes);
      
      sortedOptions.forEach((option, index) => {
        message += `${index + 1}. "${option.title}" - ${option.votes} голосов\n`;
      });
    }
    
    // Для организатора показываем больше информации
    if (isOrganizer) {
      message += '\nУчастники:\n';
      
      collection.participants.forEach((participant, index) => {
        const user = getUserById(participant.userId);
        const name = user ? `${user.firstName} ${user.lastName || ''}`.trim() : `Участник ${participant.userId}`;
        
        message += `${index + 1}. ${name} - ${participant.contribution} руб. (${participant.hasPaid ? 'оплачено' : 'не оплачено'})`;
        
        if (participant.vote) {
          const votedOption = collection.giftOptions?.find(opt => opt.id === participant.vote);
          if (votedOption) {
            message += ` - голос за "${votedOption.title}"`;
          }
        }
        
        message += '\n';
      });
    }
    
    return message;
  } catch (error) {
    console.error('Ошибка при запросе статуса сбора:', error);
    return 'Произошла ошибка при запросе статуса сбора. Пожалуйста, попробуйте еще раз.';
  }
};
