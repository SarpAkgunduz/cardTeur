import { Router, Request, Response } from 'express';
import Player from '../models/Player';

const router: Router = Router();

// Get all players
router.get('/', async (req: Request, res: Response) => {
  const players = await Player.find();
  res.json(players);
});

// Get single player by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }
    res.json(player);
  } catch (error) {
    res.status(400).json({ error: 'Invalid player ID' });
  }
});

// Create a new player
router.post('/', async (req: Request, res: Response) => {
  try {
    const newPlayer = new Player(req.body);
    await newPlayer.save();
    res.json(newPlayer);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'ValidationError') {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Update player
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await Player.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }
    res.json(updated);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'ValidationError') {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete player
router.delete('/:id', async (req: Request, res: Response) => {
  await Player.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
});

export default router;
