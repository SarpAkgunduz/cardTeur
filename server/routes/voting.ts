import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import * as votingService from '../services/votingService';

const router = Router();
router.use(requireAuth);

function handleError(res: Response, err: unknown, fallback: string) {
  if (err instanceof votingService.VotingError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(`[voting] ${fallback}`, err);
  res.status(500).json({ error: fallback });
}

// GET /api/crews/:crewId/voting-settings — leader-only
router.get('/crews/:crewId/voting-settings', async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  try {
    const settings = await votingService.getVotingSettings(String(req.params.crewId), uid);
    res.json(settings);
  } catch (err) {
    handleError(res, err, 'Failed to fetch voting settings');
  }
});

// PUT /api/crews/:crewId/voting-settings — leader-only
router.put('/crews/:crewId/voting-settings', async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  const { autoTriggerEnabled, windowHours } = req.body;
  try {
    const settings = await votingService.updateVotingSettings(String(req.params.crewId), uid, { autoTriggerEnabled, windowHours });
    res.json(settings);
  } catch (err) {
    handleError(res, err, 'Failed to update voting settings');
  }
});

// POST /api/crews/:crewId/voting-sessions — manual/custom session, leader-only
router.post('/crews/:crewId/voting-sessions', async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  const { participantPlayerIds, windowHours } = req.body;
  try {
    const session = await votingService.createManualSession(String(req.params.crewId), uid, participantPlayerIds, windowHours);
    res.status(201).json(session);
  } catch (err) {
    handleError(res, err, 'Failed to start voting session');
  }
});

// GET /api/crews/:crewId/voting-sessions/active — open session for this crew, if any
router.get('/crews/:crewId/voting-sessions/active', async (req: Request, res: Response) => {
  try {
    const session = await votingService.getActiveSession(String(req.params.crewId));
    res.json(session);
  } catch (err) {
    handleError(res, err, 'Failed to fetch active voting session');
  }
});

// GET /api/voting-sessions/:id — session detail + participant player info, for VotingPage
router.get('/voting-sessions/:id', async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  try {
    const result = await votingService.getSessionForViewer(String(req.params.id), uid);
    res.json(result);
  } catch (err) {
    handleError(res, err, 'Failed to fetch voting session');
  }
});

// POST /api/voting-sessions/:id/votes — submit/update this voter's scores for one target player
router.post('/voting-sessions/:id/votes', async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  const { targetPlayerId, statDeltas } = req.body;
  if (!targetPlayerId) {
    res.status(400).json({ error: 'targetPlayerId is required' });
    return;
  }
  try {
    const vote = await votingService.submitVote(String(req.params.id), uid, targetPlayerId, statDeltas ?? {});
    res.json(vote);
  } catch (err) {
    handleError(res, err, 'Failed to submit vote');
  }
});

// POST /api/voting-sessions/:id/close — manual early close (leader) or lazy expiry close
router.post('/voting-sessions/:id/close', async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  try {
    const session = await votingService.closeSession(String(req.params.id), uid);
    res.json(session);
  } catch (err) {
    handleError(res, err, 'Failed to close voting session');
  }
});

export default router;
