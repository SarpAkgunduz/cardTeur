const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // ✅ Only once
require('dotenv').config();

const app = express();

// ✅ CORS middleware must be FIRST
app.use(cors({
  origin: 'http://localhost:5173', // ✅ Your frontend port
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

const playerRoutes = require('./routes/players');
app.use('/api/players', playerRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));
