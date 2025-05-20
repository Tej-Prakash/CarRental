
// src/lib/mongodb.ts
import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  // Consider adding connection timeout options if needed
  // connectTimeoutMS: 10000, // 10 seconds
  // socketTimeoutMS: 45000, // 45 seconds
};

if (!uri) {
  console.error('CRITICAL ERROR: MONGODB_URI environment variable is not defined.');
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    console.log('Attempting to connect to MongoDB (development)...');
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect()
      .then(clientInstance => {
        console.log("Successfully connected to MongoDB (development).");
        return clientInstance;
      })
      .catch(err => {
        console.error("CRITICAL: Failed to connect to MongoDB (development). URI used:", uri.substring(0, uri.indexOf('@') > 0 ? uri.indexOf('@') : 30) + '...'); // Log URI carefully
        console.error("MongoDB Connection Error (development):", err);
        // Re-throwing the error is important so that promises depending on clientPromise will also reject.
        throw err;
      });
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  console.log('Attempting to connect to MongoDB (production)...');
  client = new MongoClient(uri, options);
  clientPromise = client.connect()
    .then(clientInstance => {
      console.log("Successfully connected to MongoDB (production).");
      return clientInstance;
    })
    .catch(err => {
      console.error("CRITICAL: Failed to connect to MongoDB (production). URI used:", uri.substring(0, uri.indexOf('@') > 0 ? uri.indexOf('@') : 30) + '...');
      console.error("MongoDB Connection Error (production):", err);
      // In production, a failed DB connection is critical.
      // Depending on your strategy, you might want the app to fail loudly here.
      // process.exit(1); // Or use a more graceful shutdown mechanism.
      throw err;
    });
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, a client can be shared across functions.
export default clientPromise;
