import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { TUTORIAL_STEPS, TutorialStep } from '../components/tutorial/tutorialSteps';
import { useAuth } from './AuthContext';

interface TutorialContextType {
  active: boolean;
  stepIndex: number;
  totalSteps: number;
  steps: TutorialStep[];
  startTutorial: () => void;
  closeTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isGuest } = useAuth();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // A guest (unregistered) account can't open a claimed-only page, so its
  // tour skips those steps entirely instead of navigating to a page that
  // just shows a "create an account" screen.
  const steps = useMemo(
    () => (isGuest ? TUTORIAL_STEPS.filter(step => !step.guestLocked) : TUTORIAL_STEPS),
    [isGuest]
  );

  const startTutorial = useCallback(() => {
    setStepIndex(0);
    setActive(true);
  }, []);

  const closeTutorial = useCallback(() => {
    setActive(false);
    setStepIndex(0);
  }, []);

  const nextStep = useCallback(() => {
    setStepIndex(prev => {
      if (prev >= steps.length - 1) {
        setActive(false);
        return 0;
      }
      return prev + 1;
    });
  }, [steps.length]);

  const prevStep = useCallback(() => {
    setStepIndex(prev => Math.max(0, prev - 1));
  }, []);

  return (
    <TutorialContext.Provider
      value={{
        active,
        stepIndex,
        totalSteps: steps.length,
        steps,
        startTutorial,
        closeTutorial,
        nextStep,
        prevStep,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) throw new Error('useTutorial must be used within TutorialProvider');
  return context;
};
