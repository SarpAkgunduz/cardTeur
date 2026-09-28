// Lightweight, app-wide sound-effect layer for the "modern" UI sounds used
// alongside animations (card reveal, team balance, toasts, crew actions,
// login/unlock). Sounds are CC0 (public domain) "glass" theme clips from
// the open-source `uisfx` sound pack — https://uisfx.com — chosen to match
// this app's clean, glassy cyan/dark aesthetic. The same files are reused
// on the mobile app (mobile/assets/sounds).
//
// Playback never throws into the caller: every failure (autoplay policy
// blocking an unprompted play() before any user gesture, a missing file,
// an unsupported browser) is swallowed, since sound here is a nice-to-have,
// never something the app's functionality should depend on.

const SOUND_FILES = {
  // Card reveal (random Gold/Silver/Bronze generation)
  achievement: '/sounds/achievement.mp3',
  // Team balance / match setup complete
  complete: '/sounds/complete.mp3',
  // Generic success toast
  success: '/sounds/success.mp3',
  // Generic error toast
  error: '/sounds/error.mp3',
  // Player added to a crew
  badge: '/sounds/badge.mp3',
  // Destructive actions (delete player / delete crew)
  delete: '/sounds/delete.mp3',
  // Lightweight selection tap (quick-add to team, picking a formation …)
  select: '/sounds/select.mp3',
  // Claiming a guest account / logging in
  unlock: '/sounds/unlock.mp3',
} as const;

export type SoundName = keyof typeof SOUND_FILES;

const STORAGE_KEY = 'cardteur.soundEffectsEnabled';

let soundEnabled = true;
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored !== null) soundEnabled = stored === 'true';
} catch {
  // default stays true (e.g. localStorage unavailable in this context)
}

const listeners = new Set<(enabled: boolean) => void>();
const audioCache: Partial<Record<SoundName, HTMLAudioElement>> = {};

function getAudio(name: SoundName): HTMLAudioElement | null {
  const existing = audioCache[name];
  if (existing) return existing;
  try {
    const audio = new Audio(SOUND_FILES[name]);
    audio.preload = 'auto';
    audioCache[name] = audio;
    return audio;
  } catch {
    return null;
  }
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

/** Turns sound effects on/off app-wide and persists the choice. */
export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  listeners.forEach((listener) => listener(enabled));
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    // best-effort — the in-memory flag for this session is still correct
  }
}

/** Subscribes to sound-enabled changes (e.g. to keep a Settings switch in sync if toggled elsewhere/another tab). Returns an unsubscribe function. */
export function subscribeSoundEnabled(listener: (enabled: boolean) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Plays a short UI sound effect by name. No-ops silently if sound is muted, the browser blocks autoplay, or playback otherwise fails. */
export function playSound(name: SoundName) {
  if (!soundEnabled) return;
  const audio = getAudio(name);
  if (!audio) return;
  try {
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Autoplay can be blocked before any user gesture — harmless no-op.
    });
  } catch {
    // ignore
  }
}
