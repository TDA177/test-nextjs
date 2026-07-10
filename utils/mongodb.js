import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, lastError: 0 };
}

// Cooldown: if connection failed recently, don't retry for 30 seconds
const RETRY_COOLDOWN_MS = 30_000;

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  // If we failed recently, throw immediately instead of retrying
  if (cached.lastError && Date.now() - cached.lastError < RETRY_COOLDOWN_MS) {
    throw new Error('MongoDB connection failed recently. Waiting before retry.');
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      connectTimeoutMS: 5000,        // 5s to establish TCP connection
      serverSelectionTimeoutMS: 5000, // 5s to find a server
      socketTimeoutMS: 10000,         // 10s for socket operations
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      cached.lastError = 0; // Clear error on success
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.lastError = Date.now(); // Record failure time
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
