// Lightweight, app-wide sound-effect layer for the "modern" UI sounds used
// alongside animations (card reveal, team balance, toasts, crew actions,
// login/unlock). Sounds are CC0 (public domain) "glass" theme clips from
// the open-source `uisfx` sound pack — https://uisfx.com — chosen to match
// this app's clean, glassy cyan/dark aesthetic. The same files are reused
// on the web app (openteur/public/sounds).
//
// Playback never blocks or throws into the caller: every failure (missing
// audio hardware, permissions, an unsupported platform, sound muted by the
// user) is swallowed, since sound here is a nice-to-have, never something
// the app's functionality should depend on.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const SOUND_ASSETS = {
  // Card reveal (roster.tsx random Gold/Silver/Bronze generation)
  achievement: require('../assets/sounds/achievement.mp3'),
  // Team balance / match setup complete (match.tsx "Dengele")
  complete: require('../assets/sounds/complete.mp3'),
  // Generic success toast
  success: require('../assets/sounds/success.mp3'),
  // Generic error toast
  error: require('../assets/sounds/error.mp3'),
  // Player added to a crew
  badge: require('../assets/sounds/badge.mp3'),
  // Destructive actions (delete player / delete crew)
  delete: require('../assets/sounds/delete.mp3'),
  // Lightweight selection tap (quick-add to team, picking a formation …)
  select: require('../assets/sounds/select.mp3'),
  // Claiming a guest account / logging in
  unlock: require('../assets/sounds/unlock.mp3'),
} as const;

export type SoundName = keyof typeof SOUND_ASSETS;

const STORAGE_KEY = 'soundEffectsEnabled';

let audioModeReady = false;
let soundEnabled = true;
let loadedFromStorage = false;
const listeners = new Set<(enabled: boolean) => void>();
const players: Partial<Record<SoundName, AudioPlayer>> = {};

function ensureAudioMode() {
  if (audioModeReady) return;
  audioModeReady = true;
  // Respect the phone's silent/ringer switch on iOS — these are playful UI
  // accents, not something that should buzz through a muted phone in a
  // meeting — and never keep audio alive in the background.
  setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false }).catch(() => {});
}

function getPlayer(name: SoundName): AudioPlayer | null {
  const existing = players[name];
  if (existing) return existing;
  try {
    const player = createAudioPlayer(SOUND_ASSETS[name]);
    players[name] = player;
    return player;
  } catch {
    return null;
  }
}

/** Loads the persisted mute preference. Safe to call multiple times (e.g. once per screen that shows the toggle) — only the first call actually reads storage. */
export async function loadSoundPreference(): Promise<boolean> {
  if (loadedFromStorage) return soundEnabled;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored !== null) soundEnabled = stored === 'true';
  } catch {
    // default stays true
  } finally {
    loadedFromStorage = true;
  }
  return soundEnabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

/** Turns sound effects on/off app-wide and persists the choice. */
export async function setSoundEnabled(enabled: boolean): Promise<void> {
  soundEnabled = enabled;
  listeners.forEach((listener) => listener(enabled));
  try {
    await AsyncStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    // best-effort — the in-memory flag for this session is still correct
  }
}

/** Subscribes to sound-enabled changes (e.g. to keep a Settings switch in sync if toggled elsewhere). Returns an unsubscribe function. */
export function subscribeSoundEnabled(listener: (enabled: boolean) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Plays a short UI sound effect by name. Safe to call from anywhere, including outside React components (event handlers, callbacks). No-ops silently if sound is muted or playback fails. */
export function playSound(name: SoundName) {
  if (!soundEnabled) return;
  try {
    ensureAudioMode();
    const player = getPlayer(name);
    if (!player) return;
    player.seekTo(0).finally(() => {
      try {
        player.play();
      } catch {
        // ignore
      }
    });
  } catch {
    // ignore — never let a sound-effect failure affect the app
  }
}
