import express, { Application } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app: Application = express();

// CORS middleware must be FIRST
const allowedOrigins = [
  'http://localhost:5173',
  'https://cardteur.com',
  'https://www.cardteur.com',
  'https://cardteur.sarpakg.workers.dev',
  // Extra origins from env (comma-separated)
  ...(process.env.EXTRA_CORS_ORIGINS ? process.env.EXTRA_CORS_ORIGINS.split(',') : []),
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('CORS not allowed: ' + origin));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

import playerRoutes from './routes/players';
import matchRoutes from './routes/match';
import matchesRoutes from './routes/matches';
import userRoutes from './routes/users';
app.use('/api/players', playerRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5002;

mongoose.connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err: Error) => console.error('MongoDB connection error:', err));
