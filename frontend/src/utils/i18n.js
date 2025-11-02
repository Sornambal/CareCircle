import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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

// Language mapping from full names to i18n codes
const languageMap = {
  'English': 'en',
  'Tamil': 'ta',
  'Telugu': 'te',
  'Hindi': 'hi',
  'Malayalam': 'ml'
};

// Get default language from localStorage user preference
const getDefaultLanguage = () => {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      return languageMap[user.preferredLanguage] || 'en';
    }
  } catch (e) {
    console.warn('Error parsing user data for language:', e);
  }
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDefaultLanguage(), // Set language from user preference
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  });

// Get current language
export const getCurrentLanguage = () => {
  return i18n.language;
};

export default i18n;
