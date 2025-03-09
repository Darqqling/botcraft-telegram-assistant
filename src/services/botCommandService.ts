
// Re-export all command handlers from their respective modules
export * from './commands/baseCommandHandler';
export * from './commands/collectionCreationCommands';
export * from './commands/participationCommands';
export * from './commands/organizerCommands';
export * from './commands/statusCommands';
export * from './commands/giftOptionCommands';

// Export the main processCommand as the default entry point
import { processCommand, processCallbackQuery } from './commands/baseCommandHandler';
export default processCommand;
export { processCallbackQuery };
