import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTutorial } from '../../contexts/TutorialContext';
import { TUTORIAL_STEPS } from './tutorialSteps';
import './TutorialOverlay.css';

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const SPOTLIGHT_PADDING = 10;
const POPUP_WIDTH = 360;
const POPUP_EST_HEIGHT = 240;
const POPUP_GAP = 18;
const FIND_INTERVAL_MS = 120;
const FIND_MAX_TRIES = 25;

const TutorialOverlay = () => {
  const { active, stepIndex, totalSteps, closeTutorial, nextStep, prevStep } = useTutorial();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const [searching, setSearching] = useState(false);

  const step = TUTORIAL_STEPS[stepIndex];

  const measure = useCallback((el: Element): SpotlightRect => {
    const r = el.getBoundingClientRect();
    return {
      top: r.top - SPOTLIGHT_PADDING,
      left: r.left - SPOTLIGHT_PADDING,
      width: r.width + SPOTLIGHT_PADDING * 2,
      height: r.height + SPOTLIGHT_PADDING * 2,
    };
  }, []);

  // Reset the spotlight as soon as the step changes
  useEffect(() => {
    setRect(null);
    setSearching(!!step?.target);
  }, [stepIndex, step]);

  // Navigate to the step's route when needed
  useEffect(() => {
    if (!active || !step) return;
    if (location.pathname !== step.route) {
      navigate(step.route);
    }
  }, [active, step, location.pathname, navigate]);

  // Find and track the target element
  useEffect(() => {
    if (!active || !step) return;
    if (location.pathname !== step.route) return;

    setRect(null);

    if (!step.target) {
      setSearching(false);
      return;
    }

    setSearching(true);
    let tries = 0;
    let found: Element | null = null;

    const tryFind = () => {
      const el = document.querySelector(step.target!);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 24 && r.height > 24) {
          found = el;
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
          setTimeout(() => setRect(measure(el)), 350);
          setSearching(false);
          clearInterval(interval);
          return;
        }
      }
      tries += 1;
      if (tries >= FIND_MAX_TRIES) {
        setSearching(false);
        clearInterval(interval);
      }
    };

    const interval = setInterval(tryFind, FIND_INTERVAL_MS);
    tryFind();

    const remeasure = () => {
      if (found) setRect(measure(found));
    };
    window.addEventListener('resize', remeasure);
    window.addEventListener('scroll', remeasure, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', remeasure);
      window.removeEventListener('scroll', remeasure, true);
    };
  }, [active, step, stepIndex, location.pathname, measure]);

  // Escape closes the tutorial
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTutorial();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, closeTutorial]);

  if (!active || !step || searching) return null;

  const centered = !rect;

  let popupStyle: React.CSSProperties = {};
  if (rect) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.min(Math.max(12, rect.left), Math.max(12, vw - POPUP_WIDTH - 12));
    const below = rect.top + rect.height + POPUP_GAP;
    const top = below + POPUP_EST_HEIGHT <= vh
      ? below
      : Math.max(12, rect.top - POPUP_EST_HEIGHT - POPUP_GAP);
    popupStyle = { top, left, width: Math.min(POPUP_WIDTH, vw - 24) };
  }

  const isLast = stepIndex === totalSteps - 1;

  return (
    <div className="ct-tutorial">
      {rect ? (
        <div
          className="ct-tutorial__spotlight"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
        />
      ) : (
        <div className="ct-tutorial__dim" />
      )}

      <div
        className={`ct-tutorial__popup ${centered ? 'ct-tutorial__popup--centered' : ''}`}
        style={centered ? undefined : popupStyle}
        role="dialog"
        aria-modal="true"
        aria-label="Tutorial"
      >
        <button
          className="ct-tutorial__close"
          onClick={closeTutorial}
          aria-label={t('common.close')}
        >
          <i className="bi bi-x-lg" />
        </button>
        <span className="ct-tutorial__progress">
          {stepIndex + 1} / {totalSteps}
        </span>
        <h3 className="ct-tutorial__title">{t(step.titleKey)}</h3>
        <p className="ct-tutorial__text">{t(step.textKey)}</p>
        <div className="ct-tutorial__actions">
          <button className="ct-tutorial__skip" onClick={closeTutorial}>
            {t('tutorial.skip')}
          </button>
          <div className="ct-tutorial__nav-btns">
            {stepIndex > 0 && (
              <button className="btn-ct ct-tutorial__btn" onClick={prevStep}>
                {t('common.back')}
              </button>
            )}
            <button className="btn-ct ct-tutorial__btn ct-tutorial__btn--next" onClick={nextStep}>
              {isLast ? t('common.finish') : t('common.next')}
              {!isLast && <i className="bi bi-arrow-right ct-tutorial__btn-icon" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;
