export interface TutorialStep {
  id: string;
  route: string;
  target?: string;
  title: string;
  text: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'home',
    route: '/',
    target: '[data-tutorial="home-grid"]',
    title: 'Welcome to CardTeur',
    text: 'This is your dashboard. Every part of your league lives behind these tiles. Let\'s walk through them in order — the order matters, because matches are built from your cards.',
  },
  {
    id: 'roster-add',
    route: '/manage',
    target: '[data-tutorial="roster-add"]',
    title: 'Step 1 — Create Your Cards',
    text: 'Everything starts here. Use Add Player to create a FIFA-style card for each player in your squad — stats, position and photo.',
  },
  {
    id: 'roster-random',
    route: '/manage',
    target: '[data-tutorial="roster-random"]',
    title: 'Feeling Lucky?',
    text: 'You can also unlock a random Bronze, Silver or Gold card here to fill your roster fast.',
  },
  {
    id: 'roster-tools',
    route: '/manage',
    target: '[data-tutorial="roster-tools"]',
    title: 'Manage Your Squad',
    text: 'Compare two players side by side, edit a card, or remove one. Only one mode can be active at a time.',
  },
  {
    id: 'preview',
    route: '/preview',
    target: '[data-tutorial="preview-sections"]',
    title: 'Step 2 — Preview Your Roster',
    text: 'Once you have cards, this read-only view groups them by position — GK, defence, midfield and attack — so you can see your squad at a glance.',
  },
  {
    id: 'match-builder',
    route: '/match',
    target: '[data-tutorial="match-builder"]',
    title: 'Step 3 — Build the Match',
    text: 'Pick a crew, the number of players and a formation for each team, then hit Apply Formation. Your players are placed on the pitch and you can drag them around.',
  },
  {
    id: 'match-actions',
    route: '/match',
    target: '[data-tutorial="match-actions"]',
    title: 'Save, Then Announce',
    text: 'After applying a formation, Save and Announce Match appear here. You must build a match before you can announce it — save the lineup, then announce it to email every player the match details.',
  },
  {
    id: 'schedule',
    route: '/schedule',
    target: '[data-tutorial="schedule-list"]',
    title: 'Step 4 — Your Saved Matches',
    text: 'Every match you save lands here. You can review the lineups and announce a match later if you skipped it earlier.',
  },
  {
    id: 'crew',
    route: '/crew',
    target: '[data-tutorial="crew-add"]',
    title: 'Step 5 — Organize Crews',
    text: 'Group your regulars into crews and keep their contact emails here — announcements are sent to these addresses.',
  },
  {
    id: 'friends',
    route: '/friends',
    target: '[data-tutorial="friends-tabs"]',
    title: 'Step 6 — Add Friends',
    text: 'Find friends by their exact Account ID or email in the Add Friend tab, and manage requests here. Friends can be linked to their own cards.',
  },
  {
    id: 'done',
    route: '/',
    title: 'You\'re Ready!',
    text: 'That\'s the full loop: create cards, build and save a match, announce it. If you ever want to see this tour again, click the ? button in the navbar.',
  },
];
