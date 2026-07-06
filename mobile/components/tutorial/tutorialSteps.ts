export interface TutorialStep {
  id: string;
  route: string;
  pathname: string;
  targetId?: string;
  title: string;
  text: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    route: '/(tabs)/roster',
    pathname: '/roster',
    title: 'Welcome to CardTeur',
    text: 'Let\'s take a quick tour of every tab, in order — matches are built from your player cards, so we start where the cards live.',
  },
  {
    id: 'roster-tools',
    route: '/(tabs)/roster',
    pathname: '/roster',
    targetId: 'roster-tools',
    title: 'Step 1 — Create Your Cards',
    text: 'Everything starts here. The + button creates a new FIFA-style player card. The other buttons toggle compare, edit and delete modes — one at a time.',
  },
  {
    id: 'roster-random',
    route: '/(tabs)/roster',
    pathname: '/roster',
    targetId: 'roster-random',
    title: 'Feeling Lucky?',
    text: 'You can also unlock a random Bronze, Silver or Gold card here to fill your roster fast.',
  },
  {
    id: 'match-formation',
    route: '/(tabs)/match',
    pathname: '/match',
    targetId: 'match-formation',
    title: 'Step 2 — Pick a Formation',
    text: 'Once you have cards, choose a formation for your match here. You can\'t build a lineup without picking one first.',
  },
  {
    id: 'match-apply',
    route: '/(tabs)/match',
    pathname: '/match',
    targetId: 'match-apply',
    title: 'Build the Lineup',
    text: 'Tap Apply Formation to place the pitch, then tap each empty slot to assign one of your players. GK slots use goalkeeper ratings.',
  },
  {
    id: 'preview',
    route: '/(tabs)/preview',
    pathname: '/preview',
    targetId: 'preview-list',
    title: 'Step 3 — Preview Your Roster',
    text: 'This read-only view groups your squad by position — GK, defence, midfield and attack — so you can size up your roster at a glance.',
  },
  {
    id: 'crew',
    route: '/(tabs)/crew',
    pathname: '/crew',
    targetId: 'crew-list',
    title: 'Step 4 — Your Crews',
    text: 'Crews group your regulars together. Expand a crew to see its members — match announcements go out to crew players.',
  },
  {
    id: 'friends',
    route: '/(tabs)/friends',
    pathname: '/friends',
    targetId: 'friends-tabs',
    title: 'Step 5 — Add Friends',
    text: 'Find friends by their exact Account ID or email in the Add Friend tab. Friends can be linked to their own player cards.',
  },
  {
    id: 'done',
    route: '/(tabs)/roster',
    pathname: '/roster',
    title: 'You\'re Ready!',
    text: 'That\'s the full loop: create cards, pick a formation, build your lineup. Want to see this tour again? Tap the ? button in any screen header.',
  },
];
