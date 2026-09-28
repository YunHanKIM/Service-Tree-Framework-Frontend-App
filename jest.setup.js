// AsyncStorage 네이티브 모듈은 Jest에 없으므로 공식 목을 쓴다.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// TanStack Query는 상태 알림을 setTimeout으로 미뤄 act() 밖에서 렌더가 일어난다. 테스트에서는 즉시 실행한다.
const { notifyManager } = require('@tanstack/react-query');
notifyManager.setScheduler((callback) => callback());
