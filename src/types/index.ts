
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
