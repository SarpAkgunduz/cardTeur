import { Router, Request, Response } from 'express';
import { sendMatchAnnouncement, MatchEmailPayload } from '../services/emailService';

const router: Router = Router();

// POST /api/match/announce
// Sends match announcement emails to all players who have an email address
router.post('/announce', async (req: Request, res: Response) => {
  const { location, date, time, leftTeam, rightTeam } = req.body as MatchEmailPayload;

  if (!location || !date || !time || !Array.isArray(leftTeam) || !Array.isArray(rightTeam)) {
    res.status(400).json({ error: 'Missing required fields: location, date, time, leftTeam, rightTeam' });
    return;
  }

  try {
    const result = await sendMatchAnnouncement({ location, date, time, leftTeam, rightTeam });
    res.json({ success: true, ...result });
  } catch (err: unknown) {
    console.error('[match/announce] Failed to send emails:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to send emails', detail: message });
  }
});

export default router;
