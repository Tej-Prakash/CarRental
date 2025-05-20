
// src/lib/schemas/car.ts
import { z } from 'zod';

// Base schema for car properties, used for both create and update.
// Refinements that depend on inter-field relations (like pricePerDay vs min/maxNegotiablePrice)
// are applied to the final CarInputSchema.
const BaseCarSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(['Sedan', 'SUV', 'Hatchback', 'Truck', 'Van', 'Convertible', 'Coupe']),
  pricePerDay: z.number().positive("Price per day must be positive"),
  minNegotiablePrice: z.number().positive("Minimum negotiable price must be positive").optional(),
  maxNegotiablePrice: z.number().positive("Maximum negotiable price must be positive").optional(),
  imageUrls: z.array(z.string().url("Each image URL must be valid")).min(1, "At least one image URL is required"),
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
  aiHint: z.string().max(50, "AI hint should be concise (max 50 chars)").optional(), // Added max length for aiHint
});

// Schema for creating a new car, with inter-field validations.
export const CarInputSchema = BaseCarSchema
  .refine(data => {
    if (data.minNegotiablePrice && data.minNegotiablePrice > data.pricePerDay) {
      return false;
    }
    return true;
  }, {
    message: "Minimum negotiable price cannot be greater than the daily price.",
    path: ["minNegotiablePrice"],
  })
  .refine(data => {
    if (data.maxNegotiablePrice && data.maxNegotiablePrice < data.pricePerDay) {
      return false;
    }
    return true;
  }, {
    message: "Maximum negotiable price cannot be less than the daily price.",
    path: ["maxNegotiablePrice"],
  })
  .refine(data => {
    if (data.minNegotiablePrice && data.maxNegotiablePrice && data.minNegotiablePrice > data.maxNegotiablePrice) {
      return false;
    }
    return true;
  }, {
    message: "Minimum negotiable price cannot be greater than maximum negotiable price.",
    path: ["minNegotiablePrice"], // Or could be ["maxNegotiablePrice"] or a general path
  });

// Schema for updating an existing car (all fields are optional).
// This inherits the refinements from CarInputSchema. If a field involved in a refinement
// is provided in an update, the refinement will be checked.
export const UpdateCarInputSchema = CarInputSchema.partial();

export type CarInput = z.infer<typeof CarInputSchema>;
export type UpdateCarInput = z.infer<typeof UpdateCarInputSchema>;
