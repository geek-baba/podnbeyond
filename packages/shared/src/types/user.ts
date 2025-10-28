export type UserRole = 'ADMIN' | 'STAFF' | 'GUEST';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  points: number;
  tier: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  points: number;
  tier: string;
}