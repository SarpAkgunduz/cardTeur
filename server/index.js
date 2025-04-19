const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const playerRoutes = require('./routes/players');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/players', playerRoutes); // 👈 This exposes /api/players routes

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error(err));
