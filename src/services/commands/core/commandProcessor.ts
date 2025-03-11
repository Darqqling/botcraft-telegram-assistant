
import { sendMessage, answerCallback } from './messageUtils';
import { 
  handleStartCommand, 
  handleHelpCommand, 
  handleHowItWorksCommand, 
  handleMyCollectionsCommand,
  handleBackToMainCommand,
  isGroupChat
} from './menuCommands';
import { handlePaymentOptionsCommand, handleIPaidCommand } from './paymentHandlers';

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

export const processCommand = async (
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
  
  console.log(`[CommandProcessor] Processing command: ${command} in chat ${chatId} (${isGroupChat(chatId) ? 'group' : 'personal'}) by user ${userId}`);
  
  try {
    if (command === '/start' || command === '/start@your_bot_username') {
      return await handleStartCommand(botToken, chatId, userId);
    } else if (command === '/help' || command === '/help@your_bot_username') {
      return await handleHelpCommand(botToken, chatId);
    } else if (command === '/how_it_works' || command === '/how_it_works@your_bot_username') {
      return await handleHowItWorksCommand(botToken, chatId);
    } else if (command === '/my_collections' || command === '/my_collections@your_bot_username') {
      return await handleMyCollectionsCommand(botToken, chatId, userId);
    } else if (command === '/new_collection' || command === '/new_collection@your_bot_username') {
      // Only allow new_collection command in group chats
      if (isGroupChat(chatId)) {
        return await handleGroupNewCollectionCallback({ 
          message: { chat: { id: chatId } },
          from: { id: userId },
          data: 'group_new_collection' 
        }, botToken);
      } else {
        return await sendMessage(
          botToken, 
          chatId, 
          "🚫 Создание сборов доступно только в групповых чатах. Пожалуйста, добавьте бота в групповой чат и используйте эту команду там."
        );
      }
    } else {
      // Default response if no handler matches
      return await sendMessage(botToken, chatId, "Неизвестная команда. Отправьте /help для получения списка доступных команд.");
    }
  } catch (error) {
    console.error(`[CommandProcessor] Error processing command ${command}:`, error);
    return sendMessage(botToken, chatId, "Произошла ошибка при обработке вашей команды. Пожалуйста, попробуйте снова.");
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
  
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const callbackData = callbackQuery.data;
  const firstName = callbackQuery.from.first_name || 'User';
  const lastName = callbackQuery.from.last_name || '';
  const username = callbackQuery.from.username || '';
  
  const isGroup = isGroupChat(chatId);
  console.log(`[CommandProcessor] Processing callback query: ${callbackData} from user ${userId} in ${isGroup ? 'group' : 'personal'} chat ${chatId}`);
  
  // First, answer the callback query to remove the loading indicator
  try {
    await answerCallback(botToken, callbackId);
  } catch (error) {
    console.error(`[CommandProcessor] Error answering callback query:`, error);
    // Continue processing even if we couldn't answer the callback
  }
  
  // Parse the callback data
  const parts = callbackData.split(':');
  const action = parts[0];
  
  // Handle different callback actions
  try {
    switch (action) {
      case 'new_collection':
        // Only allow in personal chat if specifically requested (from a deeplink)
        if (!isGroup) {
          return await sendMessage(
            botToken,
            chatId,
            "🚫 Создание сборов доступно только в групповых чатах. Пожалуйста, добавьте бота в групповой чат и используйте команду /new_collection там."
          );
        }
        return await handleNewCollectionCallback(callbackQuery, botToken);
        
      case 'group_new_collection':
        // Only allow in group chats
        if (!isGroup) {
          return await sendMessage(
            botToken,
            chatId,
            "🚫 Создание сборов доступно только в групповых чатах. Пожалуйста, добавьте бота в групповой чат."
          );
        }
        return await handleGroupNewCollectionCallback(callbackQuery, botToken);
        
      case 'my_collections':
        // Only makes sense in personal chat
        if (isGroup) {
          return await sendMessage(
            botToken,
            chatId,
            "Для просмотра ваших сборов, пожалуйста, напишите боту в личные сообщения."
          );
        }
        return await handleMyCollectionsCommand(botToken, chatId, userId);
        
      case 'how_it_works':
        return await handleHowItWorksCommand(botToken, chatId);
        
      case 'help':
        return await handleHelpCommand(botToken, chatId);
        
      case 'back_to_main':
        return await handleBackToMainCommand(botToken, chatId, userId);
        
      case 'join':
        return await handleJoinCollectionCallback(botToken, userId, chatId, firstName, parts, lastName, username);
        
      case 'pay':
        return await handlePayCallback(botToken, userId, chatId, firstName, parts, lastName, username);
        
      case 'pay_amount':
        // Handle payment with predefined amount
        if (parts.length >= 3) {
          const collectionId = parts[1];
          const amount = parseFloat(parts[2]);
          return await handleIPaidCommand(botToken, chatId, userId, firstName, collectionId, amount);
        }
        break;
        
      case 'payment_options':
        if (parts.length >= 2) {
          const collectionId = parts[1];
          const amount = parts.length >= 3 ? parseFloat(parts[2]) : undefined;
          return await handlePaymentOptionsCommand(botToken, chatId, collectionId, amount);
        }
        break;
        
      case 'i_paid':
        if (parts.length >= 2) {
          const collectionId = parts[1];
          // Get amount if provided
          const amount = parts.length >= 3 ? parseFloat(parts[2]) : 1000;
          return await handleIPaidCommand(botToken, chatId, userId, firstName, collectionId, amount);
        }
        break;
        
      case 'status':
        return await handleStatusCallback(callbackQuery, botToken);
        
      case 'collection_status':
        return await handleCollectionStatusCallback(callbackQuery, botToken);
        
      case 'send_reminders':
        return await handleSendRemindersCallback(callbackQuery, botToken);
        
      default:
        console.log(`[CommandProcessor] Unknown callback action: ${action}`);
        return await sendMessage(botToken, chatId, "Неизвестное действие. Попробуйте еще раз.");
    }
  } catch (error) {
    console.error(`[CommandProcessor] Ошибка при обработке callback query:`, error);
    return await sendMessage(botToken, chatId, "Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз.");
  }
  
  // Default response if no handler matches
  return sendMessage(botToken, chatId, "Неизвестное действие. Попробуйте еще раз.");
};
