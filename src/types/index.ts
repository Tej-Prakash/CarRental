
export interface Car {
  id: string;
  name: string;
  type: 'Sedan' | 'SUV' | 'Hatchback' | 'Truck' | 'Van' | 'Convertible' | 'Coupe';
  pricePerDay: number;
  imageUrl: string;
  description: string;
  longDescription: string;
  features: string[];
  availability: { startDate: string; endDate:string }[];
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
  id: string;
  carId: string;
  carName?: string; // Denormalized for easier display
  userId: string;
  userName?: string; // Denormalized
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  totalPrice: number;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
}
