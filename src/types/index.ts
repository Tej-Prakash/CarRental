
export interface Car {
  id: string;
  name: string;
  type: 'Sedan' | 'SUV' | 'Hatchback' | 'Truck' | 'Van' | 'Convertible' | 'Coupe';
  pricePerDay: number;
  imageUrl: string;
  description: string;
  longDescription: string;
  features: string[];
  availability: { startDate: string; endDate:string }[]; // General model availability, not real-time
  seats: number;
  engine: string;
  transmission: 'Automatic' | 'Manual';
  fuelType: 'Gasoline' | 'Diesel' | 'Electric' | 'Hybrid';
  rating: number; // 0-5
  reviews: number; // number of reviews
  location: string; // e.g. "Downtown Cityville"
  aiHint?: string; // for placeholder images
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
  // In a real app, you'd have a fileUrl here pointing to cloud storage
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
}

export interface Booking {
  id: string; // from MongoDB _id
  carId: string;
  carName: string; 
  carImageUrl: string;
  userId: string;
  userName: string; 
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  totalPrice: number;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}

export interface SiteSettings {
  id?: string; // In MongoDB, this will be _id
  siteTitle: string;
  // Add other settings like logoUrl, faviconUrl here later if needed
  updatedAt?: string; // ISO date string
}
