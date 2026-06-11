# CardTeur Mobile — Claude Code Guide

## Project overview
React Native (Expo) mobile app for CardTeur. Same Firebase project and MongoDB database as the web app. Same backend API at `https://cardteur-production.up.railway.app/api`. Users who log in on web and mobile see the same players, crews, and friends — they share one account.

---

## Recommended stack

| Layer | Package | Why |
|---|---|---|
| Framework | `expo` (managed workflow) | Fastest setup, no Xcode/Android Studio config for basic features |
| Language | TypeScript | Same as web, shared type definitions possible |
| Navigation | `@react-navigation/native` + `@react-navigation/native-stack` | Standard React Native navigation |
| Auth | `@react-native-firebase/auth` or `firebase` (JS SDK) | Same Firebase project as web |
| HTTP | `fetch` (built-in) | Same `apiRequest` pattern as web |
| Styling | `StyleSheet` (React Native built-in) | No Bootstrap — RN uses its own layout system (Flexbox) |
| State | React Context (same pattern as web) | Share auth and player context logic |

**Managed Expo** is recommended for first-time React Native development — no native build tools needed for iOS/Android simulators, `expo go` works on real devices immediately.

---

## Project structure (proposed)

```
mobile/
├── app/                    # Expo Router pages (file-based routing)
│   ├── _layout.tsx         # Root layout with AuthProvider, navigation
│   ├── index.tsx           # Home / splash
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/             # Bottom tab navigation (logged-in)
│   │   ├── _layout.tsx
│   │   ├── roster.tsx      # PlayersPage equivalent
│   │   ├── match.tsx
│   │   ├── preview.tsx
│   │   ├── crew.tsx
│   │   └── friends.tsx
│   └── player/
│       ├── add.tsx
│       └── [id].tsx        # Edit player
├── components/             # Shared components
├── contexts/               # AuthContext, PlayerContext (same pattern as web)
├── services/
│   ├── api/
│   │   ├── apiClient.ts    # Same apiRequest pattern, same base URL
│   │   └── types.ts        # Copy from openteur/src/services/api/types.ts
│   └── AuthService.ts      # getCurrentUserToken() for Firebase ID token
├── hooks/                  # Custom hooks
├── constants/
│   └── theme.ts            # Colors (same as web: #1A2B42, #00deec, etc.)
└── CLAUDE.md               # This file
```

---

## Auth & API

### Firebase
- Use the **same Firebase project** as the web app. Same `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID` etc.
- For Expo managed workflow: use `firebase` (JS SDK) with `expo-firebase-recaptcha` for phone, or just `signInWithEmailAndPassword` for email/password.
- Store credentials in `mobile/.env` using Expo's `EXPO_PUBLIC_` prefix convention.
- `getCurrentUserToken()` returns `await auth.currentUser?.getIdToken()` — same shape as web.

### API client
- Base URL: `https://cardteur-production.up.railway.app/api`
- Same `apiRequest()` pattern: attach `Authorization: Bearer <token>`, throw on non-2xx.
- Copy `openteur/src/services/api/types.ts` to `mobile/services/api/types.ts` and keep them in sync when adding Player fields.

```typescript
// mobile/services/api/apiClient.ts
const API_BASE = 'https://cardteur-production.up.railway.app/api';

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getCurrentUserToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}
```

---

## Navigation structure

```
Stack (root)
├── (auth) — shown when not logged in
│   ├── /login
│   └── /signup
└── (tabs) — shown when logged in
    ├── Roster (PlayersPage)
    ├── Match
    ├── Preview
    ├── Crew
    └── Friends
```

Use `AuthContext` (same as web) to gate screens: if `!currentUser`, show auth stack; otherwise show tab stack. In Expo Router, this is handled in `app/_layout.tsx` using `<Redirect>`.

---

## Styling & theme

React Native does NOT support CSS or Bootstrap. Use `StyleSheet.create()` with the same design tokens:

```typescript
// mobile/constants/theme.ts
export const Colors = {
  background: '#1A2B42',
  panelBg: 'rgba(36, 59, 90, 0.75)',
  accent: '#00deec',
  error: '#ff6b6b',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.7)',
  border: 'rgba(255,255,255,0.1)',
};
```

- Layouts use Flexbox (RN's default, same concept as CSS Flexbox).
- No `class` or `className` — use `style` prop with `StyleSheet`.
- Fonts: use `expo-font` if you want custom fonts; otherwise system fonts.
- Animations: use `Animated` API or `react-native-reanimated` for smoother animations.

---

## Shared logic with web

These can be copy-pasted or lightly adapted from the web:

| Web file | Mobile equivalent | Notes |
|---|---|---|
| `openteur/src/services/api/types.ts` | `mobile/services/api/types.ts` | Keep in sync |
| `openteur/src/contexts/AuthContext.tsx` | `mobile/contexts/AuthContext.tsx` | Same logic, Firebase import differs |
| `openteur/src/services/api/apiClient.ts` | `mobile/services/api/apiClient.ts` | Same pattern, no browser-specific code |
| Player stat calculations (offensiveOverall, etc.) | Same pure functions | Pure TS, no DOM dependency |

Do NOT copy JSX/Bootstrap components — they are web-only. Rewrite all UI in React Native primitives (`View`, `Text`, `TextInput`, `ScrollView`, `FlatList`, etc.).

---

## Behavior rules

### Don't
- Use `window`, `document`, or any browser globals — React Native has no DOM.
- Use Bootstrap or any web CSS library.
- Hardcode the API base URL — use the constant.
- Duplicate backend logic — all business logic stays in `server/`.
- Copy `ownerUid` to the request body — same rule as web.

### Do
- Use `ScrollView` for long content, `FlatList` for lists (performance).
- Use `SafeAreaView` for iOS notch/home indicator spacing.
- Use `KeyboardAvoidingView` on forms so the keyboard doesn't cover inputs.
- Handle platform differences with `Platform.OS === 'ios'` only when necessary.
- Keep auth token refresh logic in `getCurrentUserToken()` — Firebase handles it automatically.

### Requires confirmation
- New routes added to `server/` (database schema changes).
- Publishing to App Store / Play Store.
- Any change that breaks the web app's data contract.

---

## Dev setup

```bash
# In the mobile/ directory
npx create-expo-app . --template blank-typescript
npm install

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android

# Run on real device (scan QR with Expo Go app)
npx expo start
```

Requires:
- Node 18+
- Expo Go on a real device OR Xcode (iOS) / Android Studio (Android) for simulators.
- Same Firebase project credentials as web — create `mobile/.env`:

```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

---

## Known differences from web

| Web behavior | Mobile equivalent |
|---|---|
| React Router `<Link>`, `navigate()` | Expo Router `<Link>`, `router.push()` |
| Bootstrap modal | React Native `Modal` component |
| Bootstrap toast | Custom `Toast` using `Animated` or a library like `react-native-toast-message` |
| `<img>` tag | `<Image>` from `react-native` |
| `<input>` | `<TextInput>` |
| CSS hover effects | Touch feedback via `Pressable` / `TouchableOpacity` |
| `window.confirm` | `Alert.alert()` |
| `localStorage` | `@react-native-async-storage/async-storage` |
| Copy to clipboard | `expo-clipboard` |

---

## Player card rendering

The FIFA-style card design from the web can be adapted to React Native using:
- `View` with `borderRadius` and a gradient background (`expo-linear-gradient`)
- `Text` components for stats
- `Image` for player photo (`uri` source)

Keep the same tier logic (`Bronze/Silver/Gold Player N`) and stat calculations.

---

## Deployment

- iOS: publish via Expo EAS Build → TestFlight → App Store.
- Android: publish via Expo EAS Build → Google Play.
- Config in `app.json` / `eas.json`.
- The backend (Railway) does not need changes — mobile uses the same API.
