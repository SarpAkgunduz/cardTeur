import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { getReferralOverview, generateReferral } from '../services/referralService';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  try {
    const overview = await getReferralOverview(uid);
    res.json(overview);
  } catch {
    res.status(500).json({ error: 'Failed to load referrals' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  try {
    const referral = await generateReferral(uid);
    res.status(201).json(referral);
  } catch (err: unknown) {
    if (err instanceof Error && (err as any).code === 'REFERRAL_LIMIT') {
      res.status(403).json({ error: err.message, code: 'REFERRAL_LIMIT' });
      return;
    }
    res.status(500).json({ error: 'Failed to generate referral' });
  }
});

export default router;
