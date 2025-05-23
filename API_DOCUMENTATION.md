
# Travel Yatra API Documentation

This document provides an overview of the backend API endpoints available in the Travel Yatra application.

**Authentication:**
- Most user-specific and admin APIs require a JSON Web Token (JWT) to be sent in the `Authorization` header as a Bearer token (e.g., `Authorization: Bearer <YOUR_JWT_TOKEN>`).
- Public APIs do not require authentication.

**Base URL:** All API routes are relative to your application's base URL (e.g., `http://localhost:9002` during development).

---

## 1. Authentication APIs (`/api/auth`)

### 1.1. User Registration
- **Endpoint:** `POST /api/auth/register`
- **Description:** Registers a new user (customer).
- **Authentication:** Public
- **Request Body:**
  ```json
  {
    "fullName": "string",
    "email": "string (email format)",
    "phoneNumber": "string (optional)",
    "password": "string (min 6 characters)"
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "id": "string (MongoDB ObjectId)",
      "name": "string",
      "email": "string",
      "phoneNumber": "string (optional)",
      "role": "Customer",
      "createdAt": "string (ISO date)"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Missing fields, password too short.
  - `409 Conflict`: User already exists with this email.
  - `500 Internal Server Error`: Server-side issue.

### 1.2. User Login
- **Endpoint:** `POST /api/auth/login`
- **Description:** Logs in an existing user and returns a JWT.
- **Authentication:** Public
- **Request Body:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "message": "Login successful",
    "token": "string (JWT)",
    "user": {
      "id": "string (MongoDB ObjectId)",
      "name": "string",
      "email": "string",
      "phoneNumber": "string (optional)",
      "role": "Customer | Manager | Admin",
      "createdAt": "string (ISO date)",
      // ... other user fields excluding passwordHash
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Missing email or password.
  - `401 Unauthorized`: Invalid credentials.
  - `500 Internal Server Error`: JWT secret not configured or other server issues.

### 1.3. Forgot Password
- **Endpoint:** `POST /api/auth/forgot-password`
- **Description:** Initiates the password reset process by sending a reset link to the user's email.
- **Authentication:** Public
- **Request Body:**
  ```json
  {
    "email": "string"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "message": "If an account with that email exists, a password reset link has been sent."
  }
  ```
  *(Note: Always returns a generic success message to prevent email enumeration.)*
- **Error Responses:**
  - `400 Bad Request`: Email is required.
  - `500 Internal Server Error`: Email sending failure or other server issues.

### 1.4. Reset Password
- **Endpoint:** `POST /api/auth/reset-password`
- **Description:** Resets the user's password using a valid token.
- **Authentication:** Public
- **Request Body:**
  ```json
  {
    "token": "string (reset token from email)",
    "password": "string (new password, min 6 characters)"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "message": "Your password has been successfully reset. You can now log in with your new password."
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Token/password required, password too short, token invalid or expired.
  - `500 Internal Server Error`: Server-side issue.

---

## 2. Public Cars APIs (`/api/cars`)

### 2.1. Get All Cars (Public Listing)
- **Endpoint:** `GET /api/cars`
- **Description:** Fetches a paginated list of cars for public browsing. Supports filtering and searching.
- **Authentication:** Public
- **Query Parameters:**
  - `page` (number, optional, default: 1): Page number for pagination.
  - `limit` (number, optional, default: 9): Items per page.
  - `search` (string, optional): Search term for car name, description.
  - `type` (string, optional, e.g., 'Sedan', 'SUV'): Filter by car type.
  - `minPrice` (number, optional): Minimum price per hour.
  - `maxPrice` (number, optional): Maximum price per hour.
- **Success Response (200 OK):**
  ```json
  {
    "data": [ /* Array of Car objects (see src/types/index.ts for Car structure) */ ],
    "totalItems": "number",
    "totalPages": "number",
    "currentPage": "number"
  }
  ```
- **Error Responses:**
  - `500 Internal Server Error`: Server-side issue.

### 2.2. Get Single Car Details (Public)
- **Endpoint:** `GET /api/cars/[id]`
- **Description:** Fetches details for a specific car by its ID.
- **Authentication:** Public
- **URL Parameters:**
  - `id` (string): The MongoDB ObjectId of the car.
- **Success Response (200 OK):**
  ```json
  // Car object (see src/types/index.ts for Car structure)
  {
    "id": "string",
    "name": "string",
    "type": "Sedan | SUV | ...",
    "pricePerHour": "number",
    // ... other car fields
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid car ID format.
  - `404 Not Found`: Car not found.
  - `500 Internal Server Error`: Server-side issue.

---

## 3. User Profile & Related APIs (`/api/profile`, `/api/bookings`)

### 3.1. Get User Profile
- **Endpoint:** `GET /api/profile`
- **Description:** Fetches the profile of the currently authenticated user.
- **Authentication:** User (JWT Required)
- **Success Response (200 OK):**
  ```json
  // User object (see src/types/index.ts for User structure, excluding passwordHash)
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "phoneNumber": "string (optional)",
    "role": "Customer | Manager | Admin",
    "address": { /* Address object */ },
    "location": "string",
    "documents": [ /* Array of UserDocument objects */ ],
    "favoriteCarIds": ["string"],
    "createdAt": "string (ISO date)"
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Authentication required or token invalid.
  - `404 Not Found`: User not found (should be rare if token is valid).
  - `500 Internal Server Error`.

### 3.2. Update User Profile
- **Endpoint:** `PUT /api/profile`
- **Description:** Updates the profile (name, address, location, phoneNumber) of the authenticated user.
- **Authentication:** User (JWT Required)
- **Request Body (Zod: ProfileUpdateSchema):**
  ```json
  {
    "name": "string (optional)",
    "phoneNumber": "string (optional, can be empty string to clear)",
    "address": { /* Address object, optional */ },
    "location": "string (optional)"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "message": "Profile updated successfully",
    "user": { /* Updated User object */ }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid profile data (validation failure).
  - `401 Unauthorized`.
  - `404 Not Found`.
  - `500 Internal Server Error`.

### 3.3. Record Uploaded Document
- **Endpoint:** `POST /api/profile/documents`
- **Description:** Records information about a document uploaded by the user (e.g., Photo ID, Driving License). The actual file upload should happen via `POST /api/upload`.
- **Authentication:** User (JWT Required)
- **Request Body (Zod: DocumentUploadSchema):**
  ```json
  {
    "documentType": "PhotoID | DrivingLicense",
    "fileName": "string (original filename)",
    "filePath": "string (path returned by /api/upload, e.g., /assets/documents/filename.jpg)"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "message": "Document details recorded successfully. Status: Pending. File stored at /assets/documents/...",
    "user": { /* Updated User object with new document entry */ }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid document data.
  - `401 Unauthorized`.
  - `404 Not Found`: User not found.
  - `500 Internal Server Error`.

### 3.4. Get User's Bookings
- **Endpoint:** `GET /api/profile/bookings`
- **Description:** Fetches all bookings made by the authenticated user.
- **Authentication:** User (JWT Required)
- **Success Response (200 OK):**
  ```json
  [ /* Array of Booking objects (see src/types/index.ts for Booking structure) */ ]
  ```
- **Error Responses:**
  - `401 Unauthorized`.
  - `500 Internal Server Error`.

### 3.5. Add Car to Favorites
- **Endpoint:** `POST /api/profile/favorites`
- **Description:** Adds a car to the authenticated user's list of favorite cars.
- **Authentication:** User (JWT Required)
- **Request Body:**
  ```json
  {
    "carId": "string (MongoDB ObjectId of the car)"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "favoriteCarIds": ["string"] // Updated array of favorite car IDs
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Missing `carId`.
  - `401 Unauthorized`.
  - `404 Not Found`: User not found.
  - `500 Internal Server Error`.

### 3.6. Get User's Favorite Cars
- **Endpoint:** `GET /api/profile/favorites`
- **Description:** Fetches the full details of all cars favorited by the authenticated user.
- **Authentication:** User (JWT Required)
- **Success Response (200 OK):**
  ```json
  [ /* Array of Car objects */ ]
  ```
- **Error Responses:**
  - `401 Unauthorized`.
  - `404 Not Found`: User not found.
  - `500 Internal Server Error`.

### 3.7. Remove Car from Favorites
- **Endpoint:** `DELETE /api/profile/favorites/[carId]`
- **Description:** Removes a car from the authenticated user's favorites.
- **Authentication:** User (JWT Required)
- **URL Parameters:**
  - `carId` (string): The MongoDB ObjectId of the car to remove.
- **Success Response (200 OK):**
  ```json
  {
    "favoriteCarIds": ["string"] // Updated array of favorite car IDs
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Missing `carId`.
  - `401 Unauthorized`.
  - `404 Not Found`: User not found.
  - `500 Internal Server Error`.

### 3.8. Create Booking (Directly by User)
- **Endpoint:** `POST /api/bookings`
- **Description:** Allows an authenticated user to create a new booking. This is an alternative to the Razorpay checkout flow, primarily for admin use or simpler booking scenarios.
- **Authentication:** User (JWT Required)
- **Request Body (Zod: BookingInputSchema):**
  ```json
  {
    "carId": "string (MongoDB ObjectId)",
    "startDate": "string (ISO date-time)",
    "endDate": "string (ISO date-time)",
    "status": "Pending | Confirmed | ..." // Optional, defaults to 'Confirmed' for user
  }
  ```
- **Success Response (201 Created):**
  ```json
  // Booking object (see src/types/index.ts)
  {
    "id": "string",
    // ... other booking fields
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid data, dates invalid, car not available.
  - `401 Unauthorized`.
  - `404 Not Found`: Car not found.
  - `409 Conflict`: Car already booked for the selected period.
  - `500 Internal Server Error`.

### 3.9. Request Booking Cancellation
- **Endpoint:** `POST /api/bookings/[bookingId]/request-cancellation`
- **Description:** Allows an authenticated user to request cancellation for their 'Confirmed' booking.
- **Authentication:** User (JWT Required)
- **URL Parameters:**
  - `bookingId` (string): The ID of the booking to request cancellation for.
- **Success Response (200 OK):**
  ```json
  {
    "message": "Cancellation requested successfully. Admin will review your request."
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid booking ID, booking cannot be cancelled (e.g., not 'Confirmed', already started).
  - `401 Unauthorized`.
  - `403 Forbidden`: User trying to cancel another user's booking.
  - `404 Not Found`: Booking not found.
  - `500 Internal Server Error`.

---

## 4. Checkout APIs (Razorpay)

### 4.1. Create Razorpay Order
- **Endpoint:** `POST /api/checkout/razorpay-order`
- **Description:** Creates a 'Pending' booking and a Razorpay order for payment.
- **Authentication:** User (JWT Required)
- **Request Body (Zod: CheckoutInputSchema):**
  ```json
  {
    "carId": "string (MongoDB ObjectId)",
    "startDate": "string (ISO date-time)",
    "endDate": "string (ISO date-time)"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "message": "Razorpay order created",
    "bookingId": "string (internal booking ID)",
    "razorpayOrderId": "string (Razorpay order_id)",
    "amount": "number (amount in paise)",
    "currency": "string (e.g., 'INR')",
    "keyId": "string (Razorpay public key ID)",
    "userName": "string",
    "userEmail": "string"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid input, car unavailable.
  - `401 Unauthorized`.
  - `404 Not Found`: Car not found.
  - `409 Conflict`: Car booked during Razorpay order creation.
  - `500 Internal Server Error`.

### 4.2. Verify Razorpay Payment
- **Endpoint:** `POST /api/checkout/razorpay-verify`
- **Description:** Verifies the Razorpay payment signature and confirms the booking.
- **Authentication:** User (JWT Required)
- **Request Body (Zod: RazorpayVerificationSchema):**
  ```json
  {
    "razorpay_order_id": "string",
    "razorpay_payment_id": "string",
    "razorpay_signature": "string",
    "bookingId": "string (internal booking ID)"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "message": "Payment verified and booking confirmed.",
    "bookingId": "string (internal booking ID)"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid verification data, invalid signature.
  - `401 Unauthorized`.
  - `404 Not Found`: Booking not found or order ID mismatch.
  - `500 Internal Server Error`.

---

## 5. Public Site Settings API

### 5.1. Get Site Settings
- **Endpoint:** `GET /api/settings`
- **Description:** Fetches public site settings (e.g., site title, default currency, maintenance mode).
- **Authentication:** Public
- **Success Response (200 OK):**
  ```json
  {
    "id": "string (settings document ID, optional)",
    "siteTitle": "string",
    "defaultCurrency": "USD | EUR | GBP | INR",
    "maintenanceMode": "boolean",
    "sessionTimeoutMinutes": "number"
  }
  ```
- **Error Responses:**
  - `500 Internal Server Error` (Though it attempts to return defaults on DB error).

---

## 6. File Upload API

### 6.1. Upload File
- **Endpoint:** `POST /api/upload`
- **Description:** Uploads a file (image or document) to the server.
- **Authentication:** User (JWT Required)
- **Query Parameters:**
  - `destination` (string, optional, default: 'images'): Can be 'images' or 'documents'. Determines subfolder in `public/assets/`.
- **Request Body:** `multipart/form-data` with a single file field named `file`.
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "filePath": "string (relative path, e.g., /assets/images/timestamp-filename.jpg)",
    "originalName": "string"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: No file uploaded, invalid file type, invalid destination.
  - `401 Unauthorized`.
  - `413 Payload Too Large`: File exceeds max size (5MB).
  - `500 Internal Server Error`: File system error, permission denied.

---

## 7. Admin APIs (`/api/admin`)

**Note:** All Admin APIs require 'Admin' or 'Manager' role (unless specified otherwise) and a valid JWT.

### 7.1. Admin - Cars

#### 7.1.1. Get All Cars (Admin)
- **Endpoint:** `GET /api/admin/cars`
- **Description:** Fetches a paginated list of all cars for admin management. Supports search and filtering.
- **Authentication:** Admin or Manager
- **Query Parameters:**
  - `page` (number, optional, default: 1)
  - `limit` (number, optional, default: 10)
  - `search` (string, optional): Search by car name.
  - `type` (string, optional): Filter by car type.
- **Success Response (200 OK):** Same as `GET /api/cars`.

#### 7.1.2. Add New Car
- **Endpoint:** `POST /api/admin/cars`
- **Description:** Adds a new car listing.
- **Authentication:** Admin or Manager
- **Request Body (Zod: CarInputSchema - see `src/lib/schemas/car.ts`):**
  ```json
  {
    "name": "string",
    "type": "Sedan | SUV | ...",
    "pricePerHour": "number",
    "minNegotiablePrice": "number (optional)",
    "maxNegotiablePrice": "number (optional)",
    "imageUrls": ["string (relative paths like /assets/images/...)"],
    "description": "string",
    "longDescription": "string",
    "features": ["string"],
    "availability": [{ "startDate": "string (YYYY-MM-DD)", "endDate": "string (YYYY-MM-DD)" }],
    "seats": "number",
    "engine": "string",
    "transmission": "Automatic | Manual",
    "fuelType": "Petrol | Diesel | Electric | Hybrid",
    "location": "string",
    "aiHint": "string (optional)"
    // rating and reviews default to 0
  }
  ```
- **Success Response (201 Created):**
  ```json
  // Created Car object
  ```
- **Error Responses:** `400` (Validation), `401`, `403`, `500`.

#### 7.1.3. Get Single Car (Admin)
- **Endpoint:** `GET /api/admin/cars/[id]`
- **Description:** Fetches details for a specific car by ID (for admin editing).
- **Authentication:** Admin or Manager
- **URL Parameters:** `id` (string)
- **Success Response (200 OK):** Full `Car` object.

#### 7.1.4. Update Car
- **Endpoint:** `PUT /api/admin/cars/[id]`
- **Description:** Updates details of an existing car.
- **Authentication:** Admin or Manager
- **URL Parameters:** `id` (string)
- **Request Body (Zod: UpdateCarInputSchema - partial Car object, see `src/lib/schemas/car.ts`)**
- **Success Response (200 OK):** Updated `Car` object.
- **Error Responses:** `400`, `401`, `403`, `404` (Not Found), `500`.

#### 7.1.5. Delete Car
- **Endpoint:** `DELETE /api/admin/cars/[id]`
- **Description:** Deletes a car. Fails if car has active bookings.
- **Authentication:** Admin or Manager
- **URL Parameters:** `id` (string)
- **Success Response (200 OK):** `{"message": "Car deleted successfully"}`
- **Error Responses:** `400` (Active bookings), `401`, `403`, `404` (Not Found), `500`.

### 7.2. Admin - Users

#### 7.2.1. Get All Users (Admin)
- **Endpoint:** `GET /api/admin/users`
- **Description:** Fetches a paginated list of all users.
- **Authentication:** Admin or Manager
- **Query Parameters:** `page` (optional), `limit` (optional)
- **Success Response (200 OK):**
  ```json
  {
    "data": [ /* Array of User objects (excluding passwordHash) */ ],
    "totalItems": "number",
    "totalPages": "number",
    "currentPage": "number"
  }
  ```

#### 7.2.2. Add New User (Admin)
- **Endpoint:** `POST /api/admin/users`
- **Description:** Creates a new user account (Customer, Manager, or Admin).
- **Authentication:** Admin Only
- **Request Body (Zod: UserInputSchema):**
  ```json
  {
    "name": "string",
    "email": "string",
    "phoneNumber": "string (optional)",
    "password": "string (min 6 chars)",
    "role": "Customer | Manager | Admin"
  }
  ```
- **Success Response (201 Created):** Created `User` object (excluding password).
- **Error Responses:** `400`, `401`, `403`, `409` (Email exists), `500`.

#### 7.2.3. Get Single User (Admin)
- **Endpoint:** `GET /api/admin/users/[id]`
- **Description:** Fetches details for a specific user.
- **Authentication:** Admin or Manager
- **URL Parameters:** `id` (string)
- **Success Response (200 OK):** `User` object (excluding passwordHash).

#### 7.2.4. Update User (Admin)
- **Endpoint:** `PUT /api/admin/users/[id]`
- **Description:** Updates a user's name, phone number, and role.
- **Authentication:** Admin Only
- **URL Parameters:** `id` (string)
- **Request Body (Zod: UpdateUserSchema):**
  ```json
  {
    "name": "string (optional)",
    "phoneNumber": "string (optional, can be empty string to clear)",
    "role": "Customer | Manager | Admin (optional)"
  }
  ```
- **Success Response (200 OK):** Updated `User` object.
- **Error Responses:** `400`, `401`, `403`, `404`, `500`.

#### 7.2.5. Update User Document Status
- **Endpoint:** `PUT /api/admin/users/[id]/documents/[documentType]`
- **Description:** Approves or rejects a user's uploaded verification document.
- **Authentication:** Admin or Manager
- **URL Parameters:**
  - `id` (string): User's ID.
  - `documentType` (string: 'PhotoID' or 'DrivingLicense').
- **Request Body (Zod: UpdateDocumentStatusSchema):**
  ```json
  {
    "status": "Approved | Rejected",
    "adminComments": "string (optional)"
  }
  ```
- **Success Response (200 OK):** Updated `User` object with modified document status.
- **Error Responses:** `400`, `401`, `403`, `404` (User or document not found), `500`.

### 7.3. Admin - Bookings

#### 7.3.1. Get All Bookings (Admin)
- **Endpoint:** `GET /api/admin/bookings`
- **Description:** Fetches a paginated list of all bookings.
- **Authentication:** Admin or Manager
- **Query Parameters:** `page` (optional), `limit` (optional)
- **Success Response (200 OK):**
  ```json
  {
    "data": [ /* Array of Booking objects */ ],
    "totalItems": "number",
    "totalPages": "number",
    "currentPage": "number"
  }
  ```

#### 7.3.2. Update Booking Status
- **Endpoint:** `PUT /api/admin/bookings/[bookingId]/status`
- **Description:** Updates the status of a booking (e.g., to approve/reject cancellation).
- **Authentication:** Admin or Manager
- **URL Parameters:** `bookingId` (string)
- **Request Body (Zod: UpdateStatusSchema):**
  ```json
  {
    "status": "Confirmed | Cancelled | Completed | Cancellation Rejected"
  }
  ```
- **Success Response (200 OK):** Updated `Booking` object.
- **Error Responses:** `400`, `401`, `403`, `404`, `500`.

### 7.4. Admin - Reports

#### 7.4.1. Get Booking Reports
- **Endpoint:** `GET /api/admin/reports`
- **Description:** Fetches booking data based on filters for reporting.
- **Authentication:** Admin or Manager
- **Query Parameters:**
  - `startDate` (string: 'YYYY-MM-DD', optional): Filter by booking creation date.
  - `endDate` (string: 'YYYY-MM-DD', optional).
  - `status` (string, optional, e.g., 'Confirmed', 'Completed', 'All').
- **Success Response (200 OK):**
  ```json
  {
    "totalBookings": "number",
    "totalRevenue": "number",
    "bookings": [ /* Array of filtered Booking objects */ ],
    "currencySymbol": "string (e.g., ₹, $)",
    "currency": "string (e.g., INR, USD)"
  }
  ```
- **Error Responses:** `400`, `401`, `403`, `500`.

### 7.5. Admin - Dashboard Stats

#### 7.5.1. Get Dashboard Statistics
- **Endpoint:** `GET /api/admin/stats`
- **Description:** Fetches key statistics for the admin dashboard.
- **Authentication:** Admin or Manager
- **Success Response (200 OK):**
  ```json
  {
    "totalRevenue": "number",
    "totalUsers": "number",
    "totalCars": "number",
    "pendingBookingsCount": "number",
    "defaultCurrency": "string (e.g., INR)",
    "recentBookings": [ /* Array of last 5 Booking objects */ ],
    "newUsers": [ /* Array of last 5 User objects */ ]
  }
  ```
- **Error Responses:** `401`, `403`, `500`.

### 7.6. Admin - Site Settings

#### 7.6.1. Get Site Settings (Admin)
- **Endpoint:** `GET /api/admin/settings`
- **Description:** Fetches all configurable site settings.
- **Authentication:** Admin Only
- **Success Response (200 OK):**
  ```json
  {
    "id": "string (optional)",
    "siteTitle": "string",
    "defaultCurrency": "USD | EUR | GBP | INR",
    "maintenanceMode": "boolean",
    "sessionTimeoutMinutes": "number",
    "smtpHost": "string (optional)",
    "smtpPort": "number (optional)",
    "smtpUser": "string (optional)",
    // smtpPass is NOT returned
    "smtpSecure": "boolean (optional)",
    "emailFrom": "string (optional)",
    "updatedAt": "string (ISO date, optional)"
  }
  ```

#### 7.6.2. Update Site Settings
- **Endpoint:** `PUT /api/admin/settings`
- **Description:** Updates site settings.
- **Authentication:** Admin Only
- **Request Body (Zod: SiteSettingsSchema - see relevant API route for structure, partial SiteSettings object)**
- **Success Response (200 OK):** Updated SiteSettings object (excluding `smtpPass`).
- **Error Responses:** `400`, `401`, `403`, `500`.

---

This documentation should provide a good starting point for anyone looking to understand or integrate with your application's backend APIs. For a more interactive experience, you could consider integrating tools like Swagger/OpenAPI in the future.
