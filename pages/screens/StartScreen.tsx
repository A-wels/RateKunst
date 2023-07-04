import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StartScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [names, setNames] = useState([]);

  useEffect(() => {
    // Load the saved names when the component mounts
    loadNames();
  }, []);

  useEffect(() => {
    // Save the names whenever the names state changes
    saveNames();
  }, [names]);
  const loadNames = async () => {
    try {
      const savedNames = await AsyncStorage.getItem('names');
      if (savedNames !== null) {
        setNames(JSON.parse(savedNames));
      }
    } catch (error) {
      console.log('Error loading names:', error);
    }
  };

  const saveNames = async () => {
    try {
      const namesToSave = JSON.stringify(names);
      await AsyncStorage.setItem('names', namesToSave);
    } catch (error) {
      console.log('Error saving names:', error);
    }
  };

  const handleAddName = () => {
    if (name.trim() !== '') {
      if (names.length < 4) {
        setNames([...names, name]);
        setName('');
      } else {
        Alert.alert('Zu viele Spieler', 'Maximal 5 Namen möglich!');
      }

    }
  };

  const handleStartButton = () => {
    if (names.length == 0) {
      Alert.alert('Keine Spieler', 'Bitte mindestens einen Namen eingeben!');
    }
    navigation.navigate('Ratepfosten', { names: names });
  }

  const handleRemoveName = (index: number) => {
    const updatedNames = [...names];
    updatedNames.splice(index, 1);
    setNames(updatedNames);
  };

  return (
    <View style={[styles.container]}>
      <Text style={styles.title}>Namen</Text>
      <FlatList
        data={names}
        renderItem={({ item, index }) => (
          <View style={styles.nameContainer}>
            <Text style={styles.names}>{item}</Text>
            <TouchableOpacity onPress={() => handleRemoveName(index)}>
              <AntDesign name="delete" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Name eingeben"
          value={name}
          onChangeText={(text) => setName(text)}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddName}>
          <AntDesign name="plussquareo" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.startButton} onPress={() => handleStartButton()}>
        <Text style={styles.startButtonText}>Start</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    // dark gray background
    backgroundColor: '#1f1f23'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  names: {
    fontSize: 18,
    marginBottom: 8,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: 'cadetblue',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: 'tomato',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default StartScreen;
