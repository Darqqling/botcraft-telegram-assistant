
export type CollectionStatus = 'pending' | 'active' | 'completed' | 'cancelled' | 'frozen';

export interface CollectionParticipant {
  userId: number;
  collectionId: string;
  contribution: number;
  hasPaid: boolean;
  vote?: string;
  lastReminder?: number;
}

export interface GiftOption {
  id: string;
  collectionId: string;
  title: string;
  description?: string;
  votes: number;
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  status: CollectionStatus;
  organizerId: number;
  giftRecipientId?: number;
  participants: CollectionParticipant[];
  groupChatId?: number;
  giftOptions: GiftOption[];
  createdAt: number;
  updatedAt: number;
  deadline?: number;
}

export interface User {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  chatId: number;
  createdAt: number;
  isBlocked?: boolean;
  blockReason?: string;
  blockedAt?: number;
}

export interface Transaction {
  id: string;
  collectionId: string;
  userId: number;
  amount: number;
  type: 'contribution' | 'refund';
  timestamp: number;
  cancelled?: boolean;
  cancelReason?: string;
  cancelledAt?: number;
}

export interface ChatMessage {
  id: string;
  chatId: number;
  userId?: number;
  messageText: string;
  isFromUser: boolean;
  timestamp: number;
}

export interface GroupChat {
  id: number;
  title: string;
  isActive: boolean;
  memberCount: number;
  lastActivity: number;
  collectionsCount: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  userId?: number;
  action: string;
  details: string;
  ip?: string;
}

export interface ActivityLogEntry {
  id: string;
  type: string;
  userId: number;
  timestamp: number;
  collectionId?: string;
  amount?: number;
  text?: string;
  chatId?: number;
  isFromUser?: boolean;
}
