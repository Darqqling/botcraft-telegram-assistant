
import { sendMessage } from './messageUtils';
import { 
  handleStartCommand, 
  handleHelpCommand, 
  handleHowItWorksCommand, 
  handleMyCollectionsCommand,
  handleBackToMainCommand
} from './menuCommands';
import { handlePaymentOptionsCommand, handleIPaidCommand } from './paymentHandlers';
import { answerCallbackQuery } from '../../telegramService';

// Import all the necessary handlers
import * as collectionCreationCommands from '../collectionCreationCommands';
import * as participation from '../participation'; // Using the updated directory structure
import * as organizerCommands from '../organizerCommands';
import * as statusCommands from '../statusCommands';
import * as giftOptionCommands from '../giftOptionCommands';

// Track processed callback queries to prevent duplicate handling
const processedCallbacks = new Set<string>();

// Extract the specific handlers from the imported modules
const { handleNewCollectionCallback, handleGroupNewCollectionCallback } = collectionCreationCommands;
const { handleJoinCollectionCallback, handlePayCallback } = participation;
const { handleSendRemindersCallback } = organizerCommands;
const { handleStatusCallback, handleCollectionStatusCallback } = statusCommands;

export const processCommand = (
  command: string,
  chatId: number,
  userId: number,
  botToken: string,
  messageId?: number
): Promise<any> => {
  // Skip if we've already processed this message
  if (messageId && processedCallbacks.has(`cmd:${messageId}`)) {
    console.log(`[CommandProcessor] Skipping already processed command message: ${messageId}`);
    return Promise.resolve({ ok: true, skipped: true });
  }
  
  // Mark as processed
  if (messageId) {
    processedCallbacks.add(`cmd:${messageId}`);
    
    // Clean up old entries (keep last 1000 entries)
    if (processedCallbacks.size > 1000) {
      const oldestToRemove = Array.from(processedCallbacks).slice(0, processedCallbacks.size - 1000);
      oldestToRemove.forEach(id => processedCallbacks.delete(id));
    }
  }
  
  if (command === '/start') {
    return handleStartCommand(botToken, chatId, userId);
  } else if (command === '/help') {
    return handleHelpCommand(botToken, chatId);
  } else if (command === '/how_it_works') {
    return handleHowItWorksCommand(botToken, chatId);
  } else if (command === '/my_collections') {
    return handleMyCollectionsCommand(botToken, chatId, userId);
  } else {
    // For other commands, use existing handlers
    // Default response if no handler matches
    return sendMessage(botToken, chatId, "Неизвестная команда. Отправьте /help для получения списка доступных команд.");
  }
};

export const processCallbackQuery = async (
  callbackQuery: any,
  botToken: string
): Promise<any> => {
  const callbackId = callbackQuery.id;
  
  // Skip if we've already processed this callback query
  if (processedCallbacks.has(`cb:${callbackId}`)) {
    console.log(`[CommandProcessor] Skipping already processed callback query: ${callbackId}`);
    return Promise.resolve({ ok: true, skipped: true });
  }
  
  // Mark as processed
  processedCallbacks.add(`cb:${callbackId}`);
  
  // Immediately acknowledge the callback query to remove "Loading..." indicator
  try {
    await answerCallbackQuery(botToken, callbackId);
    console.log(`[CommandProcessor] Acknowledged callback query: ${callbackId}`);
  } catch (error) {
    console.error(`[CommandProcessor] Error acknowledging callback query:`, error);
    // Continue processing even if acknowledgment fails
  }
  
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const callbackData = callbackQuery.data;
  const firstName = callbackQuery.from.first_name;
  
  console.log(`[CommandProcessor] Processing callback query: ${callbackData} from user ${userId} in chat ${chatId}`);
  
  // Parse the callback data
  const parts = callbackData.split(':');
  const action = parts[0];
  
  // Handle different callback actions
  try {
    switch (action) {
      case 'new_collection':
        return handleNewCollectionCallback(callbackQuery, botToken);
      case 'group_new_collection':
        return handleGroupNewCollectionCallback(callbackQuery, botToken);
      case 'my_collections':
        return handleMyCollectionsCommand(botToken, chatId, userId);
      case 'how_it_works':
        return handleHowItWorksCommand(botToken, chatId);
      case 'help':
        return handleHelpCommand(botToken, chatId);
      case 'back_to_main':
        return handleBackToMainCommand(botToken, chatId, userId);
      case 'join':
        return handleJoinCollectionCallback(botToken, userId, chatId, firstName, parts);
      case 'pay':
        return handlePayCallback(botToken, userId, chatId, firstName, parts);
      case 'pay_amount':
        // Handle payment with predefined amount
        if (parts.length >= 3) {
          const collectionId = parts[1];
          const amount = parseFloat(parts[2]);
          return handleIPaidCommand(botToken, chatId, userId, firstName, collectionId, amount);
        }
        break;
      case 'payment_options':
        if (parts.length >= 2) {
          const collectionId = parts[1];
          return handlePaymentOptionsCommand(botToken, chatId, collectionId);
        }
        break;
      case 'i_paid':
        if (parts.length >= 2) {
          const collectionId = parts[1];
          // For now, assuming a default amount
          return handleIPaidCommand(botToken, chatId, userId, firstName, collectionId, 1000);
        }
        break;
      case 'status':
        return handleStatusCallback(callbackQuery, botToken);
      case 'collection_status':
        return handleCollectionStatusCallback(callbackQuery, botToken);
      case 'send_reminders':
        return handleSendRemindersCallback(callbackQuery, botToken);
      default:
        console.log(`[CommandProcessor] Unknown callback action: ${action}`);
        return sendMessage(botToken, chatId, "Неизвестное действие. Попробуйте еще раз.");
    }
  } catch (error) {
    console.error(`[CommandProcessor] Ошибка при обработке callback query:`, error);
    return sendMessage(botToken, chatId, "Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз.");
  }
  
  // Default response if no handler matches
  return sendMessage(botToken, chatId, "Неизвестное действие. Попробуйте еще раз.");
};
