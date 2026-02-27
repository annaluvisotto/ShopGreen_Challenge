export enum UserRole {
  ANONYMOUS = 'anonimo',
  USER = 'utente',
  OPERATOR = 'operatore'
}

export enum ShopCategory {
  CLOTHING = 'vestiario',
  FOOD = 'alimenti',
  HOME_CARE = 'cura della casa e della persona',
  OTHER = 'altro'
}

export enum ShopStatus {
  OPEN = 'OPEN',
  OPENING_SOON = 'OPENING_SOON',
  CLOSED = 'CLOSED',
  UNVERIFIED = 'UNVERIFIED'
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Review {
  id: string;
  user: string;
  comment: string;
  date: string;
}

export interface Shop {
  id: string;
  name: string;
  categories: ShopCategory[];
  status: ShopStatus;
  coordinates: Coordinates;
  description: string,
  hours: string;
  rawHours?: any;
  imageUrl?: string;
  website?: string;
  googleMapsLink?: string; 
  iosMapsLink?: string;    
  sustainabilityScore: number; 
  votes: Record<string, 'up' | 'down'>;
  reviews: Review[];
  isEcommerce?: boolean;
  ownerId?: string;
  pendingOwnerId?: string;
  verifiedByOperator?: boolean;
}

export interface ShopFavorite {
  id: string;
  name: string;
  status: ShopStatus;
  coordinates: Coordinates;
}

export interface Zone {
  id: string;
  name: string;
  center: Coordinates;
}

export interface Seller {
  id: string;
  username: string;
  zoneIds: string[]; 
  categories: string[]; 
  platformLinks: string[];
  avatarUrl: string;
  bio?: string; 
}

export enum NotificationType {
  SYSTEM = 'SYSTEM',
  PROMO = 'PROMO',
  REPORT = 'REPORT'  
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  previewText: string;
  fullDescription: string;
  date: string;
  read: boolean;
  imageUrl?: string; 
  shopId?: string;  
  shopName?: string; 
  licenseId?: string; 
  reporterId?: string; 
  pendingOwnerId?: string;
  category?: string;            
  address?: string;           
  name?: string;
  verifiedByOperator?: boolean;
}

export interface UserVote {
  id: string;
  isPositive: boolean;
}

export interface VoteStats {
  success: boolean;
  positiveCount: number;
  negativeCount: number;
}

