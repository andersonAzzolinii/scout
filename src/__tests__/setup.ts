// Global test setup
jest.mock('react-native', () => ({
  Animated: {
    Value: jest.fn().mockImplementation((val) => ({
      _value: val,
      setValue: jest.fn(),
      interpolate: jest.fn().mockReturnThis(),
    })),
    timing: jest.fn().mockReturnValue({ start: jest.fn((cb) => cb && cb()) }),
    spring: jest.fn().mockReturnValue({ start: jest.fn((cb) => cb && cb()) }),
    parallel: jest.fn().mockReturnValue({ start: jest.fn((cb) => cb && cb()) }),
    sequence: jest.fn().mockReturnValue({ start: jest.fn((cb) => cb && cb()) }),
  },
  PanResponder: {
    create: jest.fn().mockReturnValue({ panHandlers: {} }),
  },
  BackHandler: {
    addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  },
  Alert: {
    alert: jest.fn(),
  },
  Platform: { OS: 'android', select: jest.fn((obj) => obj.android) },
  Dimensions: { get: jest.fn().mockReturnValue({ width: 400, height: 800 }) },
  useWindowDimensions: jest.fn().mockReturnValue({ width: 400, height: 800 }),
}), { virtual: true });

jest.mock('expo-sqlite', () => ({}), { virtual: true });
jest.mock('expo-file-system/legacy', () => ({}), { virtual: true });
jest.mock('expo-image-picker', () => ({}), { virtual: true });
jest.mock('expo-document-picker', () => ({}), { virtual: true });
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'Icon' }), { virtual: true });
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}), { virtual: true });
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn().mockReturnValue({ top: 0, bottom: 0, left: 0, right: 0 }),
}), { virtual: true });
