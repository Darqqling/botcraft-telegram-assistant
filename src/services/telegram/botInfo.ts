
/**
 * Functions for getting bot information
 */

import { TELEGRAM_API } from './config';
import { BotInfo } from './types';

/**
 * Get information about the bot
 */
export const getMe = async (token: string): Promise<BotInfo> => {
  try {
    console.log('[TelegramService] Запрос информации о боте...');
    const response = await fetch(`${TELEGRAM_API}${token}/getMe`);
    const data = await response.json();
    
    if (!data.ok) {
      const errorMsg = `[TelegramService] Ошибка получения информации о боте: ${data.description || 'Неизвестная ошибка'}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log(`[TelegramService] Получена информация о боте: ${data.result.first_name} (@${data.result.username})`);
    return data.result;
  } catch (error) {
    console.error('[TelegramService] Ошибка при получении информации о боте:', error);
    throw error;
  }
};
