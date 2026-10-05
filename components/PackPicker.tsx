import React from 'react';
import {
  FlatList,
  Modal,
  StatusBar,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors, radii, spacing} from '../constants/theme';
import {useLocalization} from '../i18n/LocalizationContext';
import Button from './Button';
import CheckboxMark from './CheckboxMark';

export type PackLabel = {label: string; value: string};

type Props = {
  visible: boolean;
  packs: PackLabel[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
};

const PackPicker = ({
  visible,
  packs,
  selectedIds,
  onChange,
  onClose,
}: Props) => {
  const {t} = useLocalization();
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    if (!visible) {
      setSearch('');
    }
  }, [visible]);

  const filteredPacks = packs.filter(pack =>
    pack.label.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        {visible && (
          <StatusBar
            barStyle="dark-content"
            backgroundColor={colors.background}
          />
        )}
        <View style={styles.content}>
          <Text accessibilityRole="header" style={styles.title}>
            {t('choosePacks')}
          </Text>
          <TextInput
            accessibilityLabel={t('search')}
            style={styles.search}
            value={search}
            onChangeText={setSearch}
            placeholder={t('search')}
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
            returnKeyType="search"
          />
          <FlatList
            data={filteredPacks}
            keyExtractor={item => item.value}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ListEmptyComponent={
              <Text style={styles.empty}>{t('noMatchingPacks')}</Text>
            }
            renderItem={({item}) => {
              const selected = selectedIds.includes(item.value);
              return (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityLabel={item.label}
                  accessibilityState={{checked: selected}}
                  android_ripple={{color: colors.border}}
                  onPress={() =>
                    onChange(
                      selected
                        ? selectedIds.filter(id => id !== item.value)
                        : [...selectedIds, item.value],
                    )
                  }
                  style={({pressed}) => [
                    styles.row,
                    selected && styles.selectedRow,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={styles.packName}>{item.label}</Text>
                  <CheckboxMark checked={selected} />
                </Pressable>
              );
            }}
          />
          <View style={styles.footer}>
            <Text accessibilityLiveRegion="polite" style={styles.count}>
              {t('selectedCount', {count: selectedIds.length})}
            </Text>
            <Button label={t('done')} onPress={onClose} variant="primary" />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    padding: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '500',
    marginVertical: spacing.md,
  },
  search: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.control,
    paddingHorizontal: 12,
    color: colors.text,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedRow: {backgroundColor: colors.selectionSoft},
  pressed: {backgroundColor: colors.surface},
  packName: {flex: 1, color: colors.text, fontSize: 16, lineHeight: 23},
  empty: {color: colors.textMuted, fontSize: 16, paddingVertical: spacing.lg},
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  count: {flex: 1, color: colors.textMuted, fontSize: 14},
});

export default PackPicker;
