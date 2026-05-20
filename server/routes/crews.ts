import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import Crew from '../models/Crew';

const router = Router();
router.use(requireAuth);

// GET /api/crews — list owned crews + crews the user has been added to
router.get('/', async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  try {
    const crews = await Crew.find({ $or: [{ ownerUid: uid }, { memberUids: uid }] }).sort({ createdAt: 1 });
    res.json(crews);
  } catch {
    res.status(500).json({ error: 'Failed to fetch crews' });
  }
});

// POST /api/crews — create a new crew
router.post('/', async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  try {
    const crew = await Crew.create({ ownerUid: uid, name: name.trim(), playerIds: [] });
    res.status(201).json(crew);
  } catch {
    res.status(500).json({ error: 'Failed to create crew' });
  }
});

// PUT /api/crews/:id — rename a crew
router.put('/:id', async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  try {
    const crew = await Crew.findOneAndUpdate(
      { _id: req.params.id, ownerUid: uid },
      { name: name.trim() },
      { new: true }
    );
    if (!crew) return res.status(404).json({ error: 'Crew not found' });
    res.json(crew);
  } catch {
    res.status(500).json({ error: 'Failed to update crew' });
  }
});

// DELETE /api/crews/:id — delete a crew
router.delete('/:id', async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  try {
    const crew = await Crew.findOneAndDelete({ _id: req.params.id, ownerUid: uid });
    if (!crew) return res.status(404).json({ error: 'Crew not found' });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete crew' });
  }
});

// POST /api/crews/:id/players/:playerId — add player to crew
router.post('/:id/players/:playerId', async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  try {
    const crew = await Crew.findOneAndUpdate(
      { _id: req.params.id, ownerUid: uid },
      { $addToSet: { playerIds: req.params.playerId } },
      { new: true }
    );
    if (!crew) return res.status(404).json({ error: 'Crew not found' });
    res.json(crew);
  } catch {
    res.status(500).json({ error: 'Failed to add player' });
  }
});

// DELETE /api/crews/:id/players/:playerId — remove player from crew
router.delete('/:id/players/:playerId', async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  try {
    const crew = await Crew.findOneAndUpdate(
      { _id: req.params.id, ownerUid: uid },
      { $pull: { playerIds: req.params.playerId } },
      { new: true }
    );
    if (!crew) return res.status(404).json({ error: 'Crew not found' });
    res.json(crew);
  } catch {
    res.status(500).json({ error: 'Failed to remove player' });
  }
});

export default router;
