import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import id from '../translations/id';
import en from '../translations/en';

type Language = 'id' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoaded: boolean;
}

const translations: Record<Language, any> = { id, en };
const LANGUAGE_KEY = '@app_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('id');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLang === 'id' || savedLang === 'en') {
        setLanguageState(savedLang as Language);
      }
    } catch (e) {
      console.error('Failed to load language', e);
    } finally {
      setIsLoaded(true);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      setLanguageState(lang);
    } catch (e) {
      console.error('Failed to save language', e);
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value = translations[language];
    let found = true;

    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        found = false;
        break;
      }
    }

    if (!found) {
      // Fallback to English
      let fallback = translations['en'];
      let fallbackFound = true;
      for (const k of keys) {
        if (fallback && fallback[k]) {
          fallback = fallback[k];
        } else {
          fallbackFound = false;
          break;
        }
      }
      if (fallbackFound) {
        value = fallback;
      } else {
        return key;
      }
    }

    if (params && typeof value === 'string') {
      let result = value;
      Object.keys(params).forEach((param) => {
        result = result.replace(new RegExp(`\\{${param}\\}`, 'g'), String(params[param]));
      });
      return result;
    }

    return value !== undefined ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoaded }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
