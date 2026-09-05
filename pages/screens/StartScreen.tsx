import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {MultiSelect} from 'react-native-element-dropdown';

import {getQuestionLabels} from '../../utils/questionloader';
import {useLocalization} from '../../i18n/LocalizationContext';
import {colors, radii, spacing} from '../../constants/theme';

type PackLabel = {label: string; value: string};

const migrateSelectedPacks = (items: unknown[]): string[] =>
  items
    .map(item => {
      if (item === 0) {
        return 'standard';
      }
      if (item === 1) {
        return 'movies-tv';
      }
      return typeof item === 'string' ? item : null;
    })
    .filter((item): item is string => item !== null);

const StartScreen = ({navigation}: any) => {
  const {language, t} = useLocalization();
  const [name, setName] = React.useState('');
  const [names, setNames] = React.useState<string[]>([]);
  const [questionPacks, setQuestionPacks] = React.useState<PackLabel[]>([]);
  const [selectedItems, setSelectedItems] = React.useState<string[]>([]);
  const [pointsToWinDisplay, setPointsToWinDisplay] = React.useState('10');

  React.useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('names'),
      AsyncStorage.getItem('customSet'),
      AsyncStorage.getItem('pointsToWin'),
    ])
      .then(([savedNames, savedPacks, savedPoints]) => {
        if (savedNames) {
          setNames(JSON.parse(savedNames));
        }
        if (savedPacks) {
          setSelectedItems(migrateSelectedPacks(JSON.parse(savedPacks)));
        }
        if (savedPoints && Number(savedPoints) > 0) {
          setPointsToWinDisplay(savedPoints);
        }
      })
      .catch(error => console.warn('Could not load game setup', error));
  }, []);

  const loadPackLabels = React.useCallback(() => {
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
  }, [language]);

  React.useEffect(() => {
    loadPackLabels();
    const unsubscribe = navigation.addListener('focus', loadPackLabels);
    return unsubscribe;
  }, [loadPackLabels, navigation]);

  React.useEffect(() => {
    AsyncStorage.setItem('names', JSON.stringify(names)).catch(error =>
      console.warn('Could not save players', error),
    );
  }, [names]);

  const updateSelectedItems = (items: string[]) => {
    setSelectedItems(items);
    AsyncStorage.setItem('customSet', JSON.stringify(items)).catch(error =>
      console.warn('Could not save selected packs', error),
    );
  };

  const addPlayer = () => {
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

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{t('homeEyebrow')}</Text>
          <Text style={styles.heroTitle}>{t('homeTitle')}</Text>
          <Text style={styles.heroSubtitle}>{t('homeSubtitle')}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <AntDesign name="appstore-o" size={20} color={colors.accent} />
            </View>
            <View style={styles.sectionHeadingText}>
              <Text style={styles.sectionTitle}>{t('packs')}</Text>
              <Text style={styles.sectionMeta}>
                {t('selectedCount', {count: selectedItems.length})}
              </Text>
            </View>
          </View>
          <MultiSelect
            style={styles.dropdown}
            containerStyle={styles.dropdownContainer}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownText}
            inputSearchStyle={styles.searchInput}
            itemTextStyle={styles.dropdownText}
            activeColor={colors.accentSoft}
            data={questionPacks}
            labelField="label"
            valueField="value"
            placeholder={t('choosePacks')}
            value={selectedItems}
            search
            searchPlaceholder={t('search')}
            onChange={updateSelectedItems}
            renderLeftIcon={() => (
              <AntDesign
                style={styles.dropdownIcon}
                color={colors.textMuted}
                name="folderopen"
                size={19}
              />
            )}
            renderSelectedItem={(
              item: PackLabel,
              unselect?: (item: PackLabel) => void,
            ) => (
              <TouchableOpacity
                onPress={() => unselect?.(item)}
                style={styles.packChip}>
                <Text style={styles.packChipText}>{item.label}</Text>
                <AntDesign name="close" size={14} color={colors.accent} />
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <AntDesign name="team" size={20} color={colors.accent} />
            </View>
            <View style={styles.sectionHeadingText}>
              <Text style={styles.sectionTitle}>{t('players')}</Text>
              <Text style={styles.sectionMeta}>{names.length}/12</Text>
            </View>
          </View>

          <View style={styles.playerInputRow}>
            <TextInput
              style={styles.textInput}
              placeholder={t('playerName')}
              placeholderTextColor={colors.textMuted}
              value={name}
              maxLength={26}
              returnKeyType="done"
              onSubmitEditing={addPlayer}
              onChangeText={setName}
            />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t('addPlayer')}
              style={styles.addButton}
              onPress={addPlayer}>
              <AntDesign name="plus" size={22} color={colors.black} />
            </TouchableOpacity>
          </View>

          {names.length === 0 ? (
            <Text style={styles.emptyText}>{t('noPlayers')}</Text>
          ) : (
            <View style={styles.playerChips}>
              {names.map((player, index) => (
                <View key={`${player}-${index}`} style={styles.playerChip}>
                  <Text numberOfLines={1} style={styles.playerChipText}>
                    {player}
                  </Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`${t('delete')} ${player}`}
                    onPress={() =>
                      setNames(current => current.filter((_, i) => i !== index))
                    }>
                    <AntDesign
                      name="close"
                      size={15}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.pointsRow}>
            <Text style={styles.pointsLabel}>{t('pointsToWin')}</Text>
            <TextInput
              style={styles.pointsInput}
              value={pointsToWinDisplay}
              placeholder="10"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              selectTextOnFocus
              onChangeText={updatePoints}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('CustomSets')}>
          <AntDesign name="edit" size={18} color={colors.text} />
          <Text style={styles.secondaryButtonText}>{t('editCustomSets')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.startButton} onPress={startGame}>
          <Text style={styles.startButtonText}>{t('start')}</Text>
          <AntDesign name="arrowright" size={21} color={colors.white} />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    padding: spacing.lg,
    paddingBottom: 48,
    gap: spacing.md,
  },
  hero: {paddingVertical: spacing.sm},
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 23,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.large,
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  sectionHeadingText: {flex: 1, marginLeft: 12},
  sectionTitle: {color: colors.text, fontSize: 18, fontWeight: '700'},
  sectionMeta: {color: colors.textMuted, fontSize: 13, marginTop: 2},
  dropdown: {
    minHeight: 54,
    borderRadius: radii.medium,
    paddingHorizontal: 14,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownContainer: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radii.medium,
    overflow: 'hidden',
  },
  dropdownPlaceholder: {fontSize: 15, color: colors.textMuted},
  dropdownText: {fontSize: 15, color: colors.text},
  dropdownIcon: {marginRight: 10},
  searchInput: {
    height: 44,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.text,
    fontSize: 15,
  },
  packChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: spacing.sm,
    marginRight: spacing.sm,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: '#28695F',
  },
  packChipText: {color: colors.text, fontSize: 13, fontWeight: '600'},
  playerInputRow: {flexDirection: 'row', gap: spacing.sm},
  textInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 14,
    borderRadius: radii.medium,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 16,
  },
  addButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.medium,
    backgroundColor: colors.accent,
  },
  emptyText: {color: colors.textMuted, fontSize: 14, marginTop: spacing.md},
  playerChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  playerChip: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
  },
  playerChipText: {
    maxWidth: 220,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pointsLabel: {color: colors.text, fontSize: 15, fontWeight: '600'},
  pointsInput: {
    width: 72,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {color: colors.text, fontSize: 15, fontWeight: '700'},
  startButton: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: radii.medium,
    backgroundColor: colors.primary,
  },
  startButtonText: {color: colors.white, fontSize: 18, fontWeight: '800'},
});

export default StartScreen;
