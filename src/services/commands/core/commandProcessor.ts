
import { sendMessage } from './messageUtils';
import { 
  handleStartCommand, 
  handleHelpCommand, 
  handleHowItWorksCommand, 
  handleMyCollectionsCommand,
  handleBackToMainCommand
} from './menuCommands';
import { handlePaymentOptionsCommand, handleIPaidCommand } from './paymentHandlers';

// Import all the necessary handlers
import * as collectionCreationCommands from '../collectionCreationCommands';
import * as participation from '../participation'; // Using the updated directory structure
import * as organizerCommands from '../organizerCommands';
import * as statusCommands from '../statusCommands';
import * as giftOptionCommands from '../giftOptionCommands';

// Extract the specific handlers from the imported modules
const { handleNewCollectionCallback, handleGroupNewCollectionCallback } = collectionCreationCommands;
const { handleJoinCollectionCallback, handlePayCallback } = participation;
const { handleSendRemindersCallback } = organizerCommands;
const { handleStatusCallback, handleCollectionStatusCallback } = statusCommands;

export const processCommand = (
  command: string,
  chatId: number,
  userId: number,
  botToken: string
): Promise<any> => {
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

export const processCallbackQuery = (
  callbackQuery: any,
  botToken: string
): Promise<any> => {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const callbackData = callbackQuery.data;
  const firstName = callbackQuery.from.first_name;
  
  // Parse the callback data
  const parts = callbackData.split(':');
  const action = parts[0];
  
  // Handle different callback actions
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
      return sendMessage(botToken, chatId, "Неизвестное действие. Попробуйте еще раз.");
  }
  
  // Default response if no handler matches
  return sendMessage(botToken, chatId, "Неизвестное действие. Попробуйте еще раз.");
};
