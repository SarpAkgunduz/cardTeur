// Web's preset avatars live at its own hosting as plain relative paths
// (e.g. "/assets/player7.webp"), which resolve fine in a browser (it fills
// in its own origin) but not in React Native's <Image>, which has no
// origin to resolve a relative URI against — those come back blank on
// mobile. Pointing them at the web app's own host fixes any player created
// via web's preset picker so it also shows correctly here.
const WEB_ASSET_ORIGIN = process.env.EXPO_PUBLIC_WEB_ASSET_ORIGIN ?? 'https://cardteur.com';

// Very old players stored the preset path with its original (pre-WebP)
// extension — rewrite it the same way web does at render time rather than
// migrating every stored cardImage value.
const LEGACY_PRESET = /^\/assets\/player(\d+)\.png$/;

export function resolveCardImage(src?: string): string {
  if (!src) return '';
  const rewritten = src.replace(LEGACY_PRESET, '/assets/player$1.webp');
  return rewritten.startsWith('/') ? `${WEB_ASSET_ORIGIN}${rewritten}` : rewritten;
}

// Same 42 preset avatars the web app's card/photo picker offers — keeping
// the pool identical means a card made on either platform looks the same
// on both.
const PRESET_AVATAR_COUNT = 42;
export const PRESET_AVATARS: string[] = Array.from(
  { length: PRESET_AVATAR_COUNT },
  (_, i) => resolveCardImage(`/assets/player${i + 1}.webp`)
);
