
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

export interface ChatStats {
  chatId: number;
  title?: string;
  membersCount?: number;
  collectionsCreated: number;
  lastActivity?: number;
  isActive: boolean;
}
