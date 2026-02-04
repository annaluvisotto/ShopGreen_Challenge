export enum UserRole {
  ANONYMOUS = 'anonimo',
  USER = 'utente',
  OPERATOR = 'operatore',
  SELLER = 'venditore'
}

export enum ShopCategory {
  CLOTHING = 'vestiario',
  FOOD = 'alimenti',
  HOME_CARE = 'cura della casa e della persona',
  OTHER = 'altro'
}

export enum ShopStatus {
  OPEN = 'OPEN', // Green
  OPENING_SOON = 'OPENING_SOON', // Yellow
  CLOSED = 'CLOSED', // Red
  UNVERIFIED = 'UNVERIFIED' // Grey
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
  imageUrl?: string; // New field for popup header
  website?: string;
  googleMapsLink?: string; 
  iosMapsLink?: string;    
  sustainabilityScore: number; 
  votes: Record<string, 'up' | 'down'>; // Maps userName -> vote type (one vote per user)
  reviews: Review[];
  isEcommerce?: boolean;
  ownerId?: string; // RF11: Username of the associated seller
  pendingOwnerId?: string;
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
  SYSTEM = 'SYSTEM', // Generic info
  PROMO = 'PROMO',   // For Users: Offers
  REPORT = 'REPORT'  // For Operators: New shops to verify
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  previewText: string;
  fullDescription: string;
  date: string;
  read: boolean;
  // Specific fields
  imageUrl?: string; // For Promos
  shopId?: string;   // For Reports (link to shop)
  shopName?: string; // For Reports
  licenseId?: string; // For Reports (Operator check)
  reporterId?: string; // The username/ID of the user who submitted the report
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