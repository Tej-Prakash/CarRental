
export interface Car {
  id: string;
  name: string;
  type: 'Sedan' | 'SUV' | 'Hatchback' | 'Truck' | 'Van' | 'Convertible' | 'Coupe';
  pricePerHour: number; // Changed from pricePerDay
  minNegotiablePrice?: number; // Now refers to hourly rate
  maxNegotiablePrice?: number; // Now refers to hourly rate
  imageUrls: string[]; 
  description: string;
  longDescription: string;
  features: string[];
  availability: { startDate: string; endDate:string }[]; // These remain as full dates for general car availability
  seats: number;
  engine: string;
  transmission: 'Automatic' | 'Manual';
  fuelType: 'Gasoline' | 'Diesel' | 'Electric' | 'Hybrid';
  rating: number; // 0-5
  reviews: number; // number of reviews
  location: string; // e.g., "Downtown Cityville"
  aiHint?: string; // General hint for the car or its primary image
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface UserDocument {
  type: 'PhotoID' | 'DrivingLicense';
  fileName: string;
  uploadedAt: string; // ISO date string
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'User' | 'Admin';
  createdAt: string; // ISO date string
  address?: Address;
  location?: string;
  documents?: UserDocument[];
  resetPasswordToken?: string;
  resetPasswordExpires?: Date; // Storing as Date object in DB, will be string in some API responses
}

export interface Booking {
  id: string; // from MongoDB _id
  carId: string;
  carName: string; 
  carImageUrl?: string; 
  userId: string;
  userName: string; 
  startDate: string; // Full ISO date-time string
  endDate: string; // Full ISO date-time string
  totalPrice: number;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'Cancellation Requested' | 'Cancellation Rejected';
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
  razorpayOrderId?: string; // For Razorpay
  razorpayPaymentId?: string; // For Razorpay
}

export interface SiteSettings {
  id?: string; // In MongoDB, this will be _id
  siteTitle: string;
  defaultCurrency: 'USD' | 'EUR' | 'GBP' | 'INR';
  updatedAt?: string; // ISO date string
}

