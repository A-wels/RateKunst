const {jest} = require('@jest/globals');

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-vector-icons/AntDesign', () => 'AntDesign');

jest.mock('react-native-element-dropdown', () => ({
  MultiSelect: 'MultiSelect',
}));
