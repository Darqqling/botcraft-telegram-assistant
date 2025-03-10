
/**
 * Functions for working with media in Telegram
 */

import { TELEGRAM_API } from './config';
import { InlineKeyboardMarkup, ReplyKeyboardMarkup } from './types';

/**
 * Send a photo to a chat
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
