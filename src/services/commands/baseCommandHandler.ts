
/**
 * Base Command Handler
 * Refactored into modular files for better maintainability
 */

// Re-export message utilities
export { sendMessage, sendGroupMessage } from './core/messageUtils';

// Re-export menu commands
export {
  handleStartCommand,
  handleHelpCommand,
  handleHowItWorksCommand,
  handleMyCollectionsCommand,
  handleBackToMainCommand
} from './core/menuCommands';

// Re-export payment handlers
export {
  handlePaymentOptionsCommand,
  handleIPaidCommand
} from './core/paymentHandlers';

// Re-export command processor
export {
  processCommand,
  processCallbackQuery
} from './core/commandProcessor';

// Re-export handlers from other modules to maintain API compatibility
import * as collectionCreationCommands from './collectionCreationCommands';
import * as participation from './participation';
import * as organizerCommands from './organizerCommands';
import * as statusCommands from './statusCommands';

// Export the specific handlers from the imported modules
export const handleNewCollectionCallback = collectionCreationCommands.handleNewCollectionCallback;
export const handleGroupNewCollectionCallback = collectionCreationCommands.handleGroupNewCollectionCallback;
export const handleSendRemindersCallback = organizerCommands.handleSendRemindersCallback;
export const handleStatusCallback = statusCommands.handleStatusCallback;
export const handleCollectionStatusCallback = statusCommands.handleCollectionStatusCallback;
export const { handleJoinCollectionCallback } = participation;
export const { handlePayCallback } = participation;
