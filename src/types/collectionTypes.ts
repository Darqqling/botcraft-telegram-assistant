
export type CollectionStatus = 'pending' | 'active' | 'completed' | 'cancelled';

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
  createdAt: number;
  updatedAt: number;
}

export interface CollectionParticipant {
  userId: number;
  collectionId: string;
  contribution: number;
  hasPaid: boolean;
}

export interface Transaction {
  id: string;
  collectionId: string;
  userId: number;
  amount: number;
  type: 'contribution' | 'refund';
  timestamp: number;
}
