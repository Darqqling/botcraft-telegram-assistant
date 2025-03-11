
// Export the main processCommand as the default entry point
import { 
  processCommand as coreProcessCommand, 
  processCallbackQuery as coreProcessCallbackQuery 
} from './commands/core/commandProcessor';

// Re-export the processor functions
export const processCommand = coreProcessCommand;
export const processCallbackQuery = coreProcessCallbackQuery;

// Re-export other utility functions
export { 
  sendMessage,
  sendGroupMessage
} from './commands/core/messageUtils';

export {
  handleStartCommand,
  handleHelpCommand,
  handleHowItWorksCommand,
  handleMyCollectionsCommand,
  handleBackToMainCommand
} from './commands/core/menuCommands';

export {
  handlePaymentOptionsCommand,
  handleIPaidCommand
} from './commands/core/paymentHandlers';

// Re-export all command handlers from their respective modules
export * from './commands/collectionCreationCommands';
export * from './commands/participation'; // Changed from participationCommands to participation
export * from './commands/organizerCommands';
export * from './commands/statusCommands';
export * from './commands/giftOptionCommands';

export default coreProcessCommand;
