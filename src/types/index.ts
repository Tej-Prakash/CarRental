
export interface Car {
  id: string;
  name: string;
  type: 'Sedan' | 'SUV' | 'Hatchback' | 'Truck' | 'Van' | 'Convertible' | 'Coupe';
  pricePerHour: number;
  minNegotiablePrice?: number;
  maxNegotiablePrice?: number;
  imageUrls: string[];
  description: string;
  longDescription: string;
  features: string[];
  availability: { startDate: string; endDate:string }[];
  seats: number;
  engine: string;
  transmission: 'Automatic' | 'Manual';
  fuelType: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
  rating: number;
  reviews: number;
  location: string;
  aiHint?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export type DocumentStatus = 'Pending' | 'Approved' | 'Rejected';
export type DocumentType = 'PhotoID' | 'DrivingLicense';

export interface UserDocument {
  type: DocumentType;
  fileName: string;
  filePath: string;
  uploadedAt: string;
  status: DocumentStatus;
  adminComments?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export type UserRole = 'Customer' | 'Manager' | 'Admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string; // Added phoneNumber
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
  address?: Address;
  location?: string;
  documents?: UserDocument[];
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  favoriteCarIds?: string[];
}

export interface Booking {
  id: string;
  carId: string;
  carName: string;
  carImageUrl?: string;
  userId: string;
  userName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'Cancellation Requested' | 'Cancellation Rejected';
  createdAt?: string;
  updatedAt?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

export interface BookingDocument extends Omit<Booking, 'id'> {
  _id: import('mongodb').ObjectId;
}


export interface SiteSettings {
  id?: string;
  siteTitle: string;
  defaultCurrency: 'USD' | 'EUR' | 'GBP' | 'INR';
  maintenanceMode?: boolean;
  sessionTimeoutMinutes?: number;
  updatedAt?: string;

  // SMTP Settings - store sensitive data with caution
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string; 
  smtpSecure?: boolean; 
  emailFrom?: string; 
}
