import React from 'react';
import {Modal, Pressable, TextInput} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import renderer, {act} from 'react-test-renderer';
import {afterEach, beforeEach, expect, it, jest} from '@jest/globals';
import PackPicker from '../components/PackPicker';
import StartScreen from '../pages/screens/StartScreen';
import {
  LocalizationProvider,
  useLocalization,
} from '../i18n/LocalizationContext';

let tree: renderer.ReactTestRenderer | undefined;
const navigation = {addListener: () => () => {}, navigate: jest.fn()};

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

afterEach(() => {
  act(() => tree?.unmount());
  tree = undefined;
});

const press = (label: string) => {
  const button = tree!.root
    .findAllByType(Pressable)
    .find(node => node.props.accessibilityLabel === label);
  expect(button).toBeDefined();
  act(() => button!.props.onPress());
};

it('filters packs without losing hidden selections, and announces checkbox state', async () => {
  const Harness = () => {
    const [selectedIds, onChange] = React.useState(['standard']);
    return (
      <PackPicker
        visible
        packs={[
          {label: 'Standard', value: 'standard'},
          {label: 'Gaming', value: 'gaming'},
        ]}
        selectedIds={selectedIds}
        onChange={onChange}
        onClose={() => {}}
      />
    );
  };
  await act(async () => {
    tree = renderer.create(
      <LocalizationProvider>
        <Harness />
      </LocalizationProvider>,
    );
  });
  act(() => tree!.root.findByType(TextInput).props.onChangeText(' gAMing '));
  expect(
    tree!.root
      .findAllByType(Pressable)
      .some(node => node.props.accessibilityLabel === 'Standard'),
  ).toBe(false);
  press('Gaming');
  expect(tree!.root.findByType(PackPicker).props.selectedIds).toEqual([
    'standard',
    'gaming',
  ]);
  expect(
    tree!.root
      .findAllByType(Pressable)
      .find(node => node.props.accessibilityLabel === 'Gaming')!.props
      .accessibilityState.checked,
  ).toBe(true);
  press('Gaming');
  expect(tree!.root.findByType(PackPicker).props.selectedIds).toEqual([
    'standard',
  ]);
});

it('persists picker changes through close, language changes and game launch', async () => {
  await AsyncStorage.multiSet([
    ['names', '["Ada","Linus"]'],
    ['customSet', '["standard"]'],
    ['pointsToWin', '15'],
  ]);
  const SwitchLanguage = () => {
    const {setLanguage} = useLocalization();
    return (
      <Pressable
        accessibilityLabel="Switch to English"
        onPress={() => setLanguage('en')}
      />
    );
  };
  await act(async () => {
    tree = renderer.create(
      <LocalizationProvider>
        <StartScreen navigation={navigation} />
        <SwitchLanguage />
      </LocalizationProvider>,
    );
  });
  press('Themenpacks auswählen');
  await act(async () => press('Standard'));
  expect(await AsyncStorage.getItem('customSet')).toBe('[]');
  await act(async () => press('Standard'));
  press('Fertig');
  expect(
    tree!.root.findByType(PackPicker).findByType(Modal).props.visible,
  ).toBe(false);
  await act(async () => press('Switch to English'));
  press('Start round');
  expect(navigation.navigate).toHaveBeenCalledWith('Game', {
    names: ['Ada', 'Linus'],
    packIds: ['standard'],
    pointsToWin: 15,
    language: 'en',
  });
});

it('clears search when closing the picker, including Android back', async () => {
  const Harness = () => {
    const [visible, setVisible] = React.useState(true);
    return (
      <>
        <Pressable
          accessibilityLabel="Reopen"
          onPress={() => setVisible(true)}
        />
        <PackPicker
          visible={visible}
          packs={[]}
          selectedIds={[]}
          onChange={() => {}}
          onClose={() => setVisible(false)}
        />
      </>
    );
  };
  await act(async () => {
    tree = renderer.create(
      <LocalizationProvider>
        <Harness />
      </LocalizationProvider>,
    );
  });
  act(() => tree!.root.findByType(TextInput).props.onChangeText('nothing'));
  act(() =>
    tree!.root.findByType(PackPicker).findByType(Modal).props.onRequestClose(),
  );
  expect(
    tree!.root.findByType(PackPicker).findByType(Modal).props.visible,
  ).toBe(false);
  press('Reopen');
  expect(tree!.root.findByType(TextInput).props.value).toBe('');
});
