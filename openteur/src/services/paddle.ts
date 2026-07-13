import { initializePaddle, type Paddle } from '@paddle/paddle-js';

// Client-side token (starts with test_ in sandbox), never the server-side API key.
const CLIENT_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined;
const ENVIRONMENT = (import.meta.env.VITE_PADDLE_ENV as string | undefined) === 'production'
  ? 'production'
  : 'sandbox';

let paddleInstance: Paddle | undefined;
let loading: Promise<Paddle | undefined> | undefined;

export function getPaddle(): Promise<Paddle | undefined> {
  if (paddleInstance) return Promise.resolve(paddleInstance);
  if (!CLIENT_TOKEN) {
    console.error('[paddle] VITE_PADDLE_CLIENT_TOKEN is not set — checkout overlay cannot open.');
    return Promise.resolve(undefined);
  }
  if (!loading) {
    loading = initializePaddle({ token: CLIENT_TOKEN, environment: ENVIRONMENT }).then((p) => {
      paddleInstance = p;
      return p;
    });
  }
  return loading;
}
