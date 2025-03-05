
export type CollectionStatus = 'pending' | 'active' | 'completed' | 'cancelled';
export type GiftType = 'physical' | 'digital';

export interface User {
  id: number;
  username?: string;
  firstName: string;
  lastName?: string;
  chatId: number;
}

export interface Collection {
  id: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  status: CollectionStatus;
  organizerId: number;
  giftRecipientId?: number;
  participants: CollectionParticipant[];
  groupChatId?: number;
  giftType?: GiftType;
  giftLink?: string;
  giftOptions?: GiftOption[];
  deadline?: number;
  createdAt: number;
  updatedAt: number;
}

export interface GiftOption {
  id: string;
  collectionId: string;
  title: string;
  description?: string;
  votes: number;
}

export interface CollectionParticipant {
  userId: number;
  collectionId: string;
  contribution: number;
  hasPaid: boolean;
  vote?: string; // ID of the gift option they voted for
}

export interface Transaction {
  id: string;
  collectionId: string;
  userId: number;
  amount: number;
  type: 'contribution' | 'refund';
  timestamp: number;
}
