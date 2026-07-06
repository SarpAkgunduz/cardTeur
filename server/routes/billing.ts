import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { startCheckout, applySubscriptionEvent, providerForRegion, getAdapter, ProviderName } from '../services/billing';
import { BillingInterval, PaidTier } from '../services/billing/types';

const router = Router();

router.post('/checkout', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  const email = (req as any).email as string | undefined;
  const { tier, interval, referralCode, countryCode } = req.body as {
    tier?: PaidTier;
    interval?: BillingInterval;
    referralCode?: string;
    countryCode?: string;
  };

  if (tier !== 'premium' && tier !== 'premium_plus') {
    res.status(400).json({ error: 'Invalid tier' });
    return;
  }
  const resolvedInterval: BillingInterval = interval === 'annual' ? 'annual' : 'monthly';
  const provider = providerForRegion(countryCode);

  try {
    const result = await startCheckout(provider, { uid, email, tier, interval: resolvedInterval, referralCode });
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Checkout failed';
    res.status(502).json({ error: message });
  }
});

async function handleWebhook(provider: ProviderName, req: Request, res: Response) {
  try {
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
    const event = getAdapter(provider).verifyAndParse(raw, req.headers);
    if (!event) {
      res.status(400).json({ error: 'Invalid or unverified webhook' });
      return;
    }
    await applySubscriptionEvent(provider, event);
    res.json({ received: true });
  } catch {
    res.status(400).json({ error: 'Webhook processing failed' });
  }
}

router.post('/webhook/paddle', (req, res) => handleWebhook('paddle', req, res));
router.post('/webhook/iyzico', (req, res) => handleWebhook('iyzico', req, res));

export default router;
