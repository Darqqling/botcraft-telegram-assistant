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

// Re-export all command handlers from their respective modules
export * from './commands/baseCommandHandler';
export * from './commands/collectionCreationCommands';
export * from './commands/participationCommands';
export * from './commands/organizerCommands';
export * from './commands/statusCommands';
export * from './commands/giftOptionCommands';

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
