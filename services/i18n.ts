import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocaleConfig } from 'react-native-calendars';

import en from '../locales/en.json';
import tr from '../locales/tr.json';
import de from '../locales/de.json';
import es from '../locales/es.json';
import ru from '../locales/ru.json';

const LANGUAGE_KEY = 'user_language';

const resources = {
  en: { translation: en },
  tr: { translation: tr },
  de: { translation: de },
  es: { translation: es },
  ru: { translation: ru },
};

export const SUPPORTED_LANGUAGES = ['en', 'tr', 'de', 'es', 'ru'] as const;
export type LanguageCode = typeof SUPPORTED_LANGUAGES[number];

export function getSystemLanguage(): LanguageCode {
  const locales = Localization.getLocales();
  if (locales && locales.length > 0) {
    const lang = locales[0].languageCode;
    if (lang && SUPPORTED_LANGUAGES.includes(lang as any)) {
      return lang as LanguageCode;
    }
  }
  return 'en';
}

export function setupCalendarLocale(lang: string) {
  if (lang === 'tr') {
    LocaleConfig.locales['tr'] = {
      monthNames: [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
      ],
      monthNamesShort: [
        'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
        'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'
      ],
      dayNames: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
      dayNamesShort: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
      today: 'Bugün'
    };
    LocaleConfig.defaultLocale = 'tr';
  } else if (lang === 'de') {
    LocaleConfig.locales['de'] = {
      monthNames: [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
      ],
      monthNamesShort: [
        'Jan', 'Feb', 'März', 'Apr', 'Mai', 'Juni',
        'Juli', 'Aug', 'Sept', 'Okt', 'Nov', 'Dez'
      ],
      dayNames: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
      dayNamesShort: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
      today: 'Heute'
    };
    LocaleConfig.defaultLocale = 'de';
  } else if (lang === 'es') {
    LocaleConfig.locales['es'] = {
      monthNames: [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ],
      monthNamesShort: [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
      ],
      dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
      today: 'Hoy'
    };
    LocaleConfig.defaultLocale = 'es';
  } else if (lang === 'ru') {
    LocaleConfig.locales['ru'] = {
      monthNames: [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
      ],
      monthNamesShort: [
        'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
        'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
      ],
      dayNames: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
      dayNamesShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
      today: 'Сегодня'
    };
    LocaleConfig.defaultLocale = 'ru';
  } else {
    // English/Default
    LocaleConfig.locales['en'] = {
      monthNames: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ],
      monthNamesShort: [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ],
      dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      today: 'Today'
    };
    LocaleConfig.defaultLocale = 'en';
  }
}

export async function initI18n() {
  let savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
  let activeLanguage: string;

  if (savedLanguage === 'system' || !savedLanguage) {
    activeLanguage = getSystemLanguage();
  } else {
    activeLanguage = savedLanguage;
  }

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: activeLanguage,
      fallbackLng: 'en',
      compatibilityJSON: 'v3' as any,
      interpolation: {
        escapeValue: false,
      },
    });

  setupCalendarLocale(activeLanguage);
}

export async function changeLanguagePreference(preference: 'system' | LanguageCode) {
  await AsyncStorage.setItem(LANGUAGE_KEY, preference);
  const targetLanguage = preference === 'system' ? getSystemLanguage() : preference;
  setupCalendarLocale(targetLanguage);
  await i18n.changeLanguage(targetLanguage);
}

export async function getLanguagePreference(): Promise<'system' | LanguageCode> {
  const pref = await AsyncStorage.getItem(LANGUAGE_KEY);
  return (pref as 'system' | LanguageCode) || 'system';
}

export default i18n;
