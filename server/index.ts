import express, { Application } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

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
app.use('/api/players', playerRoutes);
app.use('/api/match', matchRoutes);

const PORT = process.env.PORT || 5001;

mongoose.connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err: Error) => console.error('MongoDB connection error:', err));
