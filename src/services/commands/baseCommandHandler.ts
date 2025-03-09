
// Export sendMessage so it can be imported by other command handlers
export const sendMessage = async (
  botToken: string,
  chatId: number,
  text: string,
  options?: any
): Promise<any> => {
  // Implementation goes here
  return Promise.resolve({ ok: true });
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

export const processCommand = (
  command: string,
  chatId: number,
  userId: number,
  botToken: string
): Promise<any> => {
  // Implementation goes here
  return Promise.resolve({ ok: true });
};

export const processCallbackQuery = (
  callbackQuery: any,
  botToken: string
): Promise<any> => {
  // Implementation goes here
  return Promise.resolve({ ok: true });
};

// Import the command handlers without creating a circular dependency
import * as collectionCreationCommands from './collectionCreationCommands';
import * as participationCommands from './participationCommands';
import * as organizerCommands from './organizerCommands';
import * as statusCommands from './statusCommands';
import * as giftOptionCommands from './giftOptionCommands';

// These functions need to be added to handle callback data
export const handleNewCollectionCallback = collectionCreationCommands.handleNewCollectionCallback;
export const handleGroupNewCollectionCallback = collectionCreationCommands.handleGroupNewCollectionCallback;
export const handleSendRemindersCallback = organizerCommands.handleSendRemindersCallback;
export const handleStatusCallback = statusCommands.handleStatusCallback;
export const handleCollectionStatusCallback = statusCommands.handleCollectionStatusCallback;
