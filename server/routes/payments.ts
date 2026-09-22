import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateMerchant, processApplePayPayment } from '../services/payments/applePay';

const router = Router();

// Called by the client's ApplePaySession.onvalidatemerchant handler with the
// validationURL Apple gave it. Returns Apple's opaque merchant session
// object, which the client passes straight to
// session.completeMerchantValidation(merchantSession).
router.post('/apple-pay/validate-merchant', requireAuth, async (req: Request, res: Response) => {
  const { validationURL } = req.body as { validationURL?: string };
  if (!validationURL) {
    res.status(400).json({ error: 'Missing validationURL' });
    return;
  }
  try {
    const merchantSession = await validateMerchant(validationURL);
    res.json(merchantSession);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Merchant validation failed';
    res.status(502).json({ error: message });
  }
});

// Not implemented yet — see services/payments/applePay.ts for why (no
// payment processor wired up, no real-world paid feature to charge for yet).
// Kept as a route so the frontend has a stable endpoint to call once both of
// those exist, instead of needing a new route added later.
router.post('/apple-pay/process', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  const { paymentToken, amount, currency, description } = req.body as {
    paymentToken?: unknown;
    amount?: number;
    currency?: string;
    description?: string;
  };
  try {
    await processApplePayPayment({ uid, paymentToken, amount: amount ?? 0, currency: currency ?? 'TRY', description: description ?? '' });
    res.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Payment processing failed';
    res.status(501).json({ error: message });
  }
});

export default router;
