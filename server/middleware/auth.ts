import { Request, Response, NextFunction } from 'express';
import admin from '../firebaseAdmin';

// Extend Express Request to carry the verified Firebase user
export interface AuthenticatedRequest extends Request {
  uid: string;
  email?: string;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: missing token' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    (req as AuthenticatedRequest).uid = decoded.uid;
    (req as AuthenticatedRequest).email = decoded.email;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized: invalid or expired token' });
  }
}
