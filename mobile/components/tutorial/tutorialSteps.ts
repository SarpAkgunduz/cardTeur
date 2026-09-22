export interface TutorialStep {
  id: string;
  route: string;
  pathname: string;
  targetId?: string;
  titleKey: string;
  textKey: string;
  // Set on a step whose screen requires a claimed (non-guest) account —
  // it's skipped for guests, who would otherwise be shown the locked-screen
  // instead of the real content the step is pointing at.
  guestLocked?: boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    route: '/(tabs)/roster',
    pathname: '/roster',
    titleKey: 'tutorial.welcomeTitle',
    textKey: 'tutorial.welcomeText',
  },
  {
    id: 'roster-tools',
    route: '/(tabs)/roster',
    pathname: '/roster',
    targetId: 'roster-tools',
    titleKey: 'tutorial.rosterToolsTitle',
    textKey: 'tutorial.rosterToolsText',
  },
  {
    id: 'roster-random',
    route: '/(tabs)/roster',
    pathname: '/roster',
    targetId: 'roster-random',
    titleKey: 'tutorial.rosterRandomTitle',
    textKey: 'tutorial.rosterRandomText',
  },
  {
    id: 'match-formation',
    route: '/(tabs)/match',
    pathname: '/match',
    targetId: 'match-formation',
    titleKey: 'tutorial.matchFormationTitle',
    textKey: 'tutorial.matchFormationText',
  },
  {
    id: 'match-apply',
    route: '/(tabs)/match',
    pathname: '/match',
    targetId: 'match-apply',
    titleKey: 'tutorial.matchApplyTitle',
    textKey: 'tutorial.matchApplyText',
  },
  {
    id: 'preview',
    route: '/(tabs)/preview',
    pathname: '/preview',
    targetId: 'preview-list',
    titleKey: 'tutorial.previewTitle',
    textKey: 'tutorial.previewText',
  },
  {
    id: 'crew',
    guestLocked: true,
    route: '/(tabs)/crew',
    pathname: '/crew',
    targetId: 'crew-list',
    titleKey: 'tutorial.crewTitle',
    textKey: 'tutorial.crewText',
  },
  {
    id: 'friends',
    guestLocked: true,
    route: '/(tabs)/friends',
    pathname: '/friends',
    targetId: 'friends-tabs',
    titleKey: 'tutorial.friendsTitle',
    textKey: 'tutorial.friendsText',
  },
  {
    id: 'done',
    route: '/(tabs)/roster',
    pathname: '/roster',
    titleKey: 'tutorial.doneTitle',
    textKey: 'tutorial.doneText',
  },
];
