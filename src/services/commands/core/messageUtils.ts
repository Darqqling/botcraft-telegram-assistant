
import { sendMessage as telegramSendMessage, InlineKeyboardMarkup } from '../../telegramService';

// Export sendMessage so it can be imported by other command handlers
export const sendMessage = async (
  botToken: string,
  chatId: number,
  text: string,
  options?: any
): Promise<any> => {
  // Use the telegram service to send the message
  return telegramSendMessage(botToken, chatId, text, options);
};

// Add sendGroupMessage which is used in participationCommands.ts
export const sendGroupMessage = async (
  botToken: string,
  chatId: number,
  text: string,
  options?: any
): Promise<any> => {
  // Implementation goes here - same as sendMessage for now
  return sendMessage(botToken, chatId, text, options);
};
