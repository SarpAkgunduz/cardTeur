import { Router, Request, Response } from 'express';
import Player from '../models/Player';
import Crew from '../models/Crew';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router: Router = Router();

// All player routes require a valid Firebase token
router.use(requireAuth);

async function canEditPlayer(playerId: string, uid: string): Promise<boolean> {
  const ownedPlayer = await Player.exists({ _id: playerId, ownerUid: uid });
  if (ownedPlayer) return true;

  const editableCrew = await Crew.exists({
    playerIds: playerId,
    editorUids: uid,
  });
  return Boolean(editableCrew);
}

// Get all players belonging to the authenticated user
router.get('/', async (req: Request, res: Response) => {
  const uid = (req as AuthenticatedRequest).uid;
  const players = await Player.find({ ownerUid: uid });
  res.json(players);
});

// Get single player by ID (must belong to authenticated user)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const uid = (req as AuthenticatedRequest).uid;
    const playerId = String(req.params.id);
    const player = await Player.findById(playerId);
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }
    const canEdit = await canEditPlayer(playerId, uid);
    if (!canEdit) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    res.json(player);
  } catch (error) {
    res.status(400).json({ error: 'Invalid player ID' });
  }
});

// Create a new player — ownerUid is set from the token, not the request body
router.post('/', async (req: Request, res: Response) => {
  try {
    const uid = (req as AuthenticatedRequest).uid;
    const newPlayer = new Player({ ...req.body, ownerUid: uid });
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

// Update player (must belong to authenticated user)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const uid = (req as AuthenticatedRequest).uid;
    const playerId = String(req.params.id);
    const { ownerUid, ...updateData } = req.body;

    // Fields with empty string or null are unset (removed) from the document
    const setData: Record<string, unknown> = {};
    const unsetData: Record<string, string> = {};
    for (const [key, val] of Object.entries(updateData)) {
      if (val === '' || val === null) {
        unsetData[key] = '';
      } else {
        setData[key] = val;
      }
    }
    const mongoUpdate: Record<string, unknown> = {};
    if (Object.keys(setData).length > 0) mongoUpdate.$set = setData;
    if (Object.keys(unsetData).length > 0) mongoUpdate.$unset = unsetData;

    const canEdit = await canEditPlayer(playerId, uid);
    if (!canEdit) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updated = await Player.findOneAndUpdate(
      { _id: playerId },
      mongoUpdate,
      { new: true, runValidators: true }
    );
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

// Delete player (must belong to authenticated user)
router.delete('/:id', async (req: Request, res: Response) => {
  const uid = (req as AuthenticatedRequest).uid;
  await Player.findOneAndDelete({ _id: req.params.id, ownerUid: uid });
  res.sendStatus(204);
});

export default router;
