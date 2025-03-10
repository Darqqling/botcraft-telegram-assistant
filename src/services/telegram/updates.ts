
/**
 * Functions for getting updates from Telegram
 */

import { TELEGRAM_API } from './config';

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
    
    console.log(`[TelegramService] Получено ${data.result.length} обновлений`);
    
    // Log update contents for debugging
    if (data.result.length > 0) {
      data.result.forEach((update: any) => {
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
    
    return data.result;
  } catch (error) {
    console.error('[TelegramService] Ошибка при получении обновлений:', error);
    throw error;
  }
};
