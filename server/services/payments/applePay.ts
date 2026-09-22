import https from 'https';

// --- Apple Pay merchant validation -----------------------------------------
//
// This is the ONE part of Apple Pay that's standardized and provider-agnostic:
// whenever the client's ApplePaySession fires onvalidatemerchant, it hands us
// an Apple-issued `validationURL`, and we have to call it over mutual TLS
// using our Payment Processing certificate (the "Merchant Identity
// Certificate") to get back an opaque merchant session, which the client then
// passes to session.completeMerchantValidation(). No payment processor is
// involved in this step — it's purely "prove to Apple you are the merchant
// you say you are."
//
// Needs, once a Merchant ID exists (developer.apple.com/account →
// Certificates, Identifiers & Profiles → Identifiers → Merchant IDs →
// register merchant.com.cardteur.mobile, then Certificates → create a
// "Apple Pay Merchant Identity Certificate" for it and export the cert+key):
//   APPLE_PAY_MERCHANT_ID   e.g. "merchant.com.cardteur.mobile"
//   APPLE_PAY_DOMAIN        e.g. "cardteur.com" (must also be domain-verified
//                            in the Merchant ID's "Apple Pay on the Web" config
//                            if Apple Pay will ever run on the web, not just iOS)
//   APPLE_PAY_DISPLAY_NAME  e.g. "cardTeur"
//   APPLE_PAY_MERCHANT_CERT PEM-encoded Merchant Identity certificate
//   APPLE_PAY_MERCHANT_KEY  PEM-encoded private key for that certificate
export async function validateMerchant(validationURL: string): Promise<unknown> {
  const cert = process.env.APPLE_PAY_MERCHANT_CERT;
  const key = process.env.APPLE_PAY_MERCHANT_KEY;
  const merchantIdentifier = process.env.APPLE_PAY_MERCHANT_ID;
  const domainName = process.env.APPLE_PAY_DOMAIN;
  const displayName = process.env.APPLE_PAY_DISPLAY_NAME ?? 'cardTeur';

  if (!cert || !key || !merchantIdentifier || !domainName) {
    throw new Error(
      'Apple Pay is not configured (missing APPLE_PAY_MERCHANT_CERT / APPLE_PAY_MERCHANT_KEY / APPLE_PAY_MERCHANT_ID / APPLE_PAY_DOMAIN)'
    );
  }

  // Only ever call validation URLs Apple actually hands out — never forward
  // an arbitrary client-supplied URL to an mTLS call carrying our merchant
  // certificate.
  let parsed: URL;
  try {
    parsed = new URL(validationURL);
  } catch {
    throw new Error('Invalid validationURL');
  }
  if (!parsed.hostname.endsWith('.apple.com')) {
    throw new Error('validationURL is not an apple.com host');
  }

  const body = JSON.stringify({ merchantIdentifier, domainName, displayName });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'POST',
        cert,
        key,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      res => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          if (!res.statusCode || res.statusCode >= 300) {
            reject(new Error(`Apple merchant validation failed: ${res.statusCode} ${data}`));
            return;
          }
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error('Apple merchant validation returned invalid JSON'));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// --- Payment processing ------------------------------------------------
//
// NOT IMPLEMENTED YET — intentionally. Merchant validation above is the same
// regardless of what's being sold, but actually charging the card behind an
// Apple Pay payment requires a payment processor that can decrypt an
// ApplePayPaymentToken (Stripe and Adyen do this natively; plain iyzico
// card-payment endpoints do not, as of writing — would need checking whether
// iyzico's Apple Pay support covers this before relying on it).
//
// This also has no real product to attach to yet — see
// FRONTEND_TODO_IAP_APPLE_PAY.md. Subscriptions (Premium/Premium+) must NOT
// go through Apple Pay at all (Apple requires In-App Purchase for digital
// content — see services/billing/revenuecat.ts for that path). Apple Pay is
// only legitimate here for a real-world good/service (e.g. paying for a
// pitch/saha booking), which doesn't exist in the app yet.
//
// Wire this up once: (a) a processor that supports Apple Pay tokens is
// picked, and (b) there's an actual paid real-world feature to attach it to.
export async function processApplePayPayment(_params: {
  uid: string;
  paymentToken: unknown;
  amount: number;
  currency: string;
  description: string;
}): Promise<never> {
  throw new Error(
    'Apple Pay payment processing is not implemented yet — merchant validation is ready, but no payment processor is wired up and no real-world paid feature exists to charge for. See services/payments/applePay.ts.'
  );
}
