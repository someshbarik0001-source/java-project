import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (!MONGODB_URI) {
    console.warn('MONGODB_URI environment variable is not defined.');
    return null;
  }

  // Disconnect if we are currently connected to the old default 'test' database
  if (mongoose.connection.readyState === 1 && mongoose.connection.db?.databaseName !== 'newtarn') {
    console.log(`Disconnecting stale connection from DB: ${mongoose.connection.db?.databaseName}`);
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      family: 4, // Force IPv4 to prevent TLSv1 internal errors on Windows with Atlas
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log(`Successfully connected to MongoDB. Database name: ${mongoose.connection.db?.databaseName}`);
      return mongoose;
    }).catch((err) => {
      console.error('MongoDB connection error:', err);
      cached.promise = null;
      return null;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('Failed to resolve MongoDB connection promise:', e);
    return null;
  }

  return cached.conn;
}

export default connectToDatabase;
