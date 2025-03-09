
import { ensureUserExists } from '../../collectionService';
import { getCollectionById, saveCollection } from '../../storageService';
import { sendMessage } from '../baseCommandHandler';
import { InlineKeyboardMarkup } from '@/services/telegramService';
import { updateCollectionStatus } from '../../collectionService';

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
    
    // Создаем клавиатуру с кнопками для оплаты и просмотра статуса
    const inlineKeyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: "Внести средства", callback_data: `pay:${collectionId}` }
        ],
        [
          { text: "Статус сбора", callback_data: `status:${collectionId}` }
        ]
      ]
    };
    
    await sendMessage(token, chatId, `Вы успешно присоединились к сбору "${collection.title}"!`, 
      { replyMarkup: inlineKeyboard });
    
    return '';
  } catch (error) {
    console.error('Ошибка при присоединении к сбору:', error);
    return 'Произошла ошибка при присоединении к сбору. Пожалуйста, попробуйте еще раз.';
  }
};

// Обработка callback'а для присоединения к сбору
export const handleJoinCollectionCallback = async (
  token: string,
  userId: number,
  chatId: number,
  firstName: string,
  parts: string[],
  lastName?: string,
  username?: string
): Promise<string> => {
  try {
    // Формат: join:collection_id
    if (parts.length < 2) {
      return 'Ошибка: неверный формат данных для присоединения к сбору.';
    }
    
    const collectionId = parts[1];
    
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
    
    // Создаем клавиатуру с кнопками для оплаты и просмотра статуса
    const inlineKeyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: "Внести средства", callback_data: `pay:${collectionId}` }
        ],
        [
          { text: "Статус сбора", callback_data: `status:${collectionId}` }
        ]
      ]
    };
    
    await sendMessage(token, chatId, `Вы успешно присоединились к сбору "${collection.title}"!`, 
      { replyMarkup: inlineKeyboard });
    
    return '';
  } catch (error) {
    console.error('Ошибка при присоединении к сбору:', error);
    return 'Произошла ошибка при присоединении к сбору. Пожалуйста, попробуйте еще раз.';
  }
};
