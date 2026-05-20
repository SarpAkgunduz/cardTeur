import { Router, Request, Response } from 'express';
import User from '../models/User';
import { requireAuth } from '../middleware/auth';
import admin from '../firebaseAdmin';

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

// PUT /api/users/profile - update display name and/or photo URL
router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  const { displayName, photoURL } = req.body;
  try {
    const updates: Record<string, string> = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (photoURL !== undefined) updates.photoURL = photoURL;
    const user = await User.findOneAndUpdate({ uid }, updates, { new: true });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    if (displayName !== undefined) await admin.auth().updateUser(uid, { displayName });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// DELETE /api/users/account - delete own account from Firebase + MongoDB
router.delete('/account', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  try {
    await admin.auth().deleteUser(uid);
    await User.deleteOne({ uid });
    await User.updateMany({ friends: uid } as any, { $pull: { friends: uid } } as any);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// GET /api/users/me - get current user's profile
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  try {
    const user = await User.findOne({ uid }).select('uid email displayName photoURL');
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// GET /api/users/search?q= - exact uid or email match only (indexed fields, no collection scan)
router.get('/search', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  const q = ((req.query.q as string) || '').trim();
  if (!q) { res.json([]); return; }
  try {
    const user = await User.findOne({
      uid: { $ne: uid },
      $or: [{ uid: q }, { email: q }],
    }).select('uid email displayName photoURL');
    res.json(user ? [user] : []);
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/users/friends - get current user's friends with full profiles
router.get('/friends', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  try {
    const me = await User.findOne({ uid });
    if (!me) { res.json([]); return; }
    const friends = await User.find({ uid: { $in: me.friends } }).select('uid email displayName photoURL');
    res.json(friends);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// POST /api/users/friends/:friendUid - add friend (bidirectional)
router.post('/friends/:friendUid', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  const { friendUid } = req.params;
  if (uid === friendUid) { res.status(400).json({ error: 'Cannot add yourself' }); return; }
  try {
    await User.findOneAndUpdate({ uid }, { $addToSet: { friends: friendUid } } as any);
    await User.findOneAndUpdate({ uid: friendUid }, { $addToSet: { friends: uid } } as any);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add friend' });
  }
});

// DELETE /api/users/friends/:friendUid - remove friend (bidirectional)
router.delete('/friends/:friendUid', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  const { friendUid } = req.params;
  try {
    await User.findOneAndUpdate({ uid }, { $pull: { friends: friendUid } } as any);
    await User.findOneAndUpdate({ uid: friendUid }, { $pull: { friends: uid } } as any);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

// POST /api/users/lookup-by-emails - returns user profiles for given emails (crew auto-populate)
router.post('/lookup-by-emails', requireAuth, async (req: Request, res: Response) => {
  const { emails } = req.body as { emails: string[] };
  if (!Array.isArray(emails) || emails.length === 0) { res.json([]); return; }
  try {
    const users = await User.find({ email: { $in: emails } }).select('uid email displayName photoURL');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Lookup failed' });
  }
});

// POST /api/users/lookup-by-uids - returns user profiles for given uids (linked player auto-email)
router.post('/lookup-by-uids', requireAuth, async (req: Request, res: Response) => {
  const { uids } = req.body as { uids: string[] };
  if (!Array.isArray(uids) || uids.length === 0) { res.json([]); return; }
  try {
    const users = await User.find({ uid: { $in: uids } }).select('uid email displayName photoURL');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Lookup failed' });
  }
});

export default router;
