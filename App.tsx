/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import type { PropsWithChildren } from 'react';
import {
  Alert,
  Button,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import StartScreen from './pages/screens/StartScreen';
import GameScreen from './pages/screens/GameScreen';
import AntDesign from 'react-native-vector-icons/AntDesign';
import CustomsetScreen from './pages/screens/CustomsetScreen';
import EditPage from './pages/screens/EditPage';


const Stack = createNativeStackNavigator();
function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const navBarStyle = {
    backgroundColor: isDarkMode ? '#1f1f23' : '#fafafa',
  };
  return (
    <NavigationContainer>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={navBarStyle.backgroundColor}
      />
      <Stack.Navigator>
        <Stack.Screen
          name="Startmenü"
          component={StartScreen}
          options= {{ 
            headerTintColor: 'white',
            headerTitleStyle: { fontSize: 24, fontWeight: 'bold' },
            headerStyle: { backgroundColor: 'tomato' },
            headerRight: () => (
              <TouchableOpacity>
              <AntDesign name="edit" size={24} color="black" />
            </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen name="RateDepp"
          component={GameScreen}
          options = {{
          headerShown: false,
          orientation: 'landscape'
            
          }}
          />
          <Stack.Screen name="Eigene Sets"
          component={CustomsetScreen}
          options = {{
            headerTintColor: 'white',
            headerTitleStyle: { fontSize: 24, fontWeight: 'bold' },
            headerStyle: { backgroundColor: 'tomato' },
          }}
          />
          <Stack.Screen name="Set Bearbeiten"
          component={EditPage}
          options = {{
            headerTintColor: 'white',
            headerTitleStyle: { fontSize: 24, fontWeight: 'bold' },
            headerStyle: { backgroundColor: 'tomato' },
          }}
          />
      </Stack.Navigator>
    </NavigationContainer>
  );
}



const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  backgroundStyle: {
    backgroundColor: '#1f1f23',
  },

});

export default App;
