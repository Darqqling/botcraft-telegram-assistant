
/**
 * Functions for working with bot commands
 */

import { TELEGRAM_API } from './config';

/**
 * Set commands for the bot
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
