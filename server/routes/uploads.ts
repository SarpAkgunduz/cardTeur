import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { uploadImageToR2, isDataUrl } from '../services/r2Service';

const router: Router = Router();

// POST /api/uploads/image
// Accepts { imageDataUrl: string } (base64 data URL), uploads to R2, returns { url }.
// Protected — the folder is scoped to the requesting user's uid.
router.post('/image', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  const { imageDataUrl } = req.body as { imageDataUrl?: string };

  if (!imageDataUrl || !isDataUrl(imageDataUrl)) {
    res.status(400).json({ error: 'imageDataUrl must be a base64 data URL' });
    return;
  }

  try {
    const url = await uploadImageToR2(imageDataUrl, `users/${uid}`);
    res.json({ url });
  } catch (err) {
    console.error('R2 upload failed:', err);
    res.status(500).json({ error: 'Image upload failed' });
  }
});

export default router;
