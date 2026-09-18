import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import * as mvpService from '../services/mvpService';

const router = Router();
router.use(requireAuth);

function handleError(res: Response, err: unknown, fallback: string) {
  if (err instanceof mvpService.MvpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(`[mvp] ${fallback}`, err);
  res.status(500).json({ error: fallback });
}

// POST /api/crews/:crewId/mvp — leader-only, award MVP to a crew player
router.post('/crews/:crewId/mvp', async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  const { playerId } = req.body;
  if (!playerId) {
    res.status(400).json({ error: 'playerId is required' });
    return;
  }
  try {
    const award = await mvpService.awardMvp(String(req.params.crewId), uid, String(playerId));
    res.status(201).json(award);
  } catch (err) {
    handleError(res, err, 'Failed to award MVP');
  }
});

// GET /api/mvp-awards/mine — this user's unclaimed MVP awards
router.get('/mvp-awards/mine', async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  try {
    const awards = await mvpService.getPendingMvpAwardsForUser(uid);
    res.json(awards);
  } catch (err) {
    handleError(res, err, 'Failed to fetch MVP awards');
  }
});

// POST /api/mvp-awards/:id/claim — the awarded player picks which stat gets +1
router.post('/mvp-awards/:id/claim', async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  const { stat } = req.body;
  if (!stat) {
    res.status(400).json({ error: 'stat is required' });
    return;
  }
  try {
    const award = await mvpService.claimMvpAward(String(req.params.id), uid, String(stat));
    res.json(award);
  } catch (err) {
    handleError(res, err, 'Failed to claim MVP award');
  }
});

export default router;
