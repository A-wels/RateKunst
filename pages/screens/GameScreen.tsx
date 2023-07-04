// Placeholder screen for the game

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import letters from '../../constants/letters';
import { questionSet } from '../../constants/questions';

const GameScreen = ({ navigation, route }) => {
    // players in rote.params.names
    // keep track of player scores

    const [playerScores, setPlayerScores] = React.useState({});
    const [question, setQuestion] = React.useState('');
    const [letter, setLetter] = React.useState('');

    React.useEffect(() => {
        // initialize player scores
        const scores = {};
        route.params.names.forEach((name) => {
            scores[name] = 0;
        });
        setPlayerScores(scores);

        // load first question
        loadNextQuestion();
    }, []);

    // increment score for player
    const incrementScore = (name) => {
        const updatedScores = { ...playerScores };
        updatedScores[name] += 1;
        setPlayerScores(updatedScores);
        if (updatedScores[name] == 10) {
            // Display alert and Navigate back to StartScreen on dismiss
            Alert.alert(
                'Gewonnen!',
                `${name} hat gewonnen!`,
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('Startmenü'),
                    },
                ],
                { cancelable: false }
            );
        }else {
            loadNextQuestion();
        }
    };

    // load next question. For now: Random words
    const loadNextQuestion = () => {
        const questions = questionSet[route.params.setID].questions;
        const indexQuestion = Math.floor(Math.random() * questions.length);
        const indexLetters = Math.floor(Math.random() * letters.length);
        setQuestion(questions[indexQuestion]);
        setLetter(letters[indexLetters]);
    };



    return (
        <SafeAreaView style={[styles.container]}>
            <Text style={styles.title}>Ratepfosten: {questionSet[route.params.setID].title}</Text>

            <View style={styles.gamefield}>
                <View style={styles.questionBox}>
                    <Text style={styles.smallTitle}> Frage</Text>
                    <View style={styles.textField}>
                        <Text style={styles.text}> {question}</Text>
                    </View>
                </View>
                <View style={styles.letterBox}>
                    <Text style={styles.smallTitle}> Buchstabe</Text>
                    <View style={styles.textField}>
                        <Text style={styles.text}> {letter}</Text>
                    </View>
                </View>
            </View>
            {/* Bottom row with player names, score and skip button */}
            <View style={styles.row}>
                {route.params.names.map((name, index) => (
                    <TouchableOpacity key={index} style={styles.box} onPress={() => incrementScore(name)}>
                        <Text style={styles.text}>{name}</Text>
                        <Text style={styles.score}>{playerScores[name]}</Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.boxSkip} onPress={() => loadNextQuestion()}>
                    <Text style={styles.text}>Überspringen</Text>
                </TouchableOpacity>
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
        fontSize: 42,
        fontWeight: 'bold',
        color: 'white'
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    gamefield: {
        flex: 1, // Take up remaining space
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 50,
    },
    box: {
        width: 150,
        padding: 5,
        backgroundColor: 'lightgreen',
        borderRadius: 8,
        marginHorizontal: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    boxSkip: {
        width: 150,
        padding: 5,
        backgroundColor: 'tomato',
        borderRadius: 8,
        marginHorizontal: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#1f1f23',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    score: {
        color: '#1f1f23',
        fontSize: 24,
        fontWeight: 'bold',
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
    questionBox: {
        color: '#1f1f23',
        width: 600,
        height: 150,
        backgroundColor: 'lightgreen',
        borderRadius: 8,
        marginHorizontal: 5,
    },
    letterBox: {
        color: '#1f1f23',
        fontSize: 24,
        fontWeight: 'bold',
        width: 200,
        height: 150,
        backgroundColor: 'lightgreen',
        borderRadius: 8,
        marginHorizontal: 5,
    },

});

export default GameScreen;