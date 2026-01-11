
export type UserRole = 'DONOR' | 'NGO' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  location?: string;
  isVerified?: boolean;
}

export enum DonationStatus {
  ACTIVE = 'Active',
  PENDING_PICKUP = 'Pending Pickup',
  COMPLETED = 'Completed',
  WITHDRAWN = 'Withdrawn',
  REJECTED = 'Rejected'
}

export interface Donation {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  status: DonationStatus;
  location: string;
  postedAt: string;
  imageUrl: string;
  donorId: string;
  requestsCount: number;
}

export interface NGO {
  id: string;
  name: string;
  category: string;
  location: string;
  distance: string;
  isVerified: boolean;
  impactScore?: number;
  mission?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  imageUrl?: string;
}
