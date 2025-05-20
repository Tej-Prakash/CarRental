
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

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'User' | 'Admin';
  createdAt: string; // ISO date string
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
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
