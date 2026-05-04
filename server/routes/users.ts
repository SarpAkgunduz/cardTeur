import { Router, Request, Response } from 'express';
import User from '../models/User';
import { requireAuth } from '../middleware/auth';

const router: Router = Router();

// POST /api/users/register
// Called after Firebase account creation to persist user info in MongoDB
router.post('/register', requireAuth, async (req: Request, res: Response) => {
  const { displayName } = req.body;
  const uid = (req as any).uid as string;
  const email = (req as any).email as string;
  const resolvedName = displayName || email.split('@')[0];

  try {
    const existing = await User.findOne({ uid });
    if (existing) {
      res.json(existing);
      return;
    }

    const user = await User.create({ uid, email, displayName: resolvedName });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to register user' });
  }
});

export default router;
