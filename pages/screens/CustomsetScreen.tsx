import React from 'react';
import {Alert, FlatList, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../../components/Button';

import {CUSTOM_SET_INDEX_KEY} from '../../utils/questionloader';
import {useLocalization} from '../../i18n/LocalizationContext';
import {colors, spacing} from '../../constants/theme';

type CustomSetSummary = {id: string; title: string; count: number};

const CustomsetScreen = ({navigation}: any) => {
  const {t} = useLocalization();
  const [customSets, setCustomSets] = React.useState<CustomSetSummary[]>([]);

  React.useEffect(() => {
    let active = true;
    let request = 0;
    const loadSets = async () => {
      const currentRequest = ++request;
      try {
        const storedIds = await AsyncStorage.getItem(CUSTOM_SET_INDEX_KEY);
        const parsed: unknown = storedIds ? JSON.parse(storedIds) : [];
        const ids = Array.isArray(parsed)
          ? [
              ...new Set(
                parsed.filter(
                  (id): id is string => typeof id === 'string' && id.length > 0,
                ),
              ),
            ]
          : [];
        const entries = await AsyncStorage.multiGet(ids);
        const summaries: CustomSetSummary[] = [];
        for (const [id, value] of entries) {
          if (!value) {
            continue;
          }
          // One damaged legacy record must not hide every other set.
          try {
            const set: unknown = JSON.parse(value);
            if (
              !Array.isArray(set) ||
              !set.every(item => typeof item === 'string')
            ) {
              continue;
            }
            const [title, ...questions] = set as string[];
            summaries.push({
              id,
              title: title || t('untitledSet'),
              count: questions.length,
            });
          } catch {
            console.warn('Could not parse custom pack', id);
          }
        }
        if (active && currentRequest === request) {
          setCustomSets(summaries);
        }
      } catch (error) {
        console.warn('Could not load custom packs', error);
      }
    };
    loadSets();
    const unsubscribe = navigation.addListener('focus', loadSets);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [t, navigation]);

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

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={customSets}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Button
              label={t('newSet')}
              variant="primary"
              onPress={() => navigation.navigate('EditSet', {id: null})}
            />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t('noCustomSets')}</Text>
            <Text style={styles.emptyBody}>{t('noCustomSetsBody')}</Text>
          </View>
        }
        renderItem={({item}) => (
          <View style={styles.setRow}>
            <View style={styles.setText}>
              <Text style={styles.setTitle}>{item.title}</Text>
              <Text style={styles.setCount}>
                {t('questionCount', {count: item.count})}
              </Text>
            </View>
            <View style={styles.actions}>
              <Button
                label={t('edit')}
                accessibilityLabel={`${t('edit')} ${item.title}`}
                variant="text"
                onPress={() => navigation.navigate('EditSet', {id: item.id})}
              />
              <Button
                label={t('delete')}
                accessibilityLabel={`${t('delete')} ${item.title}`}
                variant="danger"
                onPress={() => deleteSet(item)}
              />
            </View>
          </View>
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
    maxWidth: 640,
    alignSelf: 'center',
    padding: spacing.md,
  },
  header: {alignItems: 'flex-start', marginBottom: spacing.lg},
  empty: {paddingVertical: spacing.lg},
  emptyTitle: {color: colors.text, fontSize: 18, fontWeight: '500'},
  emptyBody: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  setRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  setText: {gap: spacing.xs},
  setTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 25,
  },
  setCount: {color: colors.textMuted, fontSize: 14},
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
});

export default CustomsetScreen;
