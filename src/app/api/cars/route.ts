
// src/app/api/cars/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { Car, Booking } from '@/types';
import { ObjectId, type Filter } from 'mongodb';
import { parseISO, isValid } from 'date-fns';

interface CarDocument extends Omit<Car, 'id'> {
  _id: ObjectId;
}

const ITEMS_PER_PAGE = 9;

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const carsCollection = db.collection<CarDocument>('cars');
    const bookingsCollection = db.collection<Booking>('bookings');

    const { searchParams } = new URL(req.url);
    const searchTerm = searchParams.get('search');
    const carType = searchParams.get('type');
    const minPriceStr = searchParams.get('minPrice'); 
    const maxPriceStr = searchParams.get('maxPrice'); 
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || ITEMS_PER_PAGE.toString(), 10);
    
    // New search parameters
    const locationSearch = searchParams.get('location');
    const searchStartDateParam = searchParams.get('searchStartDate');
    const searchEndDateParam = searchParams.get('searchEndDate');

    const query: Filter<CarDocument> = {};

    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { longDescription: { $regex: searchTerm, $options: 'i' } },
      ];
    }
    if (carType && carType !== 'all') {
      query.type = carType as Car['type'];
    }
    if (locationSearch) {
      query.location = { $regex: locationSearch, $options: 'i' };
    }

    const priceConditions: Record<string, number> = {};
    if (minPriceStr) {
      const minPrice = parseFloat(minPriceStr);
      if (!isNaN(minPrice)) priceConditions.$gte = minPrice;
    }
    if (maxPriceStr) {
      const maxPrice = parseFloat(maxPriceStr);
      if (!isNaN(maxPrice)) priceConditions.$lte = maxPrice;
    }
    if (Object.keys(priceConditions).length > 0) {
      query.pricePerHour = priceConditions; 
    }
    
    // Fetch all cars matching non-date criteria first
    let candidateCars = await carsCollection.find(query).toArray();
    let availableCars: CarDocument[] = [];

    // Date/Time filtering logic
    if (searchStartDateParam && searchEndDateParam && isValid(parseISO(searchStartDateParam)) && isValid(parseISO(searchEndDateParam))) {
      const searchStart = parseISO(searchStartDateParam);
      const searchEnd = parseISO(searchEndDateParam);

      for (const car of candidateCars) {
        // 1. Check general availability of the car model
        const isGenerallyAvailable = car.availability.some(avail => {
          const availStart = parseISO(avail.startDate);
          const availEnd = parseISO(avail.endDate);
          // Ensure search range is within or overlaps with at least one general availability period
          // A simple overlap check: (StartA < EndB) and (EndA > StartB)
          return searchStart < availEnd && searchEnd > availStart;
        });

        if (!isGenerallyAvailable) {
          continue; // Skip car if not generally available
        }

        // 2. Check for conflicting bookings
        const conflictingBookings = await bookingsCollection.countDocuments({
          carId: car._id.toHexString(),
          status: 'Confirmed',
          $or: [ // Standard overlap check
            { startDate: { $lt: searchEndDateParam }, endDate: { $gt: searchStartDateParam } },
          ],
        });

        if (conflictingBookings === 0) {
          availableCars.push(car);
        }
      }
    } else {
      // If no date search, all candidates are considered available (subject to other filters)
      availableCars = candidateCars;
    }
    
    const totalItems = availableCars.length;
    const totalPages = Math.ceil(totalItems / limit);
    
    // Apply pagination to the final list of available cars
    const paginatedCars = availableCars.slice((page - 1) * limit, page * limit);

    const carsData: Car[] = paginatedCars.map(carDoc => {
      const { _id, ...rest } = carDoc;
      return {
        id: _id.toHexString(),
        ...rest,
        pricePerHour: rest.pricePerHour,
        availability: rest.availability.map(a => ({ 
            startDate: typeof a.startDate === 'string' ? a.startDate : new Date(a.startDate).toISOString(), 
            endDate: typeof a.endDate === 'string' ? a.endDate : new Date(a.endDate).toISOString() 
        })),
      };
    });

    return NextResponse.json({
      data: carsData,
      totalItems,
      totalPages,
      currentPage: page,
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch cars:', error);
    return NextResponse.json({ message: 'Failed to fetch cars' }, { status: 500 });
  }
}
