import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const STORAGE_KEY = 'ct_lang';
const supportedCodes = LANGUAGES.map(l => l.code);

// Device language detection without adding a new native dependency —
// Hermes/RN ship an Intl polyfill that exposes the resolved locale.
const detectDeviceLanguage = (): string => {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale || 'en';
    return locale.split('-')[0];
  } catch {
    return 'en';
  }
};

let initPromise: Promise<typeof i18n> | null = null;

export const initI18n = (): Promise<typeof i18n> => {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    let lng = 'en';
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored && supportedCodes.includes(stored)) {
        lng = stored;
      } else {
        const device = detectDeviceLanguage();
        lng = supportedCodes.includes(device) ? device : 'en';
      }
    } catch {
      lng = 'en';
    }

    await i18n
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
        lng,
        fallbackLng: 'en',
        supportedLngs: supportedCodes,
        interpolation: { escapeValue: false },
      });

    return i18n;
  })();

  return initPromise;
};

export const changeLanguage = async (code: string) => {
  await i18n.changeLanguage(code);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, code);
  } catch {
    // non-fatal — language still applies for this session
  }
};

export default i18n;
