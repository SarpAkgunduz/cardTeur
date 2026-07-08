import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en';
import tr from './locales/tr';
import de from './locales/de';
import az from './locales/az';
import pl from './locales/pl';
import ru from './locales/ru';
import zh from './locales/zh';
import ko from './locales/ko';
import ja from './locales/ja';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'de', label: 'Deutsch' },
  { code: 'az', label: 'Azərbaycanca' },
  { code: 'pl', label: 'Polski' },
  { code: 'ru', label: 'Русский' },
  { code: 'zh', label: '中文' },
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      tr: { translation: tr },
      de: { translation: de },
      az: { translation: az },
      pl: { translation: pl },
      ru: { translation: ru },
      zh: { translation: zh },
      ko: { translation: ko },
      ja: { translation: ja },
    },
    fallbackLng: 'en',
    supportedLngs: LANGUAGES.map(l => l.code),
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'ct_lang',
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
