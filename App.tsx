import React from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import StartScreen from './pages/screens/StartScreen';
import GameScreen from './pages/screens/GameScreen';
import CustomsetScreen from './pages/screens/CustomsetScreen';
import EditPage from './pages/screens/EditPage';
import {
  Language,
  LocalizationProvider,
  useLocalization,
} from './i18n/LocalizationContext';
import {colors} from './constants/theme';

const Stack = createNativeStackNavigator();

const LanguageSwitch = () => {
  const {language, setLanguage} = useLocalization();
  const option = (value: Language) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={value === 'de' ? 'Deutsch' : 'English'}
      onPress={() => setLanguage(value)}
      style={[
        styles.languageOption,
        language === value && styles.languageOptionActive,
      ]}>
      <Text
        style={[
          styles.languageText,
          language === value && styles.languageTextActive,
        ]}>
        {value.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.languageSwitch}>
      {option('de')}
      {option('en')}
    </View>
  );
};

const AppNavigator = () => {
  const {t} = useLocalization();

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <Stack.Navigator
        screenOptions={{
          headerStyle: {backgroundColor: colors.background},
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerTitleStyle: {fontSize: 19, fontWeight: '700'},
          contentStyle: {backgroundColor: colors.background},
        }}>
        <Stack.Screen
          name="Home"
          component={StartScreen}
          options={{
            title: t('appName'),
            headerRight: LanguageSwitch,
          }}
        />
        <Stack.Screen
          name="Game"
          component={GameScreen}
          options={{headerShown: false, orientation: 'landscape'}}
        />
        <Stack.Screen
          name="CustomSets"
          component={CustomsetScreen}
          options={{title: t('customSets')}}
        />
        <Stack.Screen
          name="EditSet"
          component={EditPage}
          options={{title: t('editSet')}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = (): JSX.Element => (
  <LocalizationProvider>
    <AppNavigator />
  </LocalizationProvider>
);

const styles = StyleSheet.create({
  languageSwitch: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  languageOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },
  languageOptionActive: {
    backgroundColor: colors.primary,
  },
  languageText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  languageTextActive: {
    color: colors.white,
  },
});

export default App;
