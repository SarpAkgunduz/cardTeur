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
  ...(process.env.EXTRA_CORS_ORIGINS
    ? process.env.EXTRA_CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : []),
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('CORS not allowed: ' + origin));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use('/api/billing/webhook', express.raw({ type: '*/*', limit: '1mb' }));
app.use(express.json({ limit: '10mb' }));

import playerRoutes from './routes/players';
import matchesRoutes from './routes/matches';
import userRoutes from './routes/users';
import crewRoutes from './routes/crews';
import uploadsRoutes from './routes/uploads';
import referralRoutes from './routes/referrals';
import billingRoutes from './routes/billing';
app.use('/api/players', playerRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/crews', crewRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/billing', billingRoutes);

const PORT = process.env.PORT || 5002;

mongoose.connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err: Error) => console.error('MongoDB connection error:', err));
