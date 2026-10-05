import React from 'react';
import {StatusBar, StyleSheet, Text, Pressable, View} from 'react-native';
import {DefaultTheme, NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
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

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    primary: colors.primary,
    border: colors.border,
  },
};

const Stack = createNativeStackNavigator();

const LanguageSwitch = () => {
  const {language, setLanguage} = useLocalization();
  const option = (value: Language) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value === 'de' ? 'Deutsch' : 'English'}
      accessibilityState={{selected: language === value}}
      android_ripple={{color: colors.border}}
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
    </Pressable>
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
    <NavigationContainer theme={navigationTheme}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.header} />
      <Stack.Navigator
        screenOptions={{
          headerStyle: {backgroundColor: colors.header},
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerTitleStyle: {fontSize: 20, fontWeight: '500'},
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
  <SafeAreaProvider>
    <LocalizationProvider>
      <AppNavigator />
    </LocalizationProvider>
  </SafeAreaProvider>
);

const styles = StyleSheet.create({
  languageSwitch: {flexDirection: 'row'},
  languageOption: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  languageOptionActive: {borderBottomColor: colors.headerAccent},
  languageText: {color: colors.headerMuted, fontSize: 14},
  languageTextActive: {color: colors.text, fontWeight: '500'},
});

export default App;
