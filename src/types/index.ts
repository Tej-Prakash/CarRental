
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
  fuelType: 'Gasoline' | 'Diesel' | 'Electric' | 'Hybrid';
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

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'User' | 'Admin';
  createdAt: string; 
  updatedAt?: string; 
  address?: Address;
  location?: string;
  documents?: UserDocument[];
  resetPasswordToken?: string;
  resetPasswordExpires?: Date; 
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
  maintenanceMode?: boolean; // Added maintenanceMode
  updatedAt?: string; 
}
