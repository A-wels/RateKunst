// Placeholder screen for the game

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import letters from '../../constants/letters';
import { questionSet } from '../../constants/questions';
import AntDesign from 'react-native-vector-icons/AntDesign';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EditPage = ({ navigation, route }) => {

    const [customSet, setCustomSet] = React.useState([{}]);
    const [customSetTitle, setCustomSetTitle] = React.useState('');
    const [setID, setSetID] = React.useState('');

    // load custom set on mount
    React.useEffect(() => {
        // load custom set specified in route.params.id
        const getCustomSet = () => {
            const id = route.params.id;

            // check if id is 0: New set
            if (id === 0) {
                // generate new id based on current time
                const id = Date.now().toString();
                setSetID(id);
                setCustomSet(['']);
                return;
            }

            setSetID(id);

            // get custom set from local storage
            const getData = async () => {
                try {
                    const value = await AsyncStorage.getItem(id);
                    if (value !== null) {
                        // value previously stored
                        // first line is title
                        setCustomSetTitle(JSON.parse(value)[0]);
                        // rest is set
                        setCustomSet(JSON.parse(value).slice(1));

                    }
                } catch (e) {
                    console.log(e);
                }
            }
            getData();

        }
        getCustomSet();
    }, []);


    React.useEffect(() => {
        // Remove whitespace at start and end of each line and remove empty lines

        const trimmedSet = customSet
            .map((line) => {
                if (typeof line === 'string') {
                    return line.trim();
                }
                return line;
            })
            .filter((line) => typeof line === 'string' && line.length > 0);

        let trimmedTitle = customSetTitle.trim();
        if (trimmedTitle.length === 0) {
            trimmedTitle = "Unbenanntes Set";
        }

        // save custom set to local storage
        // check if set is empty
        if (trimmedSet.length === 0) {
            // do not save
            return;
        }

        // add title as first line
        trimmedSet.unshift(trimmedTitle);
        const saveSet = async () => {

        try {
           
            await AsyncStorage.setItem(
                setID,
                JSON.stringify(trimmedSet)
            );
        } catch (error) {
            console.log(error);
        }
    }
        saveSet();
        // add id to list of sets if it is not already there
        const getData = async () => {
            try {
                const value = await AsyncStorage.getItem('@customSets');
                console.log("@customSets: " + value)
                if (value !== null) {
                    // value previously stored
                    // check if set is already in list
                    const sets = JSON.parse(value);

                    if (!sets.includes(setID)) {
                        // add set to list
                        sets.push(setID);
                        await AsyncStorage.setItem(
                            '@customSets',
                            JSON.stringify(sets)
                        );
                    }
                }
                else {
                    // create new list
                    const sets = [setID];
                    await AsyncStorage.setItem(
                        '@customSets',
                        JSON.stringify(sets)
                    );
                }
            } catch (e) {
                console.log(e);
            }
        }
        getData();

    }, [customSet, customSetTitle]);


    const onChangeText = (text) => {
        // split text into lines
        const lines = text.split('\n');

        // update custom set
        setCustomSet(lines);
    }
    const onChangeTextTitle = (text) => {
        // update custom title
        setCustomSetTitle(text);
    }

    return (
        <SafeAreaView style={[styles.container]}>
            <View style={styles.textFieldTitle}>
                <TextInput
                    style={styles.text}
                    placeholder="Titel des Sets "
                    placeholderTextColor='#a9a9a9'
                    onChangeText={text => onChangeTextTitle(text)}
                    value={customSetTitle}>
                </TextInput>
            </View>
            {/* Multiline textinput, each question on one line */}
            <View style={styles.textField}>
                <TextInput
                    placeholder='Eine Kategorie pro Zeile. Änderungen werden automatisch gespeichert. '
                    placeholderTextColor='#a9a9a9'
                    style={styles.text}
                    multiline={true}
                    numberOfLines={10}
                    onChangeText={text => onChangeText(text)}
                    value={customSet.join('\n')}>

                </TextInput>
            </View>



        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1f1f23',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white'
    },
    button: {
        backgroundColor: '#1f1f23',
        borderRadius: 10,
        padding: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    item: {
    },

    text: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'left',
    },
    textField: {
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'center',
        borderColor: 'white',
        borderWidth: 2,
        borderRadius: 10,
        margin: 10,
        padding: 10,
        paddingLeft: 20,
        width: '90%',
    },
    textFieldTitle: {
        flex: 0.1,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: 'white',
        borderWidth: 2,
        borderRadius: 10,
        margin: 10,
        padding: 5,
        width: '90%',
    },
    letter: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    smallTitle: {
        color: '#1f1f23',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'left'
    },

});

export default EditPage;