import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupportedLanguage, LANGUAGE_OPTIONS, TRANSLATIONS, LanguageOption } from '../constants/translations';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: string, defaultVal?: string) => string;
  hasSelectedLanguage: boolean;
  completeLanguageSelection: (lang: SupportedLanguage) => Promise<void>;
  currentLanguageMeta: LanguageOption;
  availableLanguages: LanguageOption[];
  isLoadingLanguage: boolean;
}

const STORAGE_LANG_KEY = '@user_preferred_language';
const STORAGE_COMPLETED_KEY = '@language_onboarding_completed';

const LanguageContext = createContext<LanguageContextType>({
  language: 'te',
  setLanguage: async () => {},
  t: (key: string, defaultVal?: string) => defaultVal || key,
  hasSelectedLanguage: false,
  completeLanguageSelection: async () => {},
  currentLanguageMeta: LANGUAGE_OPTIONS[0],
  availableLanguages: LANGUAGE_OPTIONS,
  isLoadingLanguage: true,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('te');
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState<boolean>(false);
  const [isLoadingLanguage, setIsLoadingLanguage] = useState<boolean>(true);

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const [savedLang, completedFlag] = await Promise.all([
        AsyncStorage.getItem(STORAGE_LANG_KEY),
        AsyncStorage.getItem(STORAGE_COMPLETED_KEY),
      ]);

      if (savedLang && (savedLang in TRANSLATIONS)) {
        setLanguageState(savedLang as SupportedLanguage);
      }
      if (completedFlag === 'true') {
        setHasSelectedLanguage(true);
      }
    } catch (e) {
      console.warn('Could not load saved language preference:', e);
    } finally {
      setIsLoadingLanguage(false);
    }
  };

  const setLanguage = async (newLang: SupportedLanguage) => {
    try {
      setLanguageState(newLang);
      await AsyncStorage.setItem(STORAGE_LANG_KEY, newLang);
    } catch (e) {
      console.warn('Could not save language preference:', e);
    }
  };

  const completeLanguageSelection = async (chosenLang: SupportedLanguage) => {
    try {
      setLanguageState(chosenLang);
      setHasSelectedLanguage(true);
      await Promise.all([
        AsyncStorage.setItem(STORAGE_LANG_KEY, chosenLang),
        AsyncStorage.setItem(STORAGE_COMPLETED_KEY, 'true'),
      ]);
    } catch (e) {
      console.warn('Could not complete language selection:', e);
    }
  };

  const t = (key: string, defaultVal?: string): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English translation
    if (TRANSLATIONS.en && TRANSLATIONS.en[key]) {
      return TRANSLATIONS.en[key];
    }
    return defaultVal || key;
  };

  const currentLanguageMeta =
    LANGUAGE_OPTIONS.find((opt) => opt.code === language) || LANGUAGE_OPTIONS[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        hasSelectedLanguage,
        completeLanguageSelection,
        currentLanguageMeta,
        availableLanguages: LANGUAGE_OPTIONS,
        isLoadingLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
