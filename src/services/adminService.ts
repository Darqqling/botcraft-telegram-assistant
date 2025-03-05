
import { v4 as uuidv4 } from 'uuid';
import { 
  Collection, 
  User, 
  Transaction, 
  CollectionStatus 
} from '@/types/collectionTypes';
import { 
  Admin, 
  AdminLog, 
  BotSettings,
  ChatStats 
} from '@/types/adminTypes';
import {
  getCollections,
  getUsers,
  getTransactions,
  saveCollections,
  saveUsers,
  saveTransactions
} from './storageService';

// Admin storage keys
const ADMINS_KEY = 'telegram_bot_admins';
const ADMIN_LOGS_KEY = 'telegram_bot_admin_logs';
const BOT_SETTINGS_KEY = 'telegram_bot_settings';
const CHATS_STATS_KEY = 'telegram_bot_chats_stats';

// Admin management
export const getAdmins = (): Admin[] => {
  try {
    const admins = localStorage.getItem(ADMINS_KEY);
    return admins ? JSON.parse(admins) : [];
  } catch (error) {
    console.error('Error getting admins:', error);
    return [];
  }
};

export const saveAdmins = (admins: Admin[]): void => {
  try {
    localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
  } catch (error) {
    console.error('Error saving admins:', error);
  }
};

export const isAdmin = (userId: number): boolean => {
  const admins = getAdmins();
  return admins.some(admin => admin.userId === userId);
};

export const getAdminByUserId = (userId: number): Admin | undefined => {
  const admins = getAdmins();
  return admins.find(admin => admin.userId === userId);
};

export const addAdmin = (userId: number, role: Admin['role'] = 'moderator'): Admin | null => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return null;
  }
  
  const admins = getAdmins();
  
  // Check if already an admin
  if (admins.some(admin => admin.userId === userId)) {
    return null;
  }
  
  const newAdmin: Admin = {
    id: Date.now(),
    userId,
    role,
    createdAt: Date.now()
  };
  
  admins.push(newAdmin);
  saveAdmins(admins);
  
  // Log the action
  logAdminAction(0, `Added new admin (${role})`, `User ${userId} was granted ${role} permissions`, 'user', userId);
  
  return newAdmin;
};

export const removeAdmin = (adminId: number, performedBy: number): boolean => {
  const admins = getAdmins();
  const adminIndex = admins.findIndex(admin => admin.id === adminId);
  
  if (adminIndex === -1) {
    return false;
  }
  
  const removedAdmin = admins[adminIndex];
  admins.splice(adminIndex, 1);
  saveAdmins(admins);
  
  // Log the action
  logAdminAction(
    performedBy, 
    'Removed admin', 
    `Admin ${removedAdmin.userId} with role ${removedAdmin.role} was removed`,
    'user',
    removedAdmin.userId
  );
  
  return true;
};

// Collection management
export const freezeCollection = (collectionId: string, adminId: number): boolean => {
  const collections = getCollections();
  const collectionIndex = collections.findIndex(c => c.id === collectionId);
  
  if (collectionIndex === -1) {
    return false;
  }
  
  const collection = collections[collectionIndex];
  
  // Only active collections can be frozen
  if (collection.status !== 'active') {
    return false;
  }
  
  // Set status to "frozen" (we'll need to add this status to the CollectionStatus type)
  collection.status = 'frozen' as CollectionStatus;
  collections[collectionIndex] = collection;
  saveCollections(collections);
  
  // Log action
  logAdminAction(
    adminId,
    'Froze collection',
    `Collection ${collectionId} (${collection.title}) was frozen`,
    'collection',
    collectionId
  );
  
  return true;
};

export const unfreezeCollection = (collectionId: string, adminId: number): boolean => {
  const collections = getCollections();
  const collectionIndex = collections.findIndex(c => c.id === collectionId);
  
  if (collectionIndex === -1) {
    return false;
  }
  
  const collection = collections[collectionIndex];
  
  // Only frozen collections can be unfrozen
  if (collection.status !== 'frozen') {
    return false;
  }
  
  collection.status = 'active';
  collections[collectionIndex] = collection;
  saveCollections(collections);
  
  // Log action
  logAdminAction(
    adminId,
    'Unfroze collection',
    `Collection ${collectionId} (${collection.title}) was unfrozen`,
    'collection',
    collectionId
  );
  
  return true;
};

export const cancelCollectionByAdmin = (collectionId: string, adminId: number, reason: string): boolean => {
  const collections = getCollections();
  const collectionIndex = collections.findIndex(c => c.id === collectionId);
  
  if (collectionIndex === -1) {
    return false;
  }
  
  const collection = collections[collectionIndex];
  
  // Only active or frozen collections can be cancelled
  if (collection.status !== 'active' && collection.status !== 'frozen') {
    return false;
  }
  
  collection.status = 'cancelled';
  collections[collectionIndex] = collection;
  saveCollections(collections);
  
  // Log action
  logAdminAction(
    adminId,
    'Cancelled collection',
    `Collection ${collectionId} (${collection.title}) was cancelled by admin. Reason: ${reason}`,
    'collection',
    collectionId
  );
  
  return true;
};

// User management
export const blockUser = (userId: number, adminId: number, reason: string): boolean => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return false;
  }
  
  const user = users[userIndex];
  user.isBlocked = true;
  user.blockReason = reason;
  user.blockedAt = Date.now();
  users[userIndex] = user;
  saveUsers(users);
  
  // Log action
  logAdminAction(
    adminId,
    'Blocked user',
    `User ${userId} (${user.firstName} ${user.lastName || ''}) was blocked. Reason: ${reason}`,
    'user',
    userId
  );
  
  return true;
};

export const unblockUser = (userId: number, adminId: number): boolean => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return false;
  }
  
  const user = users[userIndex];
  user.isBlocked = false;
  user.blockReason = undefined;
  user.blockedAt = undefined;
  users[userIndex] = user;
  saveUsers(users);
  
  // Log action
  logAdminAction(
    adminId,
    'Unblocked user',
    `User ${userId} (${user.firstName} ${user.lastName || ''}) was unblocked`,
    'user',
    userId
  );
  
  return true;
};

// Transaction management
export const cancelTransaction = (transactionId: string, adminId: number, reason: string): boolean => {
  const transactions = getTransactions();
  const transactionIndex = transactions.findIndex(t => t.id === transactionId);
  
  if (transactionIndex === -1) {
    return false;
  }
  
  const transaction = transactions[transactionIndex];
  transaction.cancelled = true;
  transaction.cancelReason = reason;
  transaction.cancelledAt = Date.now();
  transactions[transactionIndex] = transaction;
  saveTransactions(transactions);
  
  // Now we need to update the collection's current amount
  const collections = getCollections();
  const collectionIndex = collections.findIndex(c => c.id === transaction.collectionId);
  
  if (collectionIndex !== -1) {
    const collection = collections[collectionIndex];
    collection.currentAmount -= transaction.amount;
    
    // Find the participant and update their payment status
    const participantIndex = collection.participants.findIndex(p => p.userId === transaction.userId);
    if (participantIndex !== -1) {
      collection.participants[participantIndex].hasPaid = false;
    }
    
    collections[collectionIndex] = collection;
    saveCollections(collections);
  }
  
  // Log action
  logAdminAction(
    adminId,
    'Cancelled transaction',
    `Transaction ${transactionId} (${transaction.amount} руб.) was cancelled. Reason: ${reason}`,
    'transaction',
    transactionId
  );
  
  return true;
};

// Chat management
export const getChatStats = (): ChatStats[] => {
  try {
    const stats = localStorage.getItem(CHATS_STATS_KEY);
    return stats ? JSON.parse(stats) : [];
  } catch (error) {
    console.error('Error getting chat stats:', error);
    return [];
  }
};

export const saveChatStats = (stats: ChatStats[]): void => {
  try {
    localStorage.setItem(CHATS_STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving chat stats:', error);
  }
};

export const disableChat = (chatId: number, adminId: number, reason: string): boolean => {
  const stats = getChatStats();
  const chatIndex = stats.findIndex(c => c.chatId === chatId);
  
  if (chatIndex === -1) {
    return false;
  }
  
  stats[chatIndex].isActive = false;
  saveChatStats(stats);
  
  // Log action
  logAdminAction(
    adminId,
    'Disabled chat',
    `Chat ${chatId} was disabled. Reason: ${reason}`,
    'chat',
    chatId
  );
  
  return true;
};

export const enableChat = (chatId: number, adminId: number): boolean => {
  const stats = getChatStats();
  const chatIndex = stats.findIndex(c => c.chatId === chatId);
  
  if (chatIndex === -1) {
    return false;
  }
  
  stats[chatIndex].isActive = true;
  saveChatStats(stats);
  
  // Log action
  logAdminAction(
    adminId,
    'Enabled chat',
    `Chat ${chatId} was enabled`,
    'chat',
    chatId
  );
  
  return true;
};

// Bot settings
export const getBotSettings = (): BotSettings => {
  try {
    const settings = localStorage.getItem(BOT_SETTINGS_KEY);
    if (settings) {
      return JSON.parse(settings);
    }
  } catch (error) {
    console.error('Error getting bot settings:', error);
  }
  
  // Default settings
  return {
    minimumCollectionAmount: 500,
    maximumCollectionAmount: 100000,
    defaultCollectionDuration: 14, // days
    reminderFrequencyDays: 3,
    enabledCommands: [
      'new_collection',
      'group_new_collection',
      'join_collection',
      'pay',
      'confirm_gift',
      'cancel',
      'status',
      'collection_status',
      'add_gift_option',
      'vote',
      'update_amount',
      'send_reminders'
    ],
    featuresEnabled: {
      groupCollections: true,
      giftVoting: true,
      reminders: true,
      statistics: true
    }
  };
};

export const saveBotSettings = (settings: BotSettings, adminId: number): void => {
  try {
    localStorage.setItem(BOT_SETTINGS_KEY, JSON.stringify(settings));
    
    // Log action
    logAdminAction(
      adminId,
      'Updated bot settings',
      'Bot settings were updated',
      'system'
    );
  } catch (error) {
    console.error('Error saving bot settings:', error);
  }
};

// Admin logs
export const getAdminLogs = (): AdminLog[] => {
  try {
    const logs = localStorage.getItem(ADMIN_LOGS_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error('Error getting admin logs:', error);
    return [];
  }
};

export const saveAdminLogs = (logs: AdminLog[]): void => {
  try {
    localStorage.setItem(ADMIN_LOGS_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Error saving admin logs:', error);
  }
};

export const logAdminAction = (
  adminId: number,
  action: string,
  details: string,
  targetType?: AdminLog['targetType'],
  targetId?: string | number
): AdminLog => {
  const logs = getAdminLogs();
  
  const log: AdminLog = {
    id: uuidv4(),
    adminId,
    action,
    details,
    targetType,
    targetId,
    timestamp: Date.now()
  };
  
  logs.push(log);
  saveAdminLogs(logs);
  
  return log;
};

// Analytics and reports
export const getCollectionsStats = () => {
  const collections = getCollections();
  
  return {
    total: collections.length,
    active: collections.filter(c => c.status === 'active').length,
    completed: collections.filter(c => c.status === 'completed').length,
    cancelled: collections.filter(c => c.status === 'cancelled').length,
    frozen: collections.filter(c => c.status === 'frozen').length,
    totalAmount: collections.reduce((sum, c) => sum + c.currentAmount, 0),
    avgAmount: collections.length > 0 
      ? collections.reduce((sum, c) => sum + c.currentAmount, 0) / collections.length
      : 0,
    recentCollections: collections
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
  };
};

export const getUsersStats = () => {
  const users = getUsers();
  const collections = getCollections();
  
  // Get users who have created collections
  const organizers = [...new Set(collections.map(c => c.organizerId))];
  
  // Get unique participants
  const allParticipants = collections.flatMap(c => c.participants.map(p => p.userId));
  const uniqueParticipants = [...new Set(allParticipants)];
  
  return {
    total: users.length,
    active: uniqueParticipants.length,
    organizers: organizers.length,
    blocked: users.filter(u => u.isBlocked).length,
    newUsersLast7Days: users.filter(u => (Date.now() - u.createdAt) < 7 * 24 * 60 * 60 * 1000).length
  };
};

export const getTransactionsStats = () => {
  const transactions = getTransactions();
  
  return {
    total: transactions.length,
    totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
    cancelled: transactions.filter(t => t.cancelled).length,
    last24Hours: transactions.filter(t => (Date.now() - t.timestamp) < 24 * 60 * 60 * 1000).length,
    last7Days: transactions.filter(t => (Date.now() - t.timestamp) < 7 * 24 * 60 * 60 * 1000).length,
    lastMonth: transactions.filter(t => (Date.now() - t.timestamp) < 30 * 24 * 60 * 60 * 1000).length
  };
};

// Export default settings
export const resetBotSettings = (adminId: number): void => {
  const defaultSettings: BotSettings = {
    minimumCollectionAmount: 500,
    maximumCollectionAmount: 100000,
    defaultCollectionDuration: 14,
    reminderFrequencyDays: 3,
    enabledCommands: [
      'new_collection',
      'group_new_collection',
      'join_collection',
      'pay',
      'confirm_gift',
      'cancel',
      'status',
      'collection_status',
      'add_gift_option',
      'vote',
      'update_amount',
      'send_reminders'
    ],
    featuresEnabled: {
      groupCollections: true,
      giftVoting: true,
      reminders: true,
      statistics: true
    }
  };
  
  saveBotSettings(defaultSettings, adminId);
  
  // Log action
  logAdminAction(
    adminId,
    'Reset bot settings',
    'Bot settings were reset to default values',
    'system'
  );
};
