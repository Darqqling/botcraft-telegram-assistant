
// Export the main processCommand as the default entry point
import { 
  processCommand, 
  processCallbackQuery,
  sendMessage,
  sendGroupMessage,
  handleStartCommand,
  handleHelpCommand,
  handleHowItWorksCommand,
  handleMyCollectionsCommand,
  handleBackToMainCommand,
  handlePaymentOptionsCommand,
  handleIPaidCommand,
  handleNewCollectionCallback,
  handleGroupNewCollectionCallback,
  handleSendRemindersCallback,
  handleStatusCallback,
  handleCollectionStatusCallback
} from './commands/baseCommandHandler';

// Re-export from baseCommandHandler
export { 
  processCommand, 
  processCallbackQuery, 
  sendMessage,
  sendGroupMessage,
  handleStartCommand,
  handleHelpCommand,
  handleHowItWorksCommand,
  handleMyCollectionsCommand,
  handleBackToMainCommand,
  handlePaymentOptionsCommand,
  handleIPaidCommand,
  handleNewCollectionCallback,
  handleGroupNewCollectionCallback,
  handleSendRemindersCallback,
  handleStatusCallback,
  handleCollectionStatusCallback
};

// Re-export all command handlers from their respective modules
export * from './commands/collectionCreationCommands';
export * from './commands/participation'; // Changed from participationCommands to participation
export * from './commands/organizerCommands';
export * from './commands/statusCommands';
export * from './commands/giftOptionCommands';

export default processCommand;
