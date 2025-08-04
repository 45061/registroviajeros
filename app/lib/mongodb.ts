import mongoose from 'mongoose';

const conn = {
  isConnected: false,
};

export async function dbConnect() {
  if (conn.isConnected) return;

  const MONGODB_URL = process.env.MONGODB_URL;
  if (!MONGODB_URL) {
    throw new Error('No se ha definido la variable de entorno MONGODB_URL');
  }

  const db = await mongoose.connect(MONGODB_URL);

  conn.isConnected = db.connections[0].readyState === 1;

  // Mostrar solo si existe
  console.log(db.connection.db?.databaseName);
}

mongoose.connection.on('connected', () => {
  console.log('Mongodb is connected');
});

mongoose.connection.on('error', (err) => {
  console.log('MongoDB connection error:', err);
});
