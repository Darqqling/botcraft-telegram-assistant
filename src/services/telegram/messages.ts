
/**
 * Functions for sending and editing messages
 */

import { TELEGRAM_API } from './config';
import { InlineKeyboardMarkup, ReplyKeyboardMarkup } from './types';

/**
 * Send a message to a chat
 */
export const sendMessage = async (
  token: string, 
  chatId: number | string, 
  text: string, 
  options: any = {}
) => {
  try {
    console.log(`[TelegramService] Отправка сообщения в чат ${chatId}...`);
    
    const payload: any = {
      chat_id: chatId,
      text: text
    };
    
    // Copy all options directly to the payload
    // This is important as Telegram API expects specific field names
    Object.keys(options).forEach(key => {
      // Handle special case for reply_markup which might be pre-serialized
      if (key === 'reply_markup' && typeof options[key] === 'string') {
        payload[key] = options[key];
      } else {
        payload[key] = options[key];
      }
    });
    
    console.log(`[TelegramService] Payload for sendMessage:`, JSON.stringify(payload).substring(0, 200) + "...");
    
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
 * Answer a callback query (notification when a button is pressed)
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
 * Edit a message
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
