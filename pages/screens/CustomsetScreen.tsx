import React from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AntDesign from 'react-native-vector-icons/AntDesign';

import {CUSTOM_SET_INDEX_KEY} from '../../utils/questionloader';
import {useLocalization} from '../../i18n/LocalizationContext';
import {colors, radii, spacing} from '../../constants/theme';

type CustomSetSummary = {id: string; title: string; count: number};

const CustomsetScreen = ({navigation}: any) => {
  const {t} = useLocalization();
  const [customSets, setCustomSets] = React.useState<CustomSetSummary[]>([]);

  const loadSets = React.useCallback(async () => {
    try {
      const storedIds = await AsyncStorage.getItem(CUSTOM_SET_INDEX_KEY);
      const ids: string[] = storedIds ? JSON.parse(storedIds) : [];
      const summaries = await Promise.all(
        ids.map(async id => {
          const value = await AsyncStorage.getItem(id);
          const [title, ...questions]: string[] = value
            ? JSON.parse(value)
            : [];
          return {
            id,
            title: title || t('untitledSet'),
            count: questions.length,
          };
        }),
      );
      setCustomSets(summaries.filter(set => set.count > 0));
    } catch (error) {
      console.warn('Could not load custom packs', error);
    }
  }, [t]);

  React.useEffect(() => {
    loadSets();
    const unsubscribe = navigation.addListener('focus', loadSets);
    return unsubscribe;
  }, [loadSets, navigation]);

  const deleteSet = (set: CustomSetSummary) => {
    Alert.alert(
      t('deleteSetTitle'),
      t('deleteSetMessage', {title: set.title}),
      [
        {text: t('cancel'), style: 'cancel'},
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            const remaining = customSets.filter(item => item.id !== set.id);
            await Promise.all([
              AsyncStorage.removeItem(set.id),
              AsyncStorage.setItem(
                CUSTOM_SET_INDEX_KEY,
                JSON.stringify(remaining.map(item => item.id)),
              ),
            ]);
            setCustomSets(remaining);
          },
        },
      ],
    );
  };

  const createButton = (
    <TouchableOpacity
      style={styles.createButton}
      onPress={() => navigation.navigate('EditSet', {id: null})}>
      <AntDesign name="plus" size={20} color={colors.black} />
      <Text style={styles.createButtonText}>{t('newSet')}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={customSets}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{t('customSets')}</Text>
            {customSets.length > 0 && createButton}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <AntDesign name="form" size={30} color={colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>{t('noCustomSets')}</Text>
            <Text style={styles.emptyBody}>{t('noCustomSetsBody')}</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('EditSet', {id: null})}>
              <AntDesign name="plus" size={20} color={colors.black} />
              <Text style={styles.createButtonText}>{t('createSet')}</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.setCard}
            onPress={() => navigation.navigate('EditSet', {id: item.id})}>
            <View style={styles.setIcon}>
              <AntDesign name="folder1" size={22} color={colors.accent} />
            </View>
            <View style={styles.setText}>
              <Text numberOfLines={1} style={styles.setTitle}>
                {item.title}
              </Text>
              <Text style={styles.setCount}>
                {t('categoryCount', {count: item.count})}
              </Text>
            </View>
            <TouchableOpacity
              accessibilityLabel={`${t('delete')} ${item.title}`}
              style={styles.deleteButton}
              onPress={() => deleteSet(item)}>
              <AntDesign name="delete" size={20} color={colors.danger} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {color: colors.text, fontSize: 28, fontWeight: '800'},
  createButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.accent,
  },
  createButtonText: {color: colors.black, fontSize: 14, fontWeight: '800'},
  emptyCard: {
    flex: 1,
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    borderRadius: radii.large,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '800',
    marginTop: spacing.lg,
  },
  emptyBody: {
    maxWidth: 360,
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  setCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: spacing.sm,
    borderRadius: radii.medium,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  setIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  setText: {flex: 1, marginHorizontal: 14},
  setTitle: {color: colors.text, fontSize: 17, fontWeight: '700'},
  setCount: {color: colors.textMuted, fontSize: 13, marginTop: 4},
  deleteButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#3A1D2A',
  },
});

export default CustomsetScreen;
