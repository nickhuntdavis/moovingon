export type ItemStatus = 'AVAILABLE' | 'RESERVED' | 'TAKEN';

export enum Condition {
  NEW = 'Like New',
  GOOD = 'Good as new',
  FAIR = 'Fair',
  USED = 'Well Loved'
}

export interface Interest {
  name: string;
  timestamp: number;
  type: 'TAKE' | 'INTEREST';
  question?: string;
}

export interface Item {
  id: string;
  title: string;
  description?: string;
  price: number;
  condition: Condition;
  status: ItemStatus;
  images: string[];
  interestedParties: Interest[];
  createdAt: number;
}

export type ViewMode = 'ADMIN' | 'FRIEND';