
import { User, Collection, Transaction, CollectionStatus, ActivityLogEntry } from "@/types/collectionTypes";
import { v4 as uuidv4 } from 'uuid';
import { 
  getCollections, 
  saveCollections, 
  getUsers, 
  saveUsers,
  getTransactions,
  saveTransactions,
  addLogEntry
} from "./storageService";

// Freeze a collection
export const freezeCollection = (collectionId: string): boolean => {
  const collections = getCollections();
  const collectionIndex = collections.findIndex(c => c.id === collectionId);
  
  if (collectionIndex === -1) {
    return false;
  }
  
  collections[collectionIndex].status = 'frozen';
  collections[collectionIndex].updatedAt = Date.now();
  
  saveCollections(collections);
  
  // Log the action
  const logEntry: ActivityLogEntry = {
    id: uuidv4(),
    type: 'collection_status_change',
    userId: 0, // Admin user
    timestamp: Date.now(),
    collectionId: collectionId
  };
  addLogEntry(logEntry);
  
  return true;
};

// Unfreeze a collection
export const unfreezeCollection = (collectionId: string): boolean => {
  const collections = getCollections();
  const collectionIndex = collections.findIndex(c => c.id === collectionId);
  
  if (collectionIndex === -1) {
    return false;
  }
  
  // Can only unfreeze a frozen collection
  if (collections[collectionIndex].status !== 'frozen') {
    return false;
  }
  
  collections[collectionIndex].status = 'active';
  collections[collectionIndex].updatedAt = Date.now();
  
  saveCollections(collections);
  
  // Log the action
  const logEntry: ActivityLogEntry = {
    id: uuidv4(),
    type: 'collection_status_change',
    userId: 0, // Admin user
    timestamp: Date.now(),
    collectionId: collectionId
  };
  addLogEntry(logEntry);
  
  return true;
};

// Block a user
export const blockUser = (userId: number, reason: string): boolean => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return false;
  }
  
  users[userIndex].isBlocked = true;
  users[userIndex].blockReason = reason;
  users[userIndex].blockedAt = Date.now();
  
  saveUsers(users);
  
  // Log the action
  const logEntry: ActivityLogEntry = {
    id: uuidv4(),
    type: 'user_blocked',
    userId: 0, // Admin user
    timestamp: Date.now()
  };
  addLogEntry(logEntry);
  
  return true;
};

// Unblock a user
export const unblockUser = (userId: number): boolean => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return false;
  }
  
  users[userIndex].isBlocked = false;
  users[userIndex].blockReason = undefined;
  users[userIndex].blockedAt = undefined;
  
  saveUsers(users);
  
  // Log the action
  const logEntry: ActivityLogEntry = {
    id: uuidv4(),
    type: 'user_unblocked',
    userId: 0, // Admin user
    timestamp: Date.now()
  };
  addLogEntry(logEntry);
  
  return true;
};

// Cancel a transaction
export const cancelTransaction = (transactionId: string, reason: string): boolean => {
  const transactions = getTransactions();
  const transactionIndex = transactions.findIndex(t => t.id === transactionId);
  
  if (transactionIndex === -1) {
    return false;
  }
  
  transactions[transactionIndex].cancelled = true;
  transactions[transactionIndex].cancelReason = reason;
  transactions[transactionIndex].cancelledAt = Date.now();
  
  saveTransactions(transactions);
  
  // Log the action
  const logEntry: ActivityLogEntry = {
    id: uuidv4(),
    type: 'transaction_cancelled',
    userId: 0, // Admin user
    timestamp: Date.now()
  };
  addLogEntry(logEntry);
  
  return true;
};

// Get collection statistics
export const getCollectionStats = () => {
  const collections = getCollections();
  const activeCollections = collections.filter(c => c.status === 'active');
  const pendingCollections = collections.filter(c => c.status === 'pending');
  const completedCollections = collections.filter(c => c.status === 'completed');
  const cancelledCollections = collections.filter(c => c.status === 'cancelled');
  const frozenCollections = collections.filter(c => c.status === 'frozen');
  
  const totalTargetAmount = collections.reduce((sum, c) => sum + c.targetAmount, 0);
  const totalCurrentAmount = collections.reduce((sum, c) => sum + c.currentAmount, 0);
  
  return {
    total: collections.length,
    active: activeCollections.length,
    pending: pendingCollections.length,
    completed: completedCollections.length,
    cancelled: cancelledCollections.length,
    frozen: frozenCollections.length,
    totalTargetAmount,
    totalCurrentAmount,
    averageTargetAmount: collections.length ? totalTargetAmount / collections.length : 0,
    averageCollectedAmount: collections.length ? totalCurrentAmount / collections.length : 0,
    successRate: collections.length ? completedCollections.length / collections.length : 0
  };
};

// Get user statistics
export const getUserStats = () => {
  const users = getUsers();
  const blockedUsers = users.filter(u => u.isBlocked);
  
  return {
    total: users.length,
    blocked: blockedUsers.length,
    active: users.length - blockedUsers.length
  };
};

// Get transaction statistics
export const getTransactionStats = () => {
  const transactions = getTransactions();
  const contributions = transactions.filter(t => t.type === 'contribution' && !t.cancelled);
  const refunds = transactions.filter(t => t.type === 'refund');
  const cancelledTransactions = transactions.filter(t => t.cancelled);
  
  const totalContributionAmount = contributions.reduce((sum, t) => sum + t.amount, 0);
  const totalRefundAmount = refunds.reduce((sum, t) => sum + t.amount, 0);
  
  return {
    total: transactions.length,
    contributions: contributions.length,
    refunds: refunds.length,
    cancelled: cancelledTransactions.length,
    totalContributionAmount,
    totalRefundAmount,
    netAmount: totalContributionAmount - totalRefundAmount
  };
};

// Get daily statistics for the last n days
export const getDailyStats = (days: number = 30) => {
  const collections = getCollections();
  const transactions = getTransactions();
  const users = getUsers();
  
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;
  const result = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now - i * msPerDay);
    const day = date.toISOString().split('T')[0];
    
    const dayStart = new Date(day).getTime();
    const dayEnd = dayStart + msPerDay;
    
    const newCollections = collections.filter(c => c.createdAt >= dayStart && c.createdAt < dayEnd);
    const newTransactions = transactions.filter(t => t.timestamp >= dayStart && t.timestamp < dayEnd && !t.cancelled);
    const newUsers = users.filter(u => u.createdAt >= dayStart && u.createdAt < dayEnd);
    
    const dailyAmount = newTransactions
      .filter(t => t.type === 'contribution')
      .reduce((sum, t) => sum + t.amount, 0);
    
    result.push({
      date: day,
      collections: newCollections.length,
      transactions: newTransactions.length,
      users: newUsers.length,
      amount: dailyAmount
    });
  }
  
  return result.reverse();
};
