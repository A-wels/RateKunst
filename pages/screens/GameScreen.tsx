// Placeholder screen for the game

import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import letters from '../../constants/letters';
import {questionSet as initialSet} from '../../constants/questions';
import {getQuestions} from '../../utils/questionloader';

const GameScreen = ({navigation, route}) => {
  // players in rote.params.names
  // keep track of player scores
  const [firstLoad, setFirstLoad] = React.useState(true);

  const [playerScores, setPlayerScores] = React.useState({});
  // State that has a boolean for each player, indicating if their score has increased
  const [hasPlayerScoreIncreased, setHasPlayerScoreIncreased] = React.useState(
    {},
  );
  const [question, setQuestion] = React.useState('');
  const [questionSet, setQuestionsSets] = React.useState(initialSet);
  const [letter, setLetter] = React.useState('');
  const [canLoadNextQuestion, setCanLoadNextQuestion] = React.useState(true);
  const [lastTwentyQuestions, setLastTwentyQuestions] = React.useState([]);
  const [pointsToWin, setPointsToWin] = React.useState(10);
  const boxWidth = `${90 / route.params.names.length}%`;
  // when questionSet changes, load first question and set title
  React.useEffect(() => {
    if (!firstLoad) {
      loadNextQuestion();
    }
  }, [questionSet]);

  // Load the question set specified in route.params.id. First use the sets from constants/questions.ts, then use the custom sets from AsyncStorage
  React.useEffect(() => {
    // copy the initial set from constants/questions.ts

    const getCustomSet = async () => {
      setQuestionsSets(await getQuestions());
    };
    getCustomSet();
    setFirstLoad(false);
  }, []);

  React.useEffect(() => {
    // initialize player scores
    const scores = {};
    const hasPlayerScoreIncreased = {};
    route.params.names.forEach(name => {
      scores[name] = 0;
      hasPlayerScoreIncreased[name] = false;
    });
    setPlayerScores(scores);
    setPointsToWin(parseInt(route.params.pointsToWin));
  }, []);

  // increment score for player
  const incrementScore = name => {
    const updatedScores = {...playerScores};
    const updatedHasPlayerScoreIncreased = {...hasPlayerScoreIncreased};
    if (updatedHasPlayerScoreIncreased[name]) {
      return;
    }
    updatedScores[name] += 1;
    updatedHasPlayerScoreIncreased[name] = true;
    setPlayerScores(updatedScores);
    setHasPlayerScoreIncreased(updatedHasPlayerScoreIncreased);
    if (updatedScores[name] == pointsToWin) {
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
        {cancelable: false},
      );
    } else {
      loadNextQuestion();
    }
  };

  // load next question. For now: Random words
  async function loadNextQuestion() {
    if (!canLoadNextQuestion) {
      return;
    }
    setCanLoadNextQuestion(false);
    // for all Ids, load the questions
    let questions: string[] = [];

    for (const id of route.params.setID) {
      questions = questions.concat(questionSet[id].questions);
    }

    // temp variable: copy of lastTwentyQuestions
    // Reset last questions if all available questions are already used
    if (lastTwentyQuestions.length == questions.length) {
      setLastTwentyQuestions([]);
    }

    let indexQuestion = Math.floor(Math.random() * questions.length);

    // while an already used question is chosen, choose another one
    while (lastTwentyQuestions.includes(indexQuestion)) {
      indexQuestion = Math.floor(Math.random() * questions.length);
    }
    // When 20 questions are used, remove the oldest one
    if (lastTwentyQuestions.length > 20) {
      // remove the oldest question and add the new one
      const temp = [...lastTwentyQuestions];
      temp.shift();
      temp.push(indexQuestion);
      setLastTwentyQuestions(temp);
    } else {
      // add the chosen question to the list of last questions
      setLastTwentyQuestions([...lastTwentyQuestions, indexQuestion]);
    }

    const indexLetters = Math.floor(Math.random() * letters.length);
    // clear letter field
    setLetter('');
    // count down from 3 in the question field
    setQuestion('3');
    await new Promise(r => setTimeout(r, 750));
    setQuestion('2');
    await new Promise(r => setTimeout(r, 750));
    setQuestion('1');
    await new Promise(r => setTimeout(r, 750));

    // set new question and letter
    setQuestion(questions[indexQuestion]);
    setLetter(letters[indexLetters]);
    setCanLoadNextQuestion(true);
    setHasPlayerScoreIncreased({});
  }

  return (
    <SafeAreaView style={[styles.container]}>
      {/* Show different title when only one point is necessary to win*/}
      {pointsToWin == 1 ? (
        <Text style={styles.title}>
          RateKunst: Sieg mit {pointsToWin} Punkt. WIESO!?
        </Text>
      ) : (
        <Text style={styles.title}>
          RateKunst: Sieg mit {pointsToWin} Punkten
        </Text>
      )}

      <View style={styles.gamefield}>
        <View style={styles.questionBox}>
          <View style={styles.row}>
            <Text style={styles.smallTitle}> Frage</Text>
            <View style={{flex: 1}} />
            <TouchableOpacity
              style={styles.boxSkip}
              onPress={() => loadNextQuestion()}>
              <Text style={styles.text}>Überspringen</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.textField}>
            <Text style={styles.question}> {question}</Text>
          </View>
        </View>
        <View style={styles.letterBox}>
          <Text style={styles.smallTitle}> Buchstabe</Text>
          <View style={styles.textField}>
            <Text style={styles.letter}> {letter}</Text>
          </View>
        </View>
      </View>
      {/* Bottom row with player names, score and skip button */}
      <View style={styles.row}>
        {route.params.names.map((name, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.box, {width: boxWidth}]}
            onPress={() => incrementScore(name)}>
            <Text style={styles.text}>{name}</Text>
            <Text style={styles.score}>{playerScores[name]}</Text>
          </TouchableOpacity>
        ))}
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
    color: 'white',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  gamefield: {
    flex: 1, // Take up remaining space
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 50,
  },
  box: {
    padding: 5,
    backgroundColor: 'lightgreen',
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxSkip: {
    width: 'fit-content',
    padding: 10,
    backgroundColor: 'orange',
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
    fontSize: 32,
    color: '#1f1f23',
    fontWeight: 'bold',
  },
  question: {
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 32,
    color: '#1f1f23',
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 8,
  },
  smallTitle: {
    color: '#1f1f23',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  questionBox: {
    color: '#1f1f23',
    width: '60%',
    height: 150,
    backgroundColor: 'lightgreen',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  letterBox: {
    color: '#1f1f23',
    fontSize: 24,
    fontWeight: 'bold',
    width: '20%',
    height: 150,
    backgroundColor: 'lightgreen',
    borderRadius: 8,
    marginHorizontal: 5,
  },
});

export default GameScreen;
