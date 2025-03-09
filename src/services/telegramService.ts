
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

// Типы для клавиатур и кнопок
export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface ReplyKeyboardButton {
  text: string;
  request_contact?: boolean;
  request_location?: boolean;
}

export interface ReplyKeyboardMarkup {
  keyboard: ReplyKeyboardButton[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
  persistent?: boolean;
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

/**
 * Отправить сообщение
 */
export const sendMessage = async (
  token: string, 
  chatId: number | string, 
  text: string, 
  options: {
    replyMarkup?: InlineKeyboardMarkup | ReplyKeyboardMarkup;
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    disableWebPagePreview?: boolean;
  } = {}
) => {
  try {
    console.log(`[TelegramService] Отправка сообщения в чат ${chatId}...`);
    
    const { replyMarkup, parseMode = 'HTML', disableWebPagePreview = false } = options;
    
    const payload: any = {
      chat_id: chatId,
      text: text,
      parse_mode: parseMode,
      disable_web_page_preview: disableWebPagePreview,
    };
    
    if (replyMarkup) {
      payload.reply_markup = JSON.stringify(replyMarkup);
    }
    
    const response = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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

/**
 * Ответить на callback query (уведомление при нажатии кнопки)
 */
export const answerCallbackQuery = async (
  token: string,
  callbackQueryId: string,
  options: {
    text?: string;
    showAlert?: boolean;
    url?: string;
    cacheTime?: number;
  } = {}
) => {
  try {
    console.log(`[TelegramService] Ответ на callback query ${callbackQueryId}...`);
    
    const payload: any = {
      callback_query_id: callbackQueryId,
      ...options
    };
    
    const response = await fetch(`${TELEGRAM_API}${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    
    if (!data.ok) {
      const errorMsg = `[TelegramService] Ошибка ответа на callback query: ${data.description || 'Неизвестная ошибка'}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log(`[TelegramService] Успешный ответ на callback query ${callbackQueryId}`);
    return data.result;
  } catch (error) {
    console.error(`[TelegramService] Ошибка при ответе на callback query ${callbackQueryId}:`, error);
    throw error;
  }
};

/**
 * Отправка фото
 */
export const sendPhoto = async (
  token: string,
  chatId: number | string,
  photoUrl: string,
  options: {
    caption?: string;
    replyMarkup?: InlineKeyboardMarkup | ReplyKeyboardMarkup;
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  } = {}
) => {
  try {
    console.log(`[TelegramService] Отправка фото в чат ${chatId}...`);
    
    const { caption, replyMarkup, parseMode = 'HTML' } = options;
    
    const payload: any = {
      chat_id: chatId,
      photo: photoUrl,
    };
    
    if (caption) {
      payload.caption = caption;
      payload.parse_mode = parseMode;
    }
    
    if (replyMarkup) {
      payload.reply_markup = JSON.stringify(replyMarkup);
    }
    
    const response = await fetch(`${TELEGRAM_API}${token}/sendPhoto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    
    if (!data.ok) {
      const errorMsg = `[TelegramService] Ошибка отправки фото: ${data.description || 'Неизвестная ошибка'}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log(`[TelegramService] Фото успешно отправлено в чат ${chatId}`);
    return data.result;
  } catch (error) {
    console.error(`[TelegramService] Ошибка при отправке фото в чат ${chatId}:`, error);
    throw error;
  }
};

/**
 * Редактировать сообщение
 */
export const editMessageText = async (
  token: string,
  options: {
    chatId?: number | string;
    messageId?: number;
    inlineMessageId?: string;
    text: string;
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    disableWebPagePreview?: boolean;
    replyMarkup?: InlineKeyboardMarkup;
  }
) => {
  try {
    const { 
      chatId, 
      messageId, 
      inlineMessageId, 
      text, 
      parseMode = 'HTML', 
      disableWebPagePreview = false, 
      replyMarkup 
    } = options;
    
    console.log(`[TelegramService] Редактирование сообщения...`);
    
    const payload: any = {
      text,
      parse_mode: parseMode,
      disable_web_page_preview: disableWebPagePreview,
    };
    
    if (chatId && messageId) {
      payload.chat_id = chatId;
      payload.message_id = messageId;
    } else if (inlineMessageId) {
      payload.inline_message_id = inlineMessageId;
    } else {
      throw new Error('[TelegramService] Необходимо указать либо chat_id и message_id, либо inline_message_id');
    }
    
    if (replyMarkup) {
      payload.reply_markup = JSON.stringify(replyMarkup);
    }
    
    const response = await fetch(`${TELEGRAM_API}${token}/editMessageText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    
    if (!data.ok) {
      const errorMsg = `[TelegramService] Ошибка редактирования сообщения: ${data.description || 'Неизвестная ошибка'}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log(`[TelegramService] Сообщение успешно отредактировано`);
    return data.result;
  } catch (error) {
    console.error(`[TelegramService] Ошибка при редактировании сообщения:`, error);
    throw error;
  }
};

/**
 * Настройка команд бота
 */
export const setMyCommands = async (
  token: string,
  commands: Array<{ command: string; description: string }>,
  scope?: {
    type: 'default' | 'all_private_chats' | 'all_group_chats' | 'all_chat_administrators';
  }
) => {
  try {
    console.log(`[TelegramService] Установка списка команд бота...`);
    
    const payload: any = {
      commands: commands,
    };
    
    if (scope) {
      payload.scope = scope;
    }
    
    const response = await fetch(`${TELEGRAM_API}${token}/setMyCommands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    
    if (!data.ok) {
      const errorMsg = `[TelegramService] Ошибка установки команд: ${data.description || 'Неизвестная ошибка'}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log(`[TelegramService] Команды бота успешно установлены`);
    return data.result;
  } catch (error) {
    console.error(`[TelegramService] Ошибка при установке команд бота:`, error);
    throw error;
  }
};
