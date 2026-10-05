import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaView} from 'react-native-safe-area-context';
import Button from '../../components/Button';
import PackPicker, {PackLabel} from '../../components/PackPicker';

import {getQuestionLabels} from '../../utils/questionloader';
import {loadGameSetup} from '../../utils/gameSetup';
import {useLocalization} from '../../i18n/LocalizationContext';
import {colors, radii, spacing} from '../../constants/theme';

const StartScreen = ({navigation}: any) => {
  const {language, t} = useLocalization();
  const [isChoosingPacks, setIsChoosingPacks] = React.useState(false);
  const [name, setName] = React.useState('');
  const [names, setNames] = React.useState<string[]>([]);
  const [questionPacks, setQuestionPacks] = React.useState<PackLabel[]>([]);
  const [selectedItems, setSelectedItems] = React.useState<string[]>([]);
  const [pointsToWinDisplay, setPointsToWinDisplay] = React.useState('10');
  const [hasLoaded, setHasLoaded] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    loadGameSetup()
      .then(setup => {
        if (!active) {
          return;
        }
        setNames(setup.names);
        setSelectedItems(setup.packIds);
        setPointsToWinDisplay(setup.pointsToWin);
        // Persist stable IDs immediately, before a custom pack can be deleted
        // and change the meaning of an old numeric index on the next launch.
        AsyncStorage.setItem('customSet', JSON.stringify(setup.packIds)).catch(
          error => console.warn('Could not migrate selected packs', error),
        );
        setHasLoaded(true);
      })
      .catch(error => console.warn('Could not load game setup', error));
    return () => {
      active = false;
    };
  }, []);

  const loadPackLabels = React.useCallback(() => {
    if (!hasLoaded) {
      return;
    }
    getQuestionLabels(language).then(labels => {
      setQuestionPacks(labels);
      const availableIds = new Set(labels.map(label => label.value));
      setSelectedItems(current => {
        const validItems = current.filter(id => availableIds.has(id));
        if (validItems.length !== current.length) {
          AsyncStorage.setItem('customSet', JSON.stringify(validItems)).catch(
            error => console.warn('Could not clean selected packs', error),
          );
        }
        return validItems;
      });
    });
  }, [hasLoaded, language]);

  React.useEffect(() => {
    loadPackLabels();
    const unsubscribe = navigation.addListener('focus', loadPackLabels);
    return unsubscribe;
  }, [loadPackLabels, navigation]);

  React.useEffect(() => {
    if (!hasLoaded) {
      return;
    }
    AsyncStorage.setItem('names', JSON.stringify(names)).catch(error =>
      console.warn('Could not save players', error),
    );
  }, [hasLoaded, names]);

  const updateSelectedItems = (items: string[]) => {
    setSelectedItems(items);
    AsyncStorage.setItem('customSet', JSON.stringify(items)).catch(error =>
      console.warn('Could not save selected packs', error),
    );
  };

  const addPlayer = () => {
    if (!hasLoaded) {
      return;
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }
    if (trimmedName.length > 25) {
      Alert.alert(t('nameTooLongTitle'), t('nameTooLongMessage'));
      return;
    }
    if (names.length >= 12) {
      Alert.alert(t('tooManyPlayersTitle'), t('tooManyPlayersMessage'));
      return;
    }
    setNames(current => [...current, trimmedName]);
    setName('');
  };

  const updatePoints = (value: string) => {
    const digits = value.replace(/[^0-9]/g, '').slice(0, 3);
    setPointsToWinDisplay(digits);
    if (digits && Number(digits) > 0) {
      AsyncStorage.setItem('pointsToWin', digits).catch(error =>
        console.warn('Could not save target score', error),
      );
    }
  };

  const startGame = () => {
    if (!hasLoaded) {
      return;
    }
    if (names.length === 0) {
      Alert.alert(t('noPlayersTitle'), t('noPlayersMessage'));
      return;
    }
    if (selectedItems.length === 0) {
      Alert.alert(t('noPackTitle'), t('noPackMessage'));
      return;
    }

    const pointsToWin = Math.max(1, Number(pointsToWinDisplay) || 10);
    setPointsToWinDisplay(String(pointsToWin));
    navigation.navigate('Game', {
      names,
      packIds: selectedItems,
      pointsToWin,
      language,
    });
  };

  const selectedLabels = questionPacks
    .filter(pack => selectedItems.includes(pack.value))
    .map(pack => pack.label);

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <Text accessibilityRole="header" style={styles.title}>
            {t('startMenu')}
          </Text>

          <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              {t('players')}
            </Text>
            <View style={styles.playerInputRow}>
              <TextInput
                accessibilityLabel={t('playerName')}
                style={styles.textInput}
                placeholder={t('playerName')}
                placeholderTextColor={colors.textMuted}
                value={name}
                editable={hasLoaded}
                maxLength={26}
                returnKeyType="done"
                onSubmitEditing={addPlayer}
                onChangeText={setName}
              />
              <Button
                label={t('add')}
                accessibilityLabel={t('addPlayer')}
                onPress={addPlayer}
                disabled={!hasLoaded || !name.trim()}
              />
            </View>
            {names.length === 0 ? (
              <Text style={styles.helper}>{t('noPlayers')}</Text>
            ) : (
              <View style={styles.playerList}>
                {names.map((player, index) => (
                  <View key={`${player}-${index}`} style={styles.playerRow}>
                    <Text style={styles.playerName}>{player}</Text>
                    <Button
                      label={t('remove')}
                      accessibilityLabel={`${t('remove')} ${player}`}
                      variant="text"
                      onPress={() =>
                        setNames(current =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                    />
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              {t('packs')}
            </Text>
            <Text style={styles.helper}>
              {selectedLabels.length > 0
                ? selectedLabels.join(', ')
                : t('noPacksSelected')}
            </Text>
            <Button
              label={t('choosePacks')}
              disabled={!hasLoaded}
              onPress={() => setIsChoosingPacks(true)}
            />
          </View>

          <View style={styles.pointsRow}>
            <Text style={styles.pointsLabel}>{t('pointsToWin')}</Text>
            <TextInput
              accessibilityLabel={t('pointsToWin')}
              style={styles.pointsInput}
              value={pointsToWinDisplay}
              editable={hasLoaded}
              placeholder="10"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              selectTextOnFocus
              onChangeText={updatePoints}
            />
          </View>

          <Button
            label={t('start')}
            variant="primary"
            disabled={!hasLoaded}
            onPress={startGame}
          />
          <Button
            label={t('editCustomSets')}
            variant="text"
            onPress={() => navigation.navigate('CustomSets')}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      <PackPicker
        visible={isChoosingPacks}
        packs={questionPacks}
        selectedIds={selectedItems}
        onChange={updateSelectedItems}
        onClose={() => setIsChoosingPacks(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  content: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    padding: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '500',
    marginVertical: spacing.sm,
  },
  section: {paddingVertical: spacing.sm, gap: spacing.sm},
  sectionTitle: {color: colors.text, fontSize: 18, fontWeight: '500'},
  helper: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  playerInputRow: {flexDirection: 'row', gap: spacing.sm, alignItems: 'center'},
  textInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    color: colors.text,
    fontSize: 16,
  },
  playerList: {marginTop: spacing.sm},
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  playerName: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    lineHeight: 23,
    paddingVertical: spacing.sm,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pointsLabel: {flex: 1, color: colors.text, fontSize: 16},
  pointsInput: {
    width: 80,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.control,
    color: colors.text,
    fontSize: 18,
    textAlign: 'center',
  },
});

export default StartScreen;
