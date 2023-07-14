// Placeholder screen for the game

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CustomsetScreen = ({ navigation, route }) => {
    const [customSets, setCustomSets] = React.useState([]);
    const [customSetIDs, setCustomSetIDs] = React.useState('');


    // log customSet and customSetTitle on change
    React.useEffect(() => {
        console.log("Custom sets changed: " + customSets);
    }, [customSets]);
    React.useEffect(() => {
        console.log("Custom set ids changed: " + customSetIDs);
    }
        , [customSetIDs]);

    // clear local storage on mount
    React.useEffect(() => {
        if (false){
        // clear local storage
        const clearData = async () => {
            try {
                await AsyncStorage.clear();
            } catch (e) {
                console.log("Error while clearing local storage: " + e);
            }
        }
        clearData();
    }
    }, []);

    // when customSetIDs changes, load custom sets from local storage
    React.useEffect(() => {
        // load custom sets from local storage
        const getData = async () => {
            try {
                setCustomSets([]);
                customSetIDs.forEach(async (id) => {
                    console.log("Loading set with id: " + id)
                    const value = await AsyncStorage.getItem(id);
                    if (value !== null) {
                        // value previously stored
                        // first line is title
                        const title = JSON.parse(value)[0];
                        // add to customSets
                        setCustomSets(customSets => [...customSets, { id: id, title: title }]);
                    }
                });
            } catch (e) {
                console.log("Error while loading custom sets: " + e);
            }
        }
        getData();
    }, [customSetIDs]);

    React.useEffect(() => {
        // load custom sets on mount from local storage. Also reload when page is focused
        const unsubscribe = navigation.addListener('focus', () => {
            const getData = async () => {
                try {
                    const jsonValue = await AsyncStorage.getItem('@customSets');
                    const data = jsonValue != null ? JSON.parse(jsonValue) : [];
                    console.log("Loaded custom set ids: " + data);
                    setCustomSetIDs(data);
                } catch (e) {
                    console.log("Error while loading custom sets: " + e);
                }
            }
            getData();
        }
        );

    }, []);

    const editSet = (id) => {
        // navigate to edit set screen
        console.log(id);
        navigation.navigate('Set Bearbeiten', { id: id, });
    }

    const addCustomSetButton = () => (
        <View style={styles.item}>
            <View style={styles.row}>
                <TouchableOpacity style={styles.button} onPress={() => { navigation.navigate('Set Bearbeiten', { id: 0, }) }}>
                    <AntDesign name="plus" size={32} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const Item = ({ title, id }) => (        
        <View style={styles.item}>
            <View style={styles.row}>
                <TouchableOpacity style={styles.button} onPress={() => { editSet(id) }}>
                    <AntDesign name="edit" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.title}>{title}</Text>
                <TouchableOpacity style={styles.button} onPress={() => { alertDeleteSet(title, id) }}>
                    <AntDesign name="delete" size={24} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const deleteCustomSet = (id) => {
        // delete custom set from database
        console.log(id);
        // remove from customSets
        setCustomSets(customSets.filter(item => item.id !== id));
        // remove from customSetIDs
        setCustomSetIDs(customSetIDs.filter(item => item !== id));
        // remove question set from local storage
        const removeValue = async () => {
            try {
                await AsyncStorage.removeItem(id);
            } catch (e) {
                console.log("Error while deleting custom set: " + e);
            }
        }
        removeValue();
        // remove id from @customSets list in local storage
        const removeID = async () => {
            try {
                const jsonValue = await AsyncStorage.getItem('@customSets');
                const data = jsonValue != null ? JSON.parse(jsonValue) : [];
                const newData = data.filter(item => item !== id);
                await AsyncStorage.setItem('@customSets', JSON.stringify(newData));
            } catch (e) {
                console.log("Error while deleting custom set: " + e);
            }
        }
        removeID();
    }
    const alertDeleteSet = (title, id) => {
        // delete custom set from database after confirmation
        Alert.alert(
            'Löschen',
            `Möchtest du das Set: ${title} wirklich löschen?`,
            [
                {
                    text: 'Abbrechen',
                    style: 'cancel'
                },
                {
                    text: 'Löschen', onPress: () => {
                        // delete set from database
                        deleteCustomSet(id);
                    }
                }
            ],
            { cancelable: false }
        );
    }

    console.log("Custom sets before render: " + customSets);
    return (
        <SafeAreaView style={[styles.container]}>
            {/* FlatList of custom sets. Last item is a button to add a new set */}
            {/* Show Flatlist only if customSets is not empty, otherwise show Button to add set */}
            {customSets.length > 0 &&
                <FlatList
                    data={customSets}
                    renderItem={({ item }) => <Item key={item.id} title={item.title} id={item.id} />}
                    keyExtractor={item => item.id}
                    ListFooterComponent={addCustomSetButton}
                />}
            {customSets.length < 1 &&
                <View style={styles.item}>
                    <View style={styles.row}>
                        <TouchableOpacity style={styles.button} onPress={() => { navigation.navigate('Set Bearbeiten', { id: 0, }) }}>
                            <AntDesign name="plus" size={32} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>}




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
        color: '#1f1f23',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    textField: {
        flex: 0.75,
        alignItems: 'center',
        justifyContent: 'center',
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

export default CustomsetScreen;