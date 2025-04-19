const express = require('express');
const router = express.Router();
const Player = require('../models/Player');

// Get all players
router.get('/', async (req, res) => {
  const players = await Player.find();
  res.json(players);
});

// Create a new player
router.post('/', async (req, res) => {
  const newPlayer = new Player(req.body);
  await newPlayer.save();
  res.json(newPlayer);
});

// Update player
router.put('/:id', async (req, res) => {
  const updated = await Player.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// Delete player
router.delete('/:id', async (req, res) => {
  await Player.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
});

module.exports = router;
