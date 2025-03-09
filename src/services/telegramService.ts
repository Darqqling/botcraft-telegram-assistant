
/**
 * Сервис для работы с Telegram Bot API
 */

// Базовый URL для API Telegram
const TELEGRAM_API = 'https://api.telegram.org/bot';

// Тип для информации о боте
export interface BotInfo {
  id: number;
  first_name: string;
  username: string;
  can_join_groups: boolean;
  can_read_all_group_messages: boolean;
  supports_inline_queries: boolean;
}

/**
 * Получить информацию о боте
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

/**
 * Получить обновления для бота
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
    
    // Логирование содержимого обновлений для отладки
    if (data.result.length > 0) {
      data.result.forEach((update: any) => {
        const message = update.message || update.callback_query?.message;
        if (message) {
          const chatId = message.chat.id;
          const chatType = message.chat.type;
          const userId = message.from?.id;
          const text = message.text || update.callback_query?.data || '[no text]';
          
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

/**
 * Отправить сообщение
 */
export const sendMessage = async (token: string, chatId: number | string, text: string) => {
  try {
    console.log(`[TelegramService] Отправка сообщения в чат ${chatId}...`);
    
    const response = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });
    
    const data = await response.json();
    
    if (!data.ok) {
      const errorMsg = `[TelegramService] Ошибка отправки сообщения: ${data.description || 'Неизвестная ошибка'}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log(`[TelegramService] Сообщение успешно отправлено в чат ${chatId}`);
    return data.result;
  } catch (error) {
    console.error(`[TelegramService] Ошибка при отправке сообщения в чат ${chatId}:`, error);
    throw error;
  }
};
