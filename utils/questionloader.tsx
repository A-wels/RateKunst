import AsyncStorage from '@react-native-async-storage/async-storage';
import { questionSet as initialQuestions } from '../constants/questions';

const getQuestions = async () => {
    const finalSet = initialQuestions.slice();

    try {
        const value = await AsyncStorage.getItem("@customSets");
        const data = value != null ? JSON.parse(value) : [];
        // load sets from local storage, specified by ids in data
        for (let i = 0; i < data.length; i++) {
            console.log("Loading set with id: " + data[i])
            const set = await AsyncStorage.getItem(data[i]);
            // parse set: first line is title, rest is set
            const parsedSet = JSON.parse(set);
            const title = parsedSet[0];
            const questions = parsedSet.slice(1);
            finalSet.push({ title: title, questions: questions });
            console.log("Added: " + finalSet[finalSet.length - 1].title)
        }


    } catch (e) {
        console.log(e);
    }

    // set the question set
    return finalSet;
}

const getQuestionLabels = async () => {
    // load all questions, return them as {label: title, value: index}
    const questions = await getQuestions();
    const labels = [];
    for (let i = 0; i < questions.length; i++) {
        labels.push({ label: questions[i].title, value: i });
    }
    return labels;
}
export { getQuestions, getQuestionLabels }