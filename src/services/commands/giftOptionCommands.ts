import { v4 as uuidv4 } from 'uuid';
import { Collection, GiftOption } from '@/types/collectionTypes';
import { sendMessage } from './baseCommandHandler';
import { getCollectionById, saveCollection } from '../storageService';

// Обработка команды добавления варианта подарка
export const handleAddGiftOption = async (
  chatId: number,
  userId: number,
  botToken: string,
  args: string
): Promise<boolean> => {
  try {
    // Разбираем аргументы команды
    const [collectionId, title, description] = args.split('|').map(arg => arg.trim());
    
    if (!collectionId || !title) {
      await sendMessage(
        botToken,
        chatId,
        'Ошибка: Неверный формат команды. Используйте:\n/add_gift_option [ID сбора]|[Название]|[Описание]'
      );
      return false;
    }
    
    // Получаем коллекцию по ID
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      await sendMessage(
        botToken,
        chatId,
        `Ошибка: Сбор с ID ${collectionId} не найден.`
      );
      return false;
    }
    
    // Проверяем, является ли пользователь организатором сбора
    if (collection.organizerId !== userId) {
      await sendMessage(
        botToken,
        chatId,
        'Ошибка: Только организатор сбора может добавлять варианты подарков.'
      );
      return false;
    }
    
    // Проверяем статус коллекции
    if (collection.status !== 'active') {
      await sendMessage(
        botToken,
        chatId,
        `Ошибка: Нельзя добавить вариант подарка для сбора со статусом "${collection.status}".`
      );
      return false;
    }
    
    // Создаем новый вариант подарка
    const newGiftOption: GiftOption = {
      id: uuidv4(),
      collectionId: collection.id,
      title,
      description,
      votes: 0
    };
    
    // Добавляем вариант подарка в коллекцию
    collection.giftOptions.push(newGiftOption);
    collection.updatedAt = Date.now();
    
    // Сохраняем обновленную коллекцию
    saveCollection(collection);
    
    // Отправляем сообщение об успешном добавлении
    await sendMessage(
      botToken,
      chatId,
      `Вариант подарка "${title}" успешно добавлен в сбор "${collection.title}".\n\nУчастники теперь могут голосовать за этот вариант с помощью команды:\n/vote ${collection.id} ${newGiftOption.id}`
    );
    
    // Если сбор связан с групповым чатом, отправляем уведомление и туда
    if (collection.groupChatId) {
      await sendMessage(
        botToken,
        collection.groupChatId,
        `В сборе "${collection.title}" добавлен новый вариант подарка: "${title}".\n\nЧтобы проголосовать за этот вариант, используйте команду:\n/vote ${collection.id} ${newGiftOption.id}`
      );
    }
    
    return true;
  } catch (error) {
    console.error('Ошибка при добавлении варианта подарка:', error);
    await sendMessage(
      botToken,
      chatId,
      'Произошла ошибка при добавлении варианта подарка. Пожалуйста, попробуйте позже.'
    );
    return false;
  }
};

// Обработка команды голосования за вариант подарка
export const handleVote = async (
  chatId: number,
  userId: number,
  botToken: string,
  args: string
): Promise<boolean> => {
  try {
    // Разбираем аргументы команды
    const [collectionId, giftOptionId] = args.split(' ').map(arg => arg.trim());
    
    if (!collectionId || !giftOptionId) {
      await sendMessage(
        botToken,
        chatId,
        'Ошибка: Неверный формат команды. Используйте:\n/vote [ID сбора] [ID варианта подарка]'
      );
      return false;
    }
    
    // Получаем коллекцию по ID
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      await sendMessage(
        botToken,
        chatId,
        `Ошибка: Сбор с ID ${collectionId} не найден.`
      );
      return false;
    }
    
    // Проверяем, является ли пользователь участником сбора
    const participant = collection.participants.find(p => p.userId === userId);
    
    if (!participant) {
      await sendMessage(
        botToken,
        chatId,
        `Ошибка: Вы не являетесь участником сбора "${collection.title}". Сначала присоединитесь к сбору с помощью команды:\n/join_collection ${collectionId}`
      );
      return false;
    }
    
    // Проверяем статус коллекции
    if (collection.status !== 'active') {
      await sendMessage(
        botToken,
        chatId,
        `Ошибка: Нельзя голосовать в сборе со статусом "${collection.status}".`
      );
      return false;
    }
    
    // Проверяем, существует ли вариант подарка
    const giftOption = collection.giftOptions.find(option => option.id === giftOptionId);
    
    if (!giftOption) {
      await sendMessage(
        botToken,
        chatId,
        `Ошибка: Вариант подарка с ID ${giftOptionId} не найден в этом сборе.`
      );
      return false;
    }
    
    // Если пользователь уже голосовал за другой вариант, снимаем его голос
    if (participant.vote && participant.vote !== giftOptionId) {
      const previousOption = collection.giftOptions.find(option => option.id === participant.vote);
      if (previousOption && previousOption.votes > 0) {
        previousOption.votes--;
      }
    }
    
    // Если пользователь голосует за тот же вариант, снимаем голос
    if (participant.vote === giftOptionId) {
      participant.vote = undefined;
      giftOption.votes--;
      
      await sendMessage(
        botToken,
        chatId,
        `Вы отменили свой голос за вариант "${giftOption.title}" в сборе "${collection.title}".`
      );
    } else {
      // Иначе голосуем за новый вариант
      participant.vote = giftOptionId;
      giftOption.votes++;
      
      await sendMessage(
        botToken,
        chatId,
        `Вы успешно проголосовали за вариант "${giftOption.title}" в сборе "${collection.title}".\n\nТекущее количество голосов: ${giftOption.votes}`
      );
    }
    
    // Обновляем время последнего изменения коллекции
    collection.updatedAt = Date.now();
    
    // Сохраняем обновленную коллекцию
    saveCollection(collection);
    
    return true;
  } catch (error) {
    console.error('Ошибка при голосовании за вариант подарка:', error);
    await sendMessage(
      botToken,
      chatId,
      'Произошла ошибка при голосовании. Пожалуйста, попробуйте позже.'
    );
    return false;
  }
};

// Получение списка вариантов подарков для сбора
export const handleListGiftOptions = async (
  chatId: number,
  userId: number,
  botToken: string,
  collectionId: string
): Promise<boolean> => {
  try {
    // Получаем коллекцию по ID
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      await sendMessage(
        botToken,
        chatId,
        `Ошибка: Сбор с ID ${collectionId} не найден.`
      );
      return false;
    }
    
    // Проверяем, есть ли варианты подарков
    if (!collection.giftOptions || collection.giftOptions.length === 0) {
      await sendMessage(
        botToken,
        chatId,
        `В сборе "${collection.title}" пока нет вариантов подарков.\n\nЕсли вы организатор, вы можете добавить вариант с помощью команды:\n/add_gift_option ${collectionId}|Название|Описание`
      );
      return true;
    }
    
    // Формируем сообщение со списком вариантов
    let message = `Варианты подарков для сбора "${collection.title}":\n\n`;
    
    collection.giftOptions.forEach((option, index) => {
      message += `${index + 1}. "${option.title}" - ${option.votes} голосов\n`;
      if (option.description) {
        message += `   ${option.description}\n`;
      }
      message += `   ID: ${option.id}\n\n`;
    });
    
    // Добавляем инструкцию по голосованию
    message += `Чтобы проголосовать за вариант, используйте команду:\n/vote ${collectionId} [ID варианта]`;
    
    // Отправляем сообщение
    await sendMessage(
      botToken,
      chatId,
      message
    );
    
    return true;
  } catch (error) {
    console.error('Ошибка при получении списка вариантов подарков:', error);
    await sendMessage(
      botToken,
      chatId,
      'Произошла ошибка при получении списка вариантов подарков. Пожалуйста, попробуйте позже.'
    );
    return false;
  }
};

// Удаление варианта подарка (только для организатора)
export const handleRemoveGiftOption = async (
  chatId: number,
  userId: number,
  botToken: string,
  args: string
): Promise<boolean> => {
  try {
    // Разбираем аргументы команды
    const [collectionId, giftOptionId] = args.split(' ').map(arg => arg.trim());
    
    if (!collectionId || !giftOptionId) {
      await sendMessage(
        botToken,
        chatId,
        'Ошибка: Неверный формат команды. Используйте:\n/remove_gift_option [ID сбора] [ID варианта подарка]'
      );
      return false;
    }
    
    // Получаем коллекцию по ID
    const collection = getCollectionById(collectionId);
    
    if (!collection) {
      await sendMessage(
        botToken,
        chatId,
        `Ошибка: Сбор с ID ${collectionId} не найден.`
      );
      return false;
    }
    
    // Проверяем, является ли пользователь организатором сбора
    if (collection.organizerId !== userId) {
      await sendMessage(
        botToken,
        chatId,
        'Ошибка: Только организатор сбора может удалять варианты подарков.'
      );
      return false;
    }
    
    // Проверяем статус коллекции
    if (collection.status !== 'active') {
      await sendMessage(
        botToken,
        chatId,
        `Ошибка: Нельзя удалить вариант подарка для сбора со статусом "${collection.status}".`
      );
      return false;
    }
    
    // Проверяем, существует ли вариант подарка
    const giftOptionIndex = collection.giftOptions.findIndex(option => option.id === giftOptionId);
    
    if (giftOptionIndex === -1) {
      await sendMessage(
        botToken,
        chatId,
        `Ошибка: Вариант подарка с ID ${giftOptionId} не найден в этом сборе.`
      );
      return false;
    }
    
    // Получаем название варианта перед удалением
    const giftOptionTitle = collection.giftOptions[giftOptionIndex].title;
    
    // Удаляем вариант подарка
    collection.giftOptions.splice(giftOptionIndex, 1);
    
    // Сбрасываем голоса участников за этот вариант
    collection.participants.forEach(participant => {
      if (participant.vote === giftOptionId) {
        participant.vote = undefined;
      }
    });
    
    // Обновляем время последнего изменения коллекции
    collection.updatedAt = Date.now();
    
    // Сохраняем обновленную коллекцию
    saveCollection(collection);
    
    // Отправляем сообщение об успешном удалении
    await sendMessage(
      botToken,
      chatId,
      `Вариант подарка "${giftOptionTitle}" успешно удален из сбора "${collection.title}".`
    );
    
    // Если сбор связан с групповым чатом, отправляем уведомление и туда
    if (collection.groupChatId) {
      await sendMessage(
        botToken,
        collection.groupChatId,
        `В сборе "${collection.title}" удален вариант подарка: "${giftOptionTitle}".`
      );
    }
    
    return true;
  } catch (error) {
    console.error('Ошибка при удалении варианта подарка:', error);
    await sendMessage(
      botToken,
      chatId,
      'Произошла ошибка при удалении варианта подарка. Пожалуйста, попробуйте позже.'
    );
    return false;
  }
};
