/* eslint-env jest */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-keychain', () => {
  const items = new Map();
  return {
    ACCESSIBLE: { AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'a' },
    STORAGE_TYPE: { AES_GCM_NO_AUTH: 's' },
    getGenericPassword: async ({ service }) => items.get(service) ?? false,
    setGenericPassword: async (username, password, { service }) => {
      items.set(service, { username, password, service });
      return { service, storage: 's' };
    },
    resetGenericPassword: async ({ service }) => items.delete(service),
  };
});
