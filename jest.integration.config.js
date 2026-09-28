// 실제 Supabase에 요청하는 통합 테스트 전용 설정.
// jest-expo 프리셋은 전역 fetch를 Expo용 스텁으로 바꾸므로 쓰지 않고, Node 환경 + babel-preset-expo 변환만 쓴다.
const base = require('./package.json').jest;
// babel-preset-expo는 expo 패키지 안에 있다(최상위 node_modules에 없음).
const presetExpo = require.resolve('babel-preset-expo', { paths: [require.resolve('expo/package.json')] });

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.integration.test.ts'],
  transform: { '^.+\.[jt]sx?$': ['babel-jest', { presets: [presetExpo] }] },
  transformIgnorePatterns: base.transformIgnorePatterns,
  setupFiles: ['<rootDir>/jest.setup.js'],
};
