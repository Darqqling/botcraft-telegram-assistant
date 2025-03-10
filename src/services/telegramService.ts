
/**
 * Telegram Bot API Service
 * Refactored into modular files for better maintainability
 */

// Re-export types from types.ts
export * from './telegram/types';

// Re-export functions from other modules
export { getMe } from './telegram/botInfo';
export { getUpdates } from './telegram/updates';
export { sendMessage, answerCallbackQuery, editMessageText } from './telegram/messages';
export { sendPhoto } from './telegram/media';
export { setMyCommands } from './telegram/commands';
