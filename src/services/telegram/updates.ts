/**
 * Functions for getting updates from Telegram
 */

import { TELEGRAM_API } from './config';

// Track processed message IDs to prevent duplicate processing
const processedMessageIds = new Set<number>();
const processedCallbackQueryIds = new Set<string>();

// Limit the size of processed message sets to prevent memory leaks
const MAX_PROCESSED_IDS = 1000;

// Clear old message IDs periodically (every hour)
setInterval(() => {
  if (processedMessageIds.size > MAX_PROCESSED_IDS) {
    // Convert to array, sort by time (if we had timestamps), and keep only recent ones
    const oldestToRemove = processedMessageIds.size - MAX_PROCESSED_IDS;
    const idsArray = Array.from(processedMessageIds);
    for (let i = 0; i < oldestToRemove; i++) {
      processedMessageIds.delete(idsArray[i]);
    }
  }
  
  if (processedCallbackQueryIds.size > MAX_PROCESSED_IDS) {
    const oldestToRemove = processedCallbackQueryIds.size - MAX_PROCESSED_IDS;
    const idsArray = Array.from(processedCallbackQueryIds);
    for (let i = 0; i < oldestToRemove; i++) {
      processedCallbackQueryIds.delete(idsArray[i]);
    }
  }
}, 3600000); // 1 hour

/**
 * Get updates for the bot
 */
export const getUpdates = async (token: string, offset = 0, limit = 100) => {
  try {
    console.log(`[TelegramService] Запрос обновлений для бота (offset: ${offset}, limit: ${limit})...`);
    const response = await fetch(`${TELEGRAM_API}${token}/getUpdates?offset=${offset}&limit=${limit}`);
    const data = await response.json();
    
    if (!data.ok) {
      const errorMsg = `[TelegramService] Ошибка получения обновлений: ${data.description || 'Неизвестная ошибка'}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    // Filter out already processed messages and callback queries
    const filteredUpdates = data.result.filter((update: any) => {
      // Check for message updates
      if (update.message && update.message.message_id) {
        if (processedMessageIds.has(update.message.message_id)) {
          console.log(`[TelegramService] Пропуск уже обработанного сообщения: ${update.message.message_id}`);
          return false;
        }
        processedMessageIds.add(update.message.message_id);
        return true;
      }
      
      // Check for callback query updates
      if (update.callback_query && update.callback_query.id) {
        if (processedCallbackQueryIds.has(update.callback_query.id)) {
          console.log(`[TelegramService] Пропуск уже обработанного callback query: ${update.callback_query.id}`);
          return false;
        }
        processedCallbackQueryIds.add(update.callback_query.id);
        return true;
      }
      
      return true; // Process other types of updates
    });
    
    console.log(`[TelegramService] Получено ${data.result.length} обновлений, отфильтровано ${data.result.length - filteredUpdates.length} дубликатов`);
    
    // Log update contents for debugging (only for non-duplicate updates)
    if (filteredUpdates.length > 0) {
      filteredUpdates.forEach((update: any) => {
        const message = update.message || update.callback_query?.message;
        const callbackData = update.callback_query?.data;
        
        if (message) {
          const chatId = message.chat.id;
          const chatType = message.chat.type;
          const userId = message.from?.id || update.callback_query?.from?.id;
          const text = message.text || callbackData || '[no text]';
          
          console.log(`[TelegramService] Новое сообщение: ${chatType} ${chatId}, User: ${userId}, Text: ${text.substring(0, 100)}`);
        }
      });
    }
    
    return filteredUpdates;
  } catch (error) {
    console.error('[TelegramService] Ошибка при получении обновлений:', error);
    throw error;
  }
};
