
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
    const response = await fetch(`${TELEGRAM_API}${token}/getMe`);
    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(data.description || 'Ошибка получения информации о боте');
    }
    
    return data.result;
  } catch (error) {
    console.error('Ошибка при получении информации о боте:', error);
    throw error;
  }
};

/**
 * Получить обновления для бота
 */
export const getUpdates = async (token: string, offset = 0, limit = 100) => {
  try {
    const response = await fetch(`${TELEGRAM_API}${token}/getUpdates?offset=${offset}&limit=${limit}`);
    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(data.description || 'Ошибка получения обновлений');
    }
    
    return data.result;
  } catch (error) {
    console.error('Ошибка при получении обновлений:', error);
    throw error;
  }
};

/**
 * Отправить сообщение
 */
export const sendMessage = async (token: string, chatId: number | string, text: string) => {
  try {
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
      throw new Error(data.description || 'Ошибка отправки сообщения');
    }
    
    return data.result;
  } catch (error) {
    console.error('Ошибка при отправке сообщения:', error);
    throw error;
  }
};
