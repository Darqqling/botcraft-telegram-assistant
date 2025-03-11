
import { sendMessage as telegramSendMessage, InlineKeyboardMarkup, answerCallbackQuery } from '../../telegramService';

// Track the last message sent to each chat to prevent duplicates
const lastMessageSentTimestamp: Record<number, number> = {};
const messageCache: Record<string, number> = {}; // Store message hash -> timestamp
const RATE_LIMIT_MS = 1000; // 1 second between messages to the same chat

// Helper to generate a hash for a message
const getMessageHash = (chatId: number, text: string): string => {
  return `${chatId}:${text.substring(0, 50)}`;
};

// Export sendMessage so it can be imported by other command handlers
export const sendMessage = async (
  botToken: string,
  chatId: number,
  text: string,
  options?: any
): Promise<any> => {
  // Check if this is a duplicate message
  const messageHash = getMessageHash(chatId, text);
  const now = Date.now();
  
  // Log message attempt for debugging
  console.log(`[MessageUtils] Attempting to send message to chat ${chatId}: ${text.substring(0, 30)}...`);
  
  // If this exact message was sent to this chat recently (within 5 seconds), don't send it again
  if (messageCache[messageHash] && now - messageCache[messageHash] < 5000) {
    console.log(`[MessageUtils] Preventing duplicate message to chat ${chatId}`);
    return { ok: true, prevented: true, reason: 'duplicate' };
  }
  
  // Rate limiting for the same chat
  if (lastMessageSentTimestamp[chatId] && now - lastMessageSentTimestamp[chatId] < RATE_LIMIT_MS) {
    const waitTime = RATE_LIMIT_MS - (now - lastMessageSentTimestamp[chatId]);
    console.log(`[MessageUtils] Rate limiting message to chat ${chatId}, waiting ${waitTime}ms`);
    
    // Wait for the rate limit to expire
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  try {
    // Format options properly for Telegram API
    let telegramOptions: any = {};
    
    if (options) {
      if (options.replyMarkup) {
        telegramOptions.reply_markup = options.replyMarkup;
      }
      
      if (options.parseMode) {
        telegramOptions.parse_mode = options.parseMode;
      }
      
      if (options.disableWebPagePreview !== undefined) {
        telegramOptions.disable_web_page_preview = options.disableWebPagePreview;
      }
    }
    
    // Use the telegram service to send the message
    const result = await telegramSendMessage(botToken, chatId, text, telegramOptions);
    console.log(`[MessageUtils] Successfully sent message to chat ${chatId}`);
    
    // Update the timestamp for this chat and cache the message hash
    lastMessageSentTimestamp[chatId] = Date.now();
    messageCache[messageHash] = Date.now();
    
    // Clean up old message cache entries (older than 10 minutes)
    const cleanupTime = Date.now() - 600000;
    Object.keys(messageCache).forEach(key => {
      if (messageCache[key] < cleanupTime) {
        delete messageCache[key];
      }
    });
    
    return result;
  } catch (error: any) {
    console.error(`[MessageUtils] Error sending message to chat ${chatId}:`, error);
    
    // If we get a rate limit error from Telegram, extract the retry time and wait
    if (error.message && error.message.includes('Too Many Requests') && error.message.includes('retry after')) {
      const retryAfterMatch = error.message.match(/retry after (\d+)/);
      if (retryAfterMatch && retryAfterMatch[1]) {
        const retryAfterSec = parseInt(retryAfterMatch[1], 10);
        console.log(`[MessageUtils] Telegram rate limit hit, waiting ${retryAfterSec} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryAfterSec * 1000));
        
        // Try again after waiting
        return sendMessage(botToken, chatId, text, options);
      }
    }
    throw error;
  }
};

// Add sendGroupMessage which is used in participationCommands.ts
export const sendGroupMessage = async (
  botToken: string,
  chatId: number,
  text: string,
  options?: any
): Promise<any> => {
  // Use the same implementation with rate limiting and deduplication
  return sendMessage(botToken, chatId, text, options);
};

// Helper to answer callback queries and remove "Loading..." indicator
export const answerCallback = async (
  botToken: string,
  callbackQueryId: string,
  options?: {
    text?: string;
    showAlert?: boolean;
    url?: string;
    cacheTime?: number;
  }
): Promise<any> => {
  try {
    console.log(`[MessageUtils] Answering callback query: ${callbackQueryId}`);
    const result = await answerCallbackQuery(botToken, callbackQueryId, options);
    console.log(`[MessageUtils] Successfully answered callback query: ${callbackQueryId}`);
    return result;
  } catch (error) {
    console.error(`[MessageUtils] Error answering callback query:`, error);
    throw error;
  }
};
