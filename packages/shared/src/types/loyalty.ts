export type LoyaltyActionType = 'EARN' | 'REDEEM' | 'ADJUST';

export interface LoyaltyLedger {
  id: string;
  userId: string;
  points: number;
  type: LoyaltyActionType;
  ref: string | null;
  createdAt: Date;
}

export interface LoyaltyInfo {
  user: {
    id: string;
    name: string | null;
    email: string;
    points: number;
    tier: string;
    benefits: {
      multiplier: number;
      perks: string[];
    };
  };
  recentTransactions: Array<{
    id: string;
    points: number;
    type: LoyaltyActionType;
    ref: string | null;
    createdAt: Date;
  }>;
  pointsValue: {
    currency: string;
    rate: number;
    description: string;
  };
}