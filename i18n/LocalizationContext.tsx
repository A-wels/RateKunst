import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import {NativeModules} from 'react-native';

export type Language = 'de' | 'en';

const LANGUAGE_KEY = '@ratekunst/language';

const translations = {
  de: {
    appName: 'RateKunst',
    startMenu: 'Spiel vorbereiten',
    customSets: 'Eigene Sets',
    editSet: 'Set bearbeiten',
    homeEyebrow: 'SCHNELL DENKEN. SCHNELLER ANTWORTEN.',
    homeTitle: 'Bereit für die nächste Runde?',
    homeSubtitle: 'Wählt Themen, fügt Spieler hinzu und los geht’s.',
    packs: 'Themenpacks',
    choosePacks: 'Themenpacks auswählen',
    search: 'Packs durchsuchen …',
    selectedCount: '{{count}} ausgewählt',
    players: 'Spieler',
    playerName: 'Name eingeben',
    addPlayer: 'Spieler hinzufügen',
    noPlayers: 'Noch keine Spieler – wer tritt an?',
    pointsToWin: 'Siegpunkte',
    start: 'Runde starten',
    editCustomSets: 'Eigene Sets verwalten',
    nameTooLongTitle: 'Name zu lang',
    nameTooLongMessage: 'Maximal 25 Zeichen pro Spieler.',
    tooManyPlayersTitle: 'Zu viele Spieler',
    tooManyPlayersMessage: 'Maximal 12 Spieler sind möglich.',
    noPlayersTitle: 'Keine Spieler',
    noPlayersMessage: 'Füge mindestens einen Spieler hinzu.',
    noPackTitle: 'Kein Themenpack',
    noPackMessage: 'Wähle mindestens ein Themenpack aus.',
    question: 'Kategorie',
    letter: 'Buchstabe',
    skip: 'Überspringen',
    firstTo: 'Erste Person mit {{count}} Punkten gewinnt',
    tapScore: 'Tippen für einen Punkt',
    winnerTitle: 'Gewonnen!',
    winnerMessage: '{{name}} gewinnt die Runde.',
    backToMenu: 'Zurück zum Menü',
    leaveGameTitle: 'Runde verlassen?',
    leaveGameMessage: 'Der aktuelle Punktestand geht verloren.',
    stay: 'Weiterspielen',
    leave: 'Verlassen',
    newSet: 'Neues Set',
    noCustomSets: 'Noch keine eigenen Sets',
    noCustomSetsBody: 'Erstelle ein Pack mit euren Insider-Kategorien.',
    createSet: 'Erstes Set erstellen',
    delete: 'Löschen',
    deleteSetTitle: 'Set löschen?',
    deleteSetMessage: '„{{title}}“ wird dauerhaft entfernt.',
    cancel: 'Abbrechen',
    setTitle: 'Titel',
    setTitlePlaceholder: 'Zum Beispiel: Unsere Insider',
    categories: 'Kategorien',
    categoriesHint: 'Eine Kategorie pro Zeile',
    categoriesPlaceholder:
      'Peinlicher Versprecher\nUrlaubserlebnis\nSchlechter Filmtitel',
    saved: 'Gespeichert',
    saving: 'Speichert …',
    categoryCount: '{{count}} Kategorien',
    untitledSet: 'Unbenanntes Set',
    language: 'Sprache',
    german: 'Deutsch',
    english: 'English',
  },
  en: {
    appName: 'RateKunst',
    startMenu: 'Set up game',
    customSets: 'Custom packs',
    editSet: 'Edit pack',
    homeEyebrow: 'THINK FAST. ANSWER FASTER.',
    homeTitle: 'Ready for the next round?',
    homeSubtitle: 'Choose topics, add players, and jump in.',
    packs: 'Topic packs',
    choosePacks: 'Choose topic packs',
    search: 'Search packs …',
    selectedCount: '{{count}} selected',
    players: 'Players',
    playerName: 'Enter a name',
    addPlayer: 'Add player',
    noPlayers: 'No players yet — who is joining?',
    pointsToWin: 'Points to win',
    start: 'Start round',
    editCustomSets: 'Manage custom packs',
    nameTooLongTitle: 'Name too long',
    nameTooLongMessage: 'Players can use at most 25 characters.',
    tooManyPlayersTitle: 'Too many players',
    tooManyPlayersMessage: 'A maximum of 12 players is supported.',
    noPlayersTitle: 'No players',
    noPlayersMessage: 'Add at least one player.',
    noPackTitle: 'No topic pack',
    noPackMessage: 'Choose at least one topic pack.',
    question: 'Category',
    letter: 'Letter',
    skip: 'Skip',
    firstTo: 'First to {{count}} points wins',
    tapScore: 'Tap to score a point',
    winnerTitle: 'Winner!',
    winnerMessage: '{{name}} wins the round.',
    backToMenu: 'Back to menu',
    leaveGameTitle: 'Leave this round?',
    leaveGameMessage: 'The current scores will be lost.',
    stay: 'Keep playing',
    leave: 'Leave',
    newSet: 'New pack',
    noCustomSets: 'No custom packs yet',
    noCustomSetsBody: 'Create a pack from your own inside jokes.',
    createSet: 'Create first pack',
    delete: 'Delete',
    deleteSetTitle: 'Delete pack?',
    deleteSetMessage: '“{{title}}” will be removed permanently.',
    cancel: 'Cancel',
    setTitle: 'Title',
    setTitlePlaceholder: 'For example: Our inside jokes',
    categories: 'Categories',
    categoriesHint: 'One category per line',
    categoriesPlaceholder: 'Embarrassing typo\nHoliday mishap\nBad movie title',
    saved: 'Saved',
    saving: 'Saving …',
    categoryCount: '{{count}} categories',
    untitledSet: 'Untitled pack',
    language: 'Language',
    german: 'Deutsch',
    english: 'English',
  },
} as const;

export type TranslationKey = keyof typeof translations.de;

type LocalizationValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (
    key: TranslationKey,
    variables?: Record<string, string | number>,
  ) => string;
};

const getDeviceLanguage = (): Language => {
  const locale =
    NativeModules.I18nManager?.localeIdentifier ??
    NativeModules.SettingsManager?.settings?.AppleLocale ??
    NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ??
    'de';
  return String(locale).toLowerCase().startsWith('en') ? 'en' : 'de';
};

const LocalizationContext = React.createContext<LocalizationValue | undefined>(
  undefined,
);

export const LocalizationProvider = ({children}: React.PropsWithChildren) => {
  const [language, setLanguageState] =
    React.useState<Language>(getDeviceLanguage);

  React.useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY).then(saved => {
      if (saved === 'de' || saved === 'en') {
        setLanguageState(saved);
      }
    });
  }, []);

  const setLanguage = React.useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    AsyncStorage.setItem(LANGUAGE_KEY, nextLanguage).catch(error =>
      console.warn('Could not persist language', error),
    );
  }, []);

  const t = React.useCallback(
    (key: TranslationKey, variables: Record<string, string | number> = {}) => {
      let value: string = translations[language][key];
      Object.entries(variables).forEach(([name, replacement]) => {
        value = value.replace(`{{${name}}}`, String(replacement));
      });
      return value;
    },
    [language],
  );

  const value = React.useMemo(
    () => ({language, setLanguage, t}),
    [language, setLanguage, t],
  );

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = React.useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used inside LocalizationProvider');
  }
  return context;
};
