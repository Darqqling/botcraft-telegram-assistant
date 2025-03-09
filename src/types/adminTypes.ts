
export type AdminRole = 'super_admin' | 'moderator' | 'support';

export interface Admin {
  id: number;
  userId: number;
  role: AdminRole;
  createdAt: number;
  lastLogin?: number;
}

export interface AdminLog {
  id: string;
  adminId: number;
  action: string;
  details: string;
  targetType?: 'collection' | 'user' | 'transaction' | 'chat' | 'system';
  targetId?: string | number;
  timestamp: number;
}

export interface BotSettings {
  minimumCollectionAmount: number;
  maximumCollectionAmount: number;
  defaultCollectionDuration: number;
  reminderFrequencyDays: number;
  enabledCommands: string[];
  featuresEnabled: {
    groupCollections: boolean;
    giftVoting: boolean;
    reminders: boolean;
    statistics: boolean;
  };
}

// Типы для чатов и истории сообщений
export interface GroupChat {
  id: number;
  title: string;
  memberCount?: number;
  isActive?: boolean;
  createdAt?: number;
}

export interface ChatHistory {
  id: string;
  chatId: number;
  userId?: number;
  messageText: string;
  isFromUser: boolean;
  timestamp: number;
}

export interface ChatStats {
  chatId: number;
  messageCount: number;
  commandCount: number;
  userCount: number;
  collectionsCreated: number;
  lastActivity: number;
  isActive: boolean; // Added this property to fix the TS error
}
