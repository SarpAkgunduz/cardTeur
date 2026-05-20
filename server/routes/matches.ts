import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import Match from '../models/Match';
import { sendMatchAnnouncement } from '../services/emailService';

const router = Router();
router.use(requireAuth);

// GET /api/matches — list all saved matches for this user
router.get('/', async (req: Request, res: Response) => {
  try {
    const uid = (req as any).uid;
    const matches = await Match.find({ ownerUid: uid }).sort({ createdAt: -1 });
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// POST /api/matches — save a new match without sending email
router.post('/', async (req: Request, res: Response) => {
  try {
    const uid = (req as any).uid;
    const { location, date, time, teamA, teamB } = req.body;
    if (!teamA || !teamB) {
      res.status(400).json({ error: 'teamA and teamB are required' });
      return;
    }
    const match = await Match.create({
      ownerUid: uid,
      location: location ?? '',
      date: date ?? '',
      time: time ?? '',
      teamA,
      teamB,
      announced: false,
    });
    res.status(201).json(match);
  } catch (err) {
    console.error('[matches/save]', err);
    res.status(500).json({ error: 'Failed to save match' });
  }
});

// POST /api/matches/:id/announce — announce an existing saved match (update details + send emails)
router.post('/:id/announce', async (req: Request, res: Response) => {
  try {
    const uid = (req as any).uid;
    const match = await Match.findOne({ _id: req.params.id, ownerUid: uid });
    if (!match) { res.status(404).json({ error: 'Match not found' }); return; }

    const { location, date, time } = req.body;
    if (location) match.location = location;
    if (date) match.date = date;
    if (time) match.time = time;
    match.announced = true;
    await match.save();

    const result = await sendMatchAnnouncement({
      location: match.location,
      date: match.date,
      time: match.time,
      leftTeam: match.teamA.players,
      rightTeam: match.teamB.players,
    });
    res.json({ success: true, matchId: match._id, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to announce match', detail: message });
  }
});

// DELETE /api/matches/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const uid = (req as any).uid;
    await Match.findOneAndDelete({ _id: req.params.id, ownerUid: uid });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete match' });
  }
});

export default router;
