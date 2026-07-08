export interface TutorialStep {
  id: string;
  route: string;
  target?: string;
  titleKey: string;
  textKey: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'home',
    route: '/',
    target: '[data-tutorial="home-grid"]',
    titleKey: 'tutorial.homeTitle',
    textKey: 'tutorial.homeText',
  },
  {
    id: 'roster-add',
    route: '/manage',
    target: '[data-tutorial="roster-add"]',
    titleKey: 'tutorial.rosterAddTitle',
    textKey: 'tutorial.rosterAddText',
  },
  {
    id: 'roster-random',
    route: '/manage',
    target: '[data-tutorial="roster-random"]',
    titleKey: 'tutorial.rosterRandomTitle',
    textKey: 'tutorial.rosterRandomText',
  },
  {
    id: 'roster-tools',
    route: '/manage',
    target: '[data-tutorial="roster-tools"]',
    titleKey: 'tutorial.rosterToolsTitle',
    textKey: 'tutorial.rosterToolsText',
  },
  {
    id: 'preview',
    route: '/preview',
    target: '[data-tutorial="preview-sections"]',
    titleKey: 'tutorial.previewTitle',
    textKey: 'tutorial.previewText',
  },
  {
    id: 'match-builder',
    route: '/match',
    target: '[data-tutorial="match-builder"]',
    titleKey: 'tutorial.matchBuilderTitle',
    textKey: 'tutorial.matchBuilderText',
  },
  {
    id: 'match-actions',
    route: '/match',
    target: '[data-tutorial="match-actions"]',
    titleKey: 'tutorial.matchActionsTitle',
    textKey: 'tutorial.matchActionsText',
  },
  {
    id: 'schedule',
    route: '/schedule',
    target: '[data-tutorial="schedule-list"]',
    titleKey: 'tutorial.scheduleTitle',
    textKey: 'tutorial.scheduleText',
  },
  {
    id: 'crew',
    route: '/crew',
    target: '[data-tutorial="crew-add"]',
    titleKey: 'tutorial.crewTitle',
    textKey: 'tutorial.crewText',
  },
  {
    id: 'friends',
    route: '/friends',
    target: '[data-tutorial="friends-tabs"]',
    titleKey: 'tutorial.friendsTitle',
    textKey: 'tutorial.friendsText',
  },
  {
    id: 'done',
    route: '/',
    titleKey: 'tutorial.doneTitle',
    textKey: 'tutorial.doneText',
  },
];
