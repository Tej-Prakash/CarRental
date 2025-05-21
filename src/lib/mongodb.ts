
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
  // Forcing an unhandled exception here will likely stop the server from starting,
  // which is better than it running and failing on every DB request.
  throw new Error('Please define the MONGODB_URI environment variable inside .env. The application cannot start without it.');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function initializeConnection(): Promise<MongoClient> {
  try {
    // This can throw MongoParseError if URI is malformed
    client = new MongoClient(uri!, options); 
    console.log('MongoDB client instantiated. Attempting to connect...');
    return client.connect()
      .then(clientInstance => {
        console.log("Successfully connected to MongoDB.");
        return clientInstance;
      })
      .catch(err => {
        const uriToLog = uri || 'URI_UNDEFINED';
        console.error("CRITICAL: Failed to connect to MongoDB. URI used (prefix):", uriToLog.substring(0, uriToLog.indexOf('@') > 0 ? uriToLog.indexOf('@') : 30) + '...');
        console.error("MongoDB Connection Error:", err);
        throw err; // Re-throw to make clientPromise a rejected promise
      });
  } catch (instantiationError: any) {
    const uriToLog = uri || 'URI_UNDEFINED';
    console.error("CRITICAL: Failed to instantiate MongoClient. Likely an issue with MONGODB_URI format. URI used (prefix):", uriToLog.substring(0, uriToLog.indexOf('@') > 0 ? uriToLog.indexOf('@') : 30) + '...');
    console.error("MongoClient Instantiation Error:", instantiationError);
    return Promise.reject(instantiationError); // Make clientPromise a rejected promise
  }
}


if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = initializeConnection();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  clientPromise = initializeConnection();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, a client can be shared across functions.
export default clientPromise;
