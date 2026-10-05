import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import {NativeModules} from 'react-native';

export type Language = 'de' | 'en';

const LANGUAGE_KEY = '@ratekunst/language';

const translations = {
  de: {
    appName: 'RateKunst',
    tutorial: 'Spielanleitung',
    skipTutorial: 'Überspringen',
    tutorialStep: '{{current}} von {{total}}',
    previous: 'Zurück',
    next: 'Weiter',
    finishTutorial: 'Los geht’s',
    tutorialSetupTitle: 'Eine Runde vorbereiten',
    tutorialSetupBody:
      'Füge die Mitspieler hinzu, wähle mindestens ein Themenpack und lege fest, wie viele Punkte zum Gewinnen nötig sind. Mit „Runde starten“ beginnt das Spiel.',
    tutorialAnswerTitle: 'Kategorie und Buchstabe',
    tutorialAnswerBody:
      'Nach dem Countdown erscheint eine Kategorie mit einem Buchstaben. Nennt möglichst schnell eine passende Antwort, die damit beginnt. Stehen mehrere Buchstaben zur Auswahl, genügt einer davon.',
    tutorialCategory: 'Tier',
    tutorialExample:
      'Zum Beispiel: Bär. Bei „SCH / Q“ passen Antworten mit SCH oder Q am Anfang.',
    tutorialScoreTitle: 'Punkte vergeben',
    tutorialScoreBody:
      'Tippe auf den Namen der Person mit der richtigen Antwort. Sie erhält einen Punkt und die nächste Frage beginnt. Mit „Überspringen“ gibt es eine neue Frage ohne Punkt. Wer zuerst die Zielpunktzahl erreicht, gewinnt.',
    tutorialPacksTitle: 'Eigene Themen und Sprache',
    tutorialPacksBody:
      'Unter „Eigene Sets verwalten“ kannst du Kategorien sammeln: eine pro Zeile. Wähle dein Set anschließend bei den Themenpacks aus. DE und EN wechseln die Oberfläche und alle eingebauten Packs. Deine eigenen Texte bleiben so, wie du sie geschrieben hast. Diese Anleitung kannst du im Menü jederzeit erneut öffnen.',

    startMenu: 'Spiel vorbereiten',
    customSets: 'Eigene Sets',
    editSet: 'Set bearbeiten',
    packs: 'Themenpacks',
    choosePacks: 'Themenpacks auswählen',
    search: 'Packs durchsuchen …',
    selectedCount: '{{count}} ausgewählt',
    players: 'Spieler',
    playerName: 'Name eingeben',
    addPlayer: 'Spieler hinzufügen',
    noPlayers: 'Füge die Mitspieler hinzu.',
    add: 'Hinzufügen',
    remove: 'Entfernen',
    edit: 'Bearbeiten',
    done: 'Fertig',
    select: 'Auswählen',
    selected: 'Ausgewählt',
    noPacksSelected: 'Noch keine Themen ausgewählt.',
    noMatchingPacks: 'Keine passenden Themenpacks.',
    playerScore: '{{name}}, {{score}} von {{target}} Punkten',
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
    scoreTarget: 'Ziel: {{count}} Punkte',
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
    noCustomSetsBody:
      'In einem eigenen Set kannst du deine Kategorien sammeln.',
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
    saveFailed: 'Speicherfehler',
    categoryCount: '{{count}} Kategorien',
    untitledSet: 'Unbenanntes Set',
    language: 'Sprache',
    german: 'Deutsch',
    english: 'English',
  },
  en: {
    appName: 'RateKunst',
    tutorial: 'How to play',
    skipTutorial: 'Skip',
    tutorialStep: '{{current}} of {{total}}',
    previous: 'Back',
    next: 'Next',
    finishTutorial: 'Start playing',
    tutorialSetupTitle: 'Prepare a round',
    tutorialSetupBody:
      'Add the players, choose at least one topic pack and set the number of points needed to win. Tap “Start round” to begin.',
    tutorialAnswerTitle: 'Category and letter',
    tutorialAnswerBody:
      'After the countdown, a category and letter appear. Be the first to name a matching answer that starts with that letter. When several letters are shown, any one of them is allowed.',
    tutorialCategory: 'Animal',
    tutorialExample:
      'For example: Bear. For “X / Y / Z”, your answer can start with X, Y or Z.',
    tutorialScoreTitle: 'Award points',
    tutorialScoreBody:
      'Tap the name of the player with the correct answer. They earn one point and the next question begins. “Skip” starts a new question without awarding a point. The first player to reach the target score wins.',
    tutorialPacksTitle: 'Your own topics and language',
    tutorialPacksBody:
      'Use “Manage custom packs” to collect categories: one per line. Then select your pack in the topic picker. DE and EN switch the interface and all built-in packs. Your own text stays as you wrote it. You can reopen this guide from the menu at any time.',

    startMenu: 'Set up game',
    customSets: 'Custom packs',
    editSet: 'Edit pack',
    packs: 'Topic packs',
    choosePacks: 'Choose topic packs',
    search: 'Search packs …',
    selectedCount: '{{count}} selected',
    players: 'Players',
    playerName: 'Enter a name',
    addPlayer: 'Add player',
    noPlayers: 'Add the people playing.',
    add: 'Add',
    remove: 'Remove',
    edit: 'Edit',
    done: 'Done',
    select: 'Select',
    selected: 'Selected',
    noPacksSelected: 'No topics selected yet.',
    noMatchingPacks: 'No matching topic packs.',
    playerScore: '{{name}}, {{score}} of {{target}} points',
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
    scoreTarget: 'Target: {{count}} points',
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
    noCustomSetsBody: 'Create a pack to collect your own categories.',
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
    saveFailed: 'Storage error',
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
  const languageChosen = React.useRef(false);

  React.useEffect(() => {
    let active = true;
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then(saved => {
        if (
          active &&
          !languageChosen.current &&
          (saved === 'de' || saved === 'en')
        ) {
          setLanguageState(saved);
        }
      })
      .catch(error => console.warn('Could not load language', error));
    return () => {
      active = false;
    };
  }, []);

  const setLanguage = React.useCallback((nextLanguage: Language) => {
    languageChosen.current = true;
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
