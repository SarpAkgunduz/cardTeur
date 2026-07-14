import { initializePaddle, type Paddle } from '@paddle/paddle-js';

// Client-side token (starts with test_ in sandbox, live_ in production), never the
// server-side API key.
const CLIENT_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined;

// Never silently default this — if VITE_PADDLE_ENV is missing, fail loudly instead
// of quietly falling back to sandbox. A silent fallback here means a misconfigured
// production build could open checkout against the sandbox account (or vice versa)
// with no visible sign anything is wrong. Checked lazily inside getPaddle() (not at
// module load) so a missing var can't crash the whole app — PricingPage imports this
// module eagerly via App.tsx's route table, not lazily.
const RAW_ENVIRONMENT = import.meta.env.VITE_PADDLE_ENV as string | undefined;

// Set right before ThankYouPage reads it, then immediately cleared by ThankYouPage —
// this is how we tell a real post-checkout landing apart from someone just typing
// /thank-you into the address bar, so we don't fire fake ad-conversion events for
// people who never paid.
export const CHECKOUT_COMPLETED_FLAG = 'ct_checkout_completed';

let paddleInstance: Paddle | undefined;
let loading: Promise<Paddle | undefined> | undefined;

export function getPaddle(): Promise<Paddle | undefined> {
  if (paddleInstance) return Promise.resolve(paddleInstance);
  if (!CLIENT_TOKEN) {
    console.error('[paddle] VITE_PADDLE_CLIENT_TOKEN is not set — checkout overlay cannot open.');
    return Promise.resolve(undefined);
  }
  if (RAW_ENVIRONMENT !== 'sandbox' && RAW_ENVIRONMENT !== 'production') {
    console.error(`[paddle] VITE_PADDLE_ENV must be "sandbox" or "production", got: ${JSON.stringify(RAW_ENVIRONMENT)} — refusing to guess, checkout overlay cannot open.`);
    return Promise.resolve(undefined);
  }
  if (!loading) {
    loading = initializePaddle({
      token: CLIENT_TOKEN,
      environment: RAW_ENVIRONMENT,
      eventCallback: (event) => {
        if (event.name === 'checkout.completed') {
          sessionStorage.setItem(CHECKOUT_COMPLETED_FLAG, '1');
        }
      },
    }).then((p) => {
      paddleInstance = p;
      return p;
    });
  }
  return loading;
}
