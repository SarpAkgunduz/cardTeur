import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { View } from 'react-native';
import { TUTORIAL_STEPS } from '../components/tutorial/tutorialSteps';

interface TutorialContextType {
  active: boolean;
  stepIndex: number;
  totalSteps: number;
  startTutorial: () => void;
  closeTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  registerTarget: (id: string, node: View | null) => void;
  getTarget: (id: string) => View | null;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const targetsRef = useRef<Record<string, View | null>>({});

  const registerTarget = useCallback((id: string, node: View | null) => {
    targetsRef.current[id] = node;
  }, []);

  const getTarget = useCallback((id: string) => targetsRef.current[id] ?? null, []);

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
      if (prev >= TUTORIAL_STEPS.length - 1) {
        setActive(false);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const prevStep = useCallback(() => {
    setStepIndex(prev => Math.max(0, prev - 1));
  }, []);

  return (
    <TutorialContext.Provider
      value={{
        active,
        stepIndex,
        totalSteps: TUTORIAL_STEPS.length,
        startTutorial,
        closeTutorial,
        nextStep,
        prevStep,
        registerTarget,
        getTarget,
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
