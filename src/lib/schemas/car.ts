
// src/lib/schemas/car.ts
import { z } from 'zod';

// Base schema for car properties, used for both create and update.
const BaseCarSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(['Sedan', 'SUV', 'Hatchback', 'Truck', 'Van', 'Convertible', 'Coupe']),
  pricePerDay: z.number().positive("Price per day must be positive"),
  minNegotiablePrice: z.number().positive("Minimum negotiable price must be positive").optional(),
  maxNegotiablePrice: z.number().positive("Maximum negotiable price must be positive").optional(),
  // Ensure imageUrls are relative paths for local storage or valid URLs for external
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
  fuelType: z.enum(['Gasoline', 'Diesel', 'Electric', 'Hybrid']),
  rating: z.number().min(0).max(5).optional().default(0),
  reviews: z.number().int().min(0).optional().default(0),
  location: z.string().min(1, "Location is required"),
  aiHint: z.string().max(50, "AI hint should be concise (max 50 chars)").optional(),
});

// Schema for creating a new car, with inter-field validations.
export const CarInputSchema = BaseCarSchema
  .refine(data => {
    if (data.minNegotiablePrice !== undefined && data.pricePerDay !== undefined && data.minNegotiablePrice > data.pricePerDay) {
      return false;
    }
    return true;
  }, {
    message: "Minimum negotiable price cannot be greater than the daily price.",
    path: ["minNegotiablePrice"],
  })
  .refine(data => {
    if (data.maxNegotiablePrice !== undefined && data.pricePerDay !== undefined && data.maxNegotiablePrice < data.pricePerDay) {
      return false;
    }
    return true;
  }, {
    message: "Maximum negotiable price cannot be less than the daily price.",
    path: ["maxNegotiablePrice"],
  })
  .refine(data => {
    if (data.minNegotiablePrice !== undefined && data.maxNegotiablePrice !== undefined && data.minNegotiablePrice > data.maxNegotiablePrice) {
      return false;
    }
    return true;
  }, {
    message: "Minimum negotiable price cannot be greater than maximum negotiable price.",
    path: ["minNegotiablePrice"], 
  });

// Schema for updating an existing car (all fields are optional from BaseCarSchema).
export const UpdateCarInputSchema = BaseCarSchema.partial()
  .extend({
    // For updates, imageUrls can be an empty array (to remove all images), or an array of valid URLs/paths.
    // If not provided, it won't be updated. If provided as empty array, it means clear all images.
    // If provided with items, then each item must be a valid URL/path.
    imageUrls: z.array(z.string().refine(val => val.startsWith('/assets/images/') || z.string().url().safeParse(val).success, "Each image URL must be valid or a relative path starting with /assets/images/")).optional(),
  })
  .refine(data => {
    // If minNegotiablePrice and pricePerDay are both being updated, or one is updated and other exists
    if (data.minNegotiablePrice !== undefined && data.pricePerDay !== undefined) {
      if (data.minNegotiablePrice > data.pricePerDay) return false;
    }
    return true;
  }, {
    message: "Minimum negotiable price cannot be greater than the daily price.",
    path: ["minNegotiablePrice"],
  })
  .refine(data => {
    if (data.maxNegotiablePrice !== undefined && data.pricePerDay !== undefined) {
      if (data.maxNegotiablePrice < data.pricePerDay) return false;
    }
    return true;
  }, {
    message: "Maximum negotiable price cannot be less than the daily price.",
    path: ["maxNegotiablePrice"],
  })
  .refine(data => {
    if (data.minNegotiablePrice !== undefined && data.maxNegotiablePrice !== undefined) {
      if (data.minNegotiablePrice > data.maxNegotiablePrice) return false;
    }
    return true;
  }, {
    message: "Minimum negotiable price cannot be greater than maximum negotiable price.",
    path: ["minNegotiablePrice"],
  })
  // If array fields are provided for update and are not undefined, they should not be empty (unless it's imageUrls).
  .refine(data => data.features === undefined || data.features.length > 0, {
    message: "If features are provided for update, at least one feature must be included.",
    path: ["features"],
  })
  .refine(data => data.availability === undefined || (data.availability.length > 0 && data.availability.every(a => a.startDate && a.endDate && !isNaN(Date.parse(a.startDate)) && !isNaN(Date.parse(a.endDate)))), {
    message: "If availability is provided for update, it must contain at least one valid date range.",
    path: ["availability"],
  });


export type CarInput = z.infer<typeof CarInputSchema>;
export type UpdateCarInput = z.infer<typeof UpdateCarInputSchema>;
