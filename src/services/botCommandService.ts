
// Export the main processCommand as the default entry point
import { processCommand, processCallbackQuery } from './commands/baseCommandHandler';

// Re-export from baseCommandHandler
export { 
  processCommand, 
  processCallbackQuery, 
  sendMessage,
  sendGroupMessage,
  handleNewCollectionCallback,
  handleGroupNewCollectionCallback,
  handleSendRemindersCallback,
  handleStatusCallback,
  handleCollectionStatusCallback
} from './commands/baseCommandHandler';

// Re-export all command handlers from their respective modules
export * from './commands/collectionCreationCommands';
export * from './commands/participationCommands';
export * from './commands/organizerCommands';
export * from './commands/statusCommands';
export * from './commands/giftOptionCommands';

export default processCommand;
