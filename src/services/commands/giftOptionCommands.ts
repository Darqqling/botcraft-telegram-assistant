
import { addGiftOption, voteForGiftOption, ensureUserExists } from '../collectionService';
import { getCollectionById, getUserById } from '../storageService';
import { sendGroupMessage, sendMessage } from './baseCommandHandler';
import { InlineKeyboardMarkup } from '../telegramService';

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
      const inlineKeyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
          [
            { text: "Голосовать", callback_data: `vote:${collectionId}:${giftOption.id}` }
          ]
        ]
      };
      
      const message = `
Добавлен новый вариант подарка для сбора "${collection.title}":

"${title}"
${description ? `${description}\n` : ''}

Голосуйте за этот вариант:
      `;
      
      try {
        await sendMessage(token, collection.groupChatId, message, { replyMarkup: inlineKeyboard });
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
        await sendMessage(token, collection.groupChatId, message);
      } catch (error) {
        console.error('Ошибка при отправке уведомления в групповой чат:', error);
      }
    }
    
    // Показываем другие варианты и количество голосов
    let voteResultMessage = `Ваш голос за вариант "${option?.title}" в сборе "${collection.title}" учтен.\n\nРезультаты голосования:`;
    
    if (collection.giftOptions) {
      collection.giftOptions.forEach(opt => {
        voteResultMessage += `\n- "${opt.title}": ${opt.votes} голос(ов)`;
      });
    }
    
    return voteResultMessage;
  } catch (error) {
    console.error('Ошибка при голосовании:', error);
    return 'Произошла ошибка при голосовании. Пожалуйста, попробуйте еще раз.';
  }
};

// Обработка callback'а голосования
export const handleVoteCallback = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  parts: string[],
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: vote:collection_id:option_id
    if (parts.length < 3) {
      return 'Ошибка: неверный формат данных для голосования.';
    }
    
    const collectionId = parts[1];
    const optionId = parts[2];
    
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      return 'Ошибка: сбор с указанным ID не найден.';
    }
    
    // Проверяем, является ли пользователь участником
    const isParticipant = collection.participants.some(p => p.userId === userId);
    
    if (!isParticipant) {
      // Предлагаем присоединиться к сбору
      const joinKeyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
          [
            { text: "Присоединиться к сбору", callback_data: `join:${collectionId}` }
          ]
        ]
      };
      
      await sendMessage(token, chatId, `Вы не являетесь участником сбора "${collection.title}". Присоединитесь, чтобы голосовать:`, 
        { replyMarkup: joinKeyboard });
      
      return '';
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
        await sendMessage(token, collection.groupChatId, message);
      } catch (error) {
        console.error('Ошибка при отправке уведомления в групповой чат:', error);
      }
    }
    
    // Показываем другие варианты и количество голосов с кнопками для голосования
    let voteResultMessage = `Ваш голос за вариант "${option?.title}" в сборе "${collection.title}" учтен.\n\nРезультаты голосования:`;
    
    const voteButtons: InlineKeyboardMarkup = {
      inline_keyboard: []
    };
    
    if (collection.giftOptions) {
      collection.giftOptions.forEach(opt => {
        voteResultMessage += `\n- "${opt.title}": ${opt.votes} голос(ов)`;
        
        // Добавляем кнопку для каждого варианта, кроме того, за который уже проголосовали
        if (opt.id !== optionId) {
          voteButtons.inline_keyboard.push([
            { text: `Голосовать за "${opt.title}"`, callback_data: `vote:${collectionId}:${opt.id}` }
          ]);
        }
      });
    }
    
    // Добавляем кнопку для возврата к статусу сбора
    voteButtons.inline_keyboard.push([
      { text: "Статус сбора", callback_data: `status:${collectionId}` }
    ]);
    
    await sendMessage(token, chatId, voteResultMessage, { replyMarkup: voteButtons });
    
    return '';
  } catch (error) {
    console.error('Ошибка при обработке голосования:', error);
    return 'Произошла ошибка при голосовании. Пожалуйста, попробуйте еще раз.';
  }
};

// Обработка callback'а добавления варианта подарка
export const handleAddGiftOptionCallback = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  parts: string[],
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: add_gift:collection_id
    if (parts.length < 2) {
      return 'Ошибка: неверный формат данных для добавления варианта.';
    }
    
    const collectionId = parts[1];
    
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
    
    // Отправляем инструкции по добавлению варианта
    await sendMessage(token, chatId, `Для добавления варианта подарка к сбору "${collection.title}", отправьте команду:\n\n/add_gift_option ${collectionId}|Название варианта|Описание (опционально)`);
    
    return '';
  } catch (error) {
    console.error('Ошибка при обработке запроса на добавление варианта:', error);
    return 'Произошла ошибка. Пожалуйста, попробуйте еще раз.';
  }
};
