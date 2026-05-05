import express, { Application } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app: Application = express();

// CORS middleware must be FIRST
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

import playerRoutes from './routes/players';
import matchRoutes from './routes/match';
import userRoutes from './routes/users';
app.use('/api/players', playerRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5001;

mongoose.connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err: Error) => console.error('MongoDB connection error:', err));
