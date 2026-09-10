// Preset avatars used to ship as /assets/playerN.png and are stored that way on
// existing Player documents. The files are now WebP, so rewrite the legacy
// extension at render time instead of migrating every stored cardImage value.
const LEGACY_PRESET = /^\/assets\/player(\d+)\.png$/;

export function resolveCardImage(src?: string): string {
  if (!src) return '';
  return src.replace(LEGACY_PRESET, '/assets/player$1.webp');
}
