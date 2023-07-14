import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { questionSet as initialQuestions } from '../../constants/questions';
import { Picker } from '@react-native-picker/picker';
import getQuestions from '../../utils/questionloader';

const StartScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [names, setNames] = useState([]);
  const [setID, setSetID] = useState(0);
  const [questionsSets, setQuestionsSets] = useState(initialQuestions);

  useEffect(() => {
    // Load the saved names when the component mounts
    loadNames();
  }, []);

  // Load the question set specified in route.params.id. First use the sets from constants/questions.ts, then use the custom sets from AsyncStorage
  useEffect(() => {
    // copy the initial set from constants/questions.ts
    const unsubscribe = navigation.addListener('focus', () => {

      const getCustomSet = async () => {

        setQuestionsSets(await getQuestions());
      }
      getCustomSet();
    });
  }, []);


  useEffect(() => {
    // set navigation header button
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Eigene Sets')}
        >
          <AntDesign name="edit" size={24} color="black" />
        </TouchableOpacity>
      ),
    });

  }, [navigation]);

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
    } else {
      console.log(" " + names + " " + setID)
      navigation.navigate('RateKunst', { names: names, setID: setID });
    }
  }

  const handleRemoveName = (index: number) => {
    const updatedNames = [...names];
    updatedNames.splice(index, 1);
    setNames(updatedNames);
  };

  return (

    <View style={[styles.container]}>

      { /* Picker for question set */}
      <Text style={styles.title}>Frageset</Text>
      <Picker
        style={styles.picker}
        selectedValue={setID}
        onValueChange={(itemValue, itemIndex) =>
          setSetID(itemValue)
        }>
        {questionsSets.map((item, index) => (
          <Picker.Item key={index} label={item.title} value={index} />
        ))
        }
      </Picker>

      { /* List of names */}
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

      {/* Button to start the game */}
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
    color: 'white',

  },
  names: {
    fontSize: 18,
    marginBottom: 8,
    color: 'white',
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
    borderColor: 'white',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    backgroundColor: 'white',
    color: 'black',
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
  picker: {
    marginBottom: 10,
    color: 'white',
  }
});

export default StartScreen;
