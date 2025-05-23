// src/lib/schemas/car.ts
import { z } from 'zod';

// Base schema for car properties, used for both create and update.
const BaseCarSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(['Sedan', 'SUV', 'Hatchback', 'Truck', 'Van', 'Convertible', 'Coupe']),
  pricePerHour: z.number().positive("Price per hour must be positive"),
  minNegotiablePrice: z.number().positive("Minimum negotiable hourly price must be positive").optional(),
  maxNegotiablePrice: z.number().positive("Maximum negotiable hourly price must be positive").optional(),
  discountPercent: z.number().min(0, "Discount cannot be negative").max(100, "Discount cannot exceed 100%").optional(), // New discount field
  imageUrls: z.array(z.string().refine(val => val.startsWith('/assets/images/') || z.string().url().safeParse(val).success, "Each image URL must be valid or a relative path starting with /assets/images/")).min(1, "At least one image URL is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  longDescription: z.string().min(20, "Long description must be at least 20 characters"),
  features: z.array(z.string()).min(1, "At least one feature is required"),
  availability: z.array(z.object({ 
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end date"),
  })).min(1, "Availability is required"),
  seats: z.number().int().min(1, "Seats must be at least 1"),
  engine: z.string().min(1, "Engine details are required"),
  transmission: z.enum(['Automatic', 'Manual']),
  fuelType: z.enum(['Petrol', 'Diesel', 'Electric', 'Hybrid']),
  rating: z.number().min(0).max(5).optional().default(0),
  reviews: z.number().int().min(0).optional().default(0),
  location: z.string().min(1, "Location is required"),
  aiHint: z.string().max(50, "AI hint should be concise (max 50 chars)").optional(),
});

// Schema for creating a new car, with inter-field validations.
export const CarInputSchema = BaseCarSchema
  .refine(data => {
    if (data.minNegotiablePrice !== undefined && data.pricePerHour !== undefined && data.minNegotiablePrice > data.pricePerHour) {
      return false;
    }
    return true;
  }, {
    message: "Minimum negotiable hourly price cannot be greater than the hourly price.",
    path: ["minNegotiablePrice"],
  })
  .refine(data => {
    if (data.maxNegotiablePrice !== undefined && data.pricePerHour !== undefined && data.maxNegotiablePrice < data.pricePerHour) {
      return false;
    }
    return true;
  }, {
    message: "Maximum negotiable hourly price cannot be less than the hourly price.",
    path: ["maxNegotiablePrice"],
  })
  .refine(data => {
    if (data.minNegotiablePrice !== undefined && data.maxNegotiablePrice !== undefined && data.minNegotiablePrice > data.maxNegotiablePrice) {
      return false;
    }
    return true;
  }, {
    message: "Minimum negotiable hourly price cannot be greater than maximum negotiable hourly price.",
    path: ["minNegotiablePrice"], 
  });

// Schema for updating an existing car.
export const UpdateCarInputSchema = BaseCarSchema.partial()
  .extend({
    imageUrls: z.array(z.string().refine(val => val.startsWith('/assets/images/') || z.string().url().safeParse(val).success, "Each image URL must be valid or a relative path starting with /assets/images/")).optional(),
  })
  .refine(data => {
    const effectivePricePerHour = data.pricePerHour;
    if (data.minNegotiablePrice !== undefined && effectivePricePerHour !== undefined) {
      if (data.minNegotiablePrice > effectivePricePerHour) return false;
    }
    return true;
  }, {
    message: "Minimum negotiable hourly price cannot be greater than the hourly price.",
    path: ["minNegotiablePrice"],
  })
  .refine(data => {
    const effectivePricePerHour = data.pricePerHour;
    if (data.maxNegotiablePrice !== undefined && effectivePricePerHour !== undefined) {
      if (data.maxNegotiablePrice < effectivePricePerHour) return false;
    }
    return true;
  }, {
    message: "Maximum negotiable hourly price cannot be less than the hourly price.",
    path: ["maxNegotiablePrice"],
  })
  .refine(data => {
    if (data.minNegotiablePrice !== undefined && data.maxNegotiablePrice !== undefined) {
      if (data.minNegotiablePrice > data.maxNegotiablePrice) return false;
    }
    return true;
  }, {
    message: "Minimum negotiable hourly price cannot be greater than maximum negotiable hourly price.",
    path: ["minNegotiablePrice"],
  })
  .refine(data => data.features === undefined || (Array.isArray(data.features) && data.features.length > 0), {
    message: "If features are provided for update, at least one feature must be included.",
    path: ["features"],
  })
  .refine(data => data.imageUrls === undefined || (Array.isArray(data.imageUrls) && data.imageUrls.length >= 0), { 
      message: "If imageUrls are provided for update, it must be an array.",
      path: ["imageUrls"],
  })
  .refine(data => data.availability === undefined || (Array.isArray(data.availability) && data.availability.length > 0 && data.availability.every(a => a.startDate && a.endDate && !isNaN(Date.parse(a.startDate)) && !isNaN(Date.parse(a.endDate)))), {
    message: "If availability is provided for update, it must contain at least one valid date range.",
    path: ["availability"],
  });


export type CarInput = z.infer<typeof CarInputSchema>;
export type UpdateCarInput = z.infer<typeof UpdateCarInputSchema>;