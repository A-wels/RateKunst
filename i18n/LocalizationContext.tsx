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
    tutorialAnswerTitle: 'Frage und Buchstabe',
    tutorialAnswerBody:
      'Nach dem Countdown erscheint eine Frage mit einem Buchstaben. Nennt möglichst schnell eine passende Antwort, die damit beginnt. Stehen mehrere Buchstaben zur Auswahl, genügt einer davon.',
    tutorialQuestion: 'Tier',
    tutorialExample:
      'Zum Beispiel: Bär. Bei „SCH / Q“ passen Antworten mit SCH oder Q am Anfang.',
    tutorialScoreTitle: 'Punkte vergeben',
    tutorialScoreBody:
      'Tippe auf den Namen der Person mit der richtigen Antwort. Sie erhält einen Punkt und die nächste Frage beginnt. Halte ihren Punktestand gedrückt, um einen falsch vergebenen Punkt abzuziehen, auch während des Countdowns. Der Punktestand bleibt mindestens null. Mit „Überspringen“ gibt es eine neue Frage ohne Punkt. Wer zuerst die Zielpunktzahl erreicht, gewinnt. Einen versehentlichen Siegpunkt kannst du im Gewinnerdialog mit „Punkt korrigieren“ zurücknehmen.',
    tutorialPacksTitle: 'Eigene Themen und Sprache',
    tutorialPacksBody:
      'Unter „Eigene Sets verwalten“ kannst du Fragen sammeln: eine pro Zeile. Wähle dein Set anschließend bei den Themenpacks aus. DE und EN wechseln die Oberfläche und alle eingebauten Packs. Deine eigenen Texte bleiben so, wie du sie geschrieben hast. Diese Anleitung kannst du im Menü jederzeit erneut öffnen.',

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
    question: 'Frage',
    letter: 'Buchstabe',
    skip: 'Überspringen',
    scoreTarget: 'Ziel: {{count}} Punkte',
    tapScore: 'Tippen: +1 · Gedrückt halten: −1',
    scoreActionsHint:
      'Tippen vergibt einen Punkt. Gedrückt halten zieht einen Punkt ab.',
    removePoint: 'Einen Punkt abziehen',
    correctPoint: 'Punkt korrigieren',
    winnerTitle: 'Gewonnen!',
    winnerMessage: '{{name}} gewinnt die Runde.',
    backToMenu: 'Zurück zum Menü',
    leaveGameTitle: 'Runde verlassen?',
    leaveGameMessage: 'Der aktuelle Punktestand geht verloren.',
    stay: 'Weiterspielen',
    leave: 'Verlassen',
    newSet: 'Neues Set',
    noCustomSets: 'Noch keine eigenen Sets',
    noCustomSetsBody: 'In einem eigenen Set kannst du deine Fragen sammeln.',
    createSet: 'Erstes Set erstellen',
    delete: 'Löschen',
    deleteSetTitle: 'Set löschen?',
    deleteSetMessage: '„{{title}}“ wird dauerhaft entfernt.',
    cancel: 'Abbrechen',
    setTitle: 'Titel',
    setTitlePlaceholder: 'Zum Beispiel: Essen & Trinken',
    questions: 'Fragen',
    questionsHint: 'Eine Frage pro Zeile',
    questionsPlaceholder: 'Fast Food\nDesserts\nGetränke',
    saved: 'Gespeichert',
    saving: 'Speichert …',
    saveFailed: 'Speicherfehler',
    questionCount: '{{count}} Fragen',
    untitledSet: 'Unbenanntes Set',
    adsTitle: 'Werbung & Käufe',
    removeAds: 'Werbung dauerhaft entfernen',
    removeAdsHint:
      'Einmal kaufen: keine Banner und keine Vollbildwerbung. Kein Abo.',
    adsRemoved: 'Werbefrei – dauerhaft freigeschaltet',
    restorePurchases: 'Käufe wiederherstellen',
    restoreComplete: 'Käufe geprüft',
    noPurchaseFound: 'Für dieses Google-Play-Konto wurde kein Kauf gefunden.',
    purchasePending:
      'Zahlung ausstehend. Werbefrei wird nach Abschluss freigeschaltet.',
    storeError:
      'Der Kaufdienst ist momentan nicht verfügbar. Bitte später erneut versuchen.',
    storeUnavailable: 'Kauf momentan nicht verfügbar',
    storeLoading: 'Kaufangebot wird geladen …',
    refreshProducts: 'Kaufangebot erneut laden',
    productUnavailableHint:
      'Google Play stellt das Kaufangebot derzeit nicht bereit. Du kannst es erneut laden. Weitere Angaben stehen in der Werbediagnose.',
    adProductId: 'Produkt-ID',
    adPurchaseOption: 'Kaufoptions-ID',
    adProductError: 'Fehler bei Produktabfrage',
    privacyOptions: 'Datenschutz für Werbung',
    adDiagnostics: 'Werbediagnose',
    hideAdDiagnostics: 'Werbediagnose schließen',
    retryAds: 'Werbung erneut laden',
    adDiagnosticsHint:
      'Falls Werbung fehlt: Diese Angaben zeigen, welcher Schritt blockiert ist. Es werden keine Kaufbelege oder persönlichen Kennungen angezeigt.',
    adVersion: 'App-Version',
    adOwnership: 'Kaufprüfung abgeschlossen',
    adRequestsAllowed: 'Anzeigenanfragen freigegeben',
    adConsentStatus: 'Consent-Status',
    adConsentForm: 'Consent-Formular verfügbar',
    adAgeProtection: 'Konservativer Jugendschutz',
    adRating: 'Werbeinhaltsgrenze',
    adBanner: 'Banner',
    adInterstitial: 'Vollbildanzeige',
    adBannerSize: 'Bannergröße',
    adBannerId: 'Banner-Block-ID',
    adInterstitialId: 'Vollbild-Block-ID',
    adInterstitialShowError: 'Vollbild-Anzeigefehler',
    adInterstitialSkipReason: 'Vollbildanzeige übersprungen',
    adBillingError: 'Fehler bei Kaufprüfung',
    adConsentError: 'Consent-Fehler',
    adBannerError: 'Banner-Ladefehler',
    adInterstitialError: 'Vollbild-Ladefehler',
    adYes: 'Ja',
    adNo: 'Nein',
    adStateIdle: 'Noch nicht angefordert',
    adStateLoading: 'Wird geladen',
    adStateLoaded: 'Geladen',
    adStateFailed: 'Laden fehlgeschlagen',
    adConsentUnknown: 'Noch nicht geprüft',
    adConsentNotRequired: 'Nicht erforderlich',
    adConsentRequired: 'Entscheidung erforderlich',
    adConsentObtained: 'Entscheidung gespeichert',
    adConsentChecking: 'Wird geprüft',
    adAgeTitle: 'Altersgruppe für Werbung',
    adAgeHint:
      'Wähle die Altersgruppe der Person, die dieses Gerät nutzt. Gespeichert wird nur die Altersgruppe, kein Geburtsdatum. Sie steuert den Jugendschutz bei Werbung. Ohne Auswahl gibt es nur Werbung der Kategorie G, geeignet für alle Altersgruppen.',
    ageUnder16: 'Unter 16',
    ageTeen: '16–17',
    ageAdult: '18 oder älter',
    later: 'Später',
    settings: 'Einstellungen',
    appearance: 'Darstellung',
    themeSystem: 'System',
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    themeSystemHint: 'Passt sich automatisch dem Gerätedesign an.',
    themeLightHint: 'Helle Oberflächen mit warmen Akzenten.',
    themeDarkHint: 'Dunkle Oberflächen mit warmen Akzenten.',
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
    tutorialAnswerTitle: 'Question and letter',
    tutorialAnswerBody:
      'After the countdown, a question and letter appear. Be the first to name a matching answer that starts with that letter. When several letters are shown, any one of them is allowed.',
    tutorialQuestion: 'Animal',
    tutorialExample:
      'For example: Bear. For “X / Y / Z”, your answer can start with X, Y or Z.',
    tutorialScoreTitle: 'Award points',
    tutorialScoreBody:
      'Tap the name of the player with the correct answer. They earn one point and the next question begins. Hold their score to remove an incorrectly awarded point, even during the countdown. Scores never go below zero. “Skip” starts a new question without awarding a point. The first player to reach the target score wins. Undo an accidental winning point with “Correct point” in the winner dialog.',
    tutorialPacksTitle: 'Your own topics and language',
    tutorialPacksBody:
      'Use “Manage custom packs” to collect questions: one per line. Then select your pack in the topic picker. DE and EN switch the interface and all built-in packs. Your own text stays as you wrote it. You can reopen this guide from the menu at any time.',

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
    question: 'Question',
    letter: 'Letter',
    skip: 'Skip',
    scoreTarget: 'Target: {{count}} points',
    tapScore: 'Tap: +1 · Hold: −1',
    scoreActionsHint: 'Tap to award a point. Hold to remove a point.',
    removePoint: 'Remove one point',
    correctPoint: 'Correct point',
    winnerTitle: 'Winner!',
    winnerMessage: '{{name}} wins the round.',
    backToMenu: 'Back to menu',
    leaveGameTitle: 'Leave this round?',
    leaveGameMessage: 'The current scores will be lost.',
    stay: 'Keep playing',
    leave: 'Leave',
    newSet: 'New pack',
    noCustomSets: 'No custom packs yet',
    noCustomSetsBody: 'Create a pack to collect your own questions.',
    createSet: 'Create first pack',
    delete: 'Delete',
    deleteSetTitle: 'Delete pack?',
    deleteSetMessage: '“{{title}}” will be removed permanently.',
    cancel: 'Cancel',
    setTitle: 'Title',
    setTitlePlaceholder: 'For example: Food & Drink',
    questions: 'Questions',
    questionsHint: 'One question per line',
    questionsPlaceholder: 'Fast Food\nDesserts\nBeverages',
    saved: 'Saved',
    saving: 'Saving …',
    saveFailed: 'Storage error',
    questionCount: '{{count}} questions',
    untitledSet: 'Untitled pack',
    adsTitle: 'Ads & purchases',
    removeAds: 'Remove ads permanently',
    removeAdsHint:
      'Buy once: no banners and no full-screen ads. No subscription.',
    adsRemoved: 'Ad-free – permanently unlocked',
    restorePurchases: 'Restore purchases',
    restoreComplete: 'Purchases checked',
    noPurchaseFound: 'No purchase was found for this Google Play account.',
    purchasePending:
      'Payment is pending. Ad-free unlocks when payment completes.',
    storeError: 'The purchase service is unavailable. Please try again later.',
    storeUnavailable: 'Purchase currently unavailable',
    storeLoading: 'Loading purchase offer …',
    refreshProducts: 'Reload purchase offer',
    productUnavailableHint:
      'Google Play is not providing the purchase offer right now. You can reload it. More details are available in Ad diagnostics.',
    adProductId: 'Product ID',
    adPurchaseOption: 'Purchase option ID',
    adProductError: 'Product query error',
    privacyOptions: 'Ad privacy settings',
    adDiagnostics: 'Ad diagnostics',
    hideAdDiagnostics: 'Close ad diagnostics',
    retryAds: 'Retry loading ads',
    adDiagnosticsHint:
      'If ads are missing, these details show which step is blocked. No purchase receipts or personal identifiers are displayed.',
    adVersion: 'App version',
    adOwnership: 'Purchase check completed',
    adRequestsAllowed: 'Ad requests allowed',
    adConsentStatus: 'Consent status',
    adConsentForm: 'Consent form available',
    adAgeProtection: 'Conservative age protection',
    adRating: 'Ad content limit',
    adBanner: 'Banner',
    adInterstitial: 'Interstitial',
    adBannerSize: 'Banner size',
    adBannerId: 'Banner ad unit ID',
    adInterstitialId: 'Interstitial ad unit ID',
    adInterstitialShowError: 'Interstitial display error',
    adInterstitialSkipReason: 'Interstitial skipped',
    adBillingError: 'Purchase check error',
    adConsentError: 'Consent error',
    adBannerError: 'Banner load error',
    adInterstitialError: 'Interstitial load error',
    adYes: 'Yes',
    adNo: 'No',
    adStateIdle: 'Not requested yet',
    adStateLoading: 'Loading',
    adStateLoaded: 'Loaded',
    adStateFailed: 'Failed to load',
    adConsentUnknown: 'Not checked yet',
    adConsentNotRequired: 'Not required',
    adConsentRequired: 'Decision required',
    adConsentObtained: 'Decision saved',
    adConsentChecking: 'Checking',
    adAgeTitle: 'Age group for ads',
    adAgeHint:
      'Choose the age group of the person using this device. Only the age group is saved, not a date of birth. It controls age protections for ads. Without a selection, only G-rated ads suitable for all ages are shown.',
    ageUnder16: 'Under 16',
    ageTeen: '16–17',
    ageAdult: '18 or older',
    later: 'Later',
    settings: 'Settings',
    appearance: 'Appearance',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystemHint: 'Automatically follows your device appearance.',
    themeLightHint: 'Light surfaces with warm accents.',
    themeDarkHint: 'Dark surfaces with warm accents.',
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
