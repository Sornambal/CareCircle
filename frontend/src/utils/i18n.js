import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translation files
import en from '../locales/en.json';
import ta from '../locales/ta.json';
import te from '../locales/te.json';
import ml from '../locales/ml.json';
import hi from '../locales/hi.json';

// Map language codes to translation objects
const resources = {
  en: { translation: en },
  ta: { translation: ta },
  te: { translation: te },
  ml: { translation: ml },
  hi: { translation: hi },
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

// Function to set language
export const setLanguage = (language) => {
  i18n.changeLanguage(language);
};

// Translation function
export const t = (key, options = {}) => {
  return i18n.t(key, options);
};

// Get current language
export const getCurrentLanguage = () => {
  return i18n.language;
};

export default i18n;
